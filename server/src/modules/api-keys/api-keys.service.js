import crypto from 'crypto';
import { apiKeyRepository } from './api-keys.repository.js';
import { cacheUtil } from '../../utils/cache.util.js';
import { logger } from '../../utils/logger.util.js';

export class ApiKeyService {
  async generateApiKey(orgId, userId, data) {
    // Generate API key
    const key = `ak_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = key.substring(0, 12);
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    // Save to database
    const apiKey = await apiKeyRepository.create({
      orgId,
      createdBy: userId,
      name: data.name,
      keyHash,
      keyPrefix,
      permissions: data.permissions,
      expiresAt: data.expiresAt,
    });

    // Log audit
    await this.logAuditEvent(orgId, userId, 'apikey.created', 'api_key', apiKey.id, {
      name: data.name,
      permissions: data.permissions,
    });

    logger.info('API key created', {
      apiKeyId: apiKey.id,
      orgId,
      userId,
      name: data.name,
    });

    // Return full key only once
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: key, // Full key - only returned once
      prefix: apiKey.keyPrefix,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  async listApiKeys(orgId, options) {
    const result = await apiKeyRepository.findByOrgId(orgId, options);
    
    logger.debug('API keys listed', {
      orgId,
      count: result.apiKeys.length,
      page: options.page,
    });

    return result;
  }

  async getApiKey(id, orgId) {
    const apiKey = await apiKeyRepository.findById(id, orgId);
    
    if (!apiKey) {
      throw new Error('API key not found');
    }

    return apiKey;
  }

  async revokeApiKey(id, orgId, userId) {
    const apiKey = await apiKeyRepository.findById(id, orgId);
    
    if (!apiKey) {
      throw new Error('API key not found');
    }

    await apiKeyRepository.revoke(id, orgId);

    // Invalidate any cache for this key
    await cacheUtil.invalidatePattern(`apikey:*`);

    // Log audit
    await this.logAuditEvent(orgId, userId, 'apikey.revoked', 'api_key', id, {
      name: apiKey.name,
    });

    logger.info('API key revoked', {
      apiKeyId: id,
      orgId,
      userId,
      name: apiKey.name,
    });

    return apiKey;
  }

  async authenticateApiKey(key) {
    // Hash the provided key
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    // Find in database
    const apiKey = await apiKeyRepository.findByKeyHash(keyHash);

    if (!apiKey) {
      return null;
    }

    // Check if key is active
    if (!apiKey.isActive) {
      return null;
    }

    // Check if key has expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    // Check if organization is active
    if (!apiKey.org.isActive) {
      return null;
    }

    // Update last used in background (don't await)
    apiKeyRepository.updateLastUsed(apiKey.id).catch(error => {
      logger.error('Failed to update API key last used', {
        apiKeyId: apiKey.id,
        error: error.message,
      });
    });

    logger.debug('API key authenticated', {
      apiKeyId: apiKey.id,
      orgId: apiKey.orgId,
      prefix: apiKey.keyPrefix,
    });

    return {
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions,
        lastUsedAt: apiKey.lastUsedAt,
      },
      org: apiKey.org,
      orgId: apiKey.orgId,
    };
  }

  async validateApiKeyPermissions(apiKeyAuth, requiredPermissions = []) {
    if (!apiKeyAuth || !apiKeyAuth.apiKey) {
      return false;
    }

    const userPermissions = apiKeyAuth.apiKey.permissions;
    
    // If no specific permissions required, just check if key exists
    if (requiredPermissions.length === 0) {
      return true;
    }

    // Check if all required permissions are present
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  }

  async deactivateExpiredKeys() {
    const deactivatedCount = await apiKeyRepository.deactivateExpiredKeys();
    
    if (deactivatedCount > 0) {
      logger.info(`Deactivated ${deactivatedCount} expired API keys`);
    }

    return deactivatedCount;
  }

  async getApiKeyStats(orgId) {
    const [total, active, expired] = await Promise.all([
      apiKeyRepository.countByOrgId(orgId),
      apiKeyRepository.findByOrgId(orgId, { status: 'active', limit: 1 }),
      apiKeyRepository.findExpiredKeys(),
    ]);

    return {
      total,
      active: active.pagination.total,
      expired: expired.length,
    };
  }

  async logAuditEvent(orgId, userId, action, resourceType, resourceId, details = {}) {
    try {
      const { prisma } = await import('../../config/db.js');
      await prisma.auditLog.create({
        data: {
          orgId,
          userId,
          action,
          resourceType,
          resourceId,
          details: JSON.stringify(details),
          ipAddress: details.ipAddress,
          userAgent: details.userAgent,
        },
      });
    } catch (error) {
      logger.error('Failed to log audit event', {
        error: error.message,
        action,
        orgId,
        userId,
      });
    }
  }
}

export const apiKeyService = new ApiKeyService();
