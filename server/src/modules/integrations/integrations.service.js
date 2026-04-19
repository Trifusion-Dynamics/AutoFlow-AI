import { integrationRegistry } from '../../integrations/index.js';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.util.js';
// import { encrypt, decrypt } from '../../utils/encryption.util.js'; // Assuming encryption utils exist

export class IntegrationsService {
  async getAvailableIntegrations(orgId) {
    const integrations = integrationRegistry.getAll();
    const connected = await prisma.toolConfig.findMany({
      where: { orgId, isActive: true }
    });

    const connectedMap = new Map(connected.map(c => [c.toolName, c]));

    return integrations.map(int => ({
      name: int.name,
      displayName: int.displayName,
      description: int.description,
      icon: int.icon,
      isConnected: connectedMap.has(int.name),
      actions: int.getActions()
    }));
  }

  async connectIntegration(orgId, userId, integrationName, credentials) {
    const integration = integrationRegistry.get(integrationName);
    if (!integration) {
      throw new AppError('Integration not supported', 'INTEGRATION_NOT_FOUND', 404);
    }

    // Validate credentials with Zod
    const validated = integration.configSchema.safeParse(credentials);
    if (!validated.success) {
      throw new AppError('Invalid credentials', 'INVALID_CREDENTIALS', 400, validated.error.format());
    }

    // Test connection
    const isWorking = await integration.testConnection(validated.data);
    if (!isWorking) {
      throw new AppError('Connection test failed', 'CONNECTION_TEST_FAILED', 400);
    }

    // Encrypt credentials (Mocking for now)
    const encryptedConfig = JSON.stringify(validated.data); 

    const config = await prisma.toolConfig.upsert({
      where: {
        orgId_toolName: { orgId, toolName: integrationName }
      },
      update: {
        config: encryptedConfig,
        isActive: true
      },
      create: {
        orgId,
        toolName: integrationName,
        config: encryptedConfig,
        isActive: true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'integration.connected',
        resourceType: 'integration',
        resourceId: integrationName
      }
    });

    return { connected: true, integration: integrationName };
  }

  async disconnectIntegration(orgId, userId, integrationName) {
    await prisma.toolConfig.delete({
      where: {
        orgId_toolName: { orgId, toolName: integrationName }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'integration.disconnected',
        resourceType: 'integration',
        resourceId: integrationName
      }
    });

    return { success: true };
  }
}

export const integrationsService = new IntegrationsService();
