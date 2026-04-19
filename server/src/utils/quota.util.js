import { redisHelpers } from '../config/redis.js';
import { REDIS_KEYS } from '../config/constants.js';
import { cacheUtil } from './cache.util.js';
import { logger } from './logger.util.js';

export class QuotaUtil {
  async checkAndConsumeTokens(orgId, tokensToUse) {
    try {
      // Get current month key
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      
      const redisKey = REDIS_KEYS.ORG_TOKENS(orgId, monthKey);

      // Get current usage with Redis INCR (atomic operation)
      const currentUsage = await redisHelpers.incr(redisKey);

      // Set expiry for the key (end of current month)
      const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);
      const ttlSeconds = Math.floor((endOfMonth.getTime() - now.getTime()) / 1000);
      if (ttlSeconds > 0) {
        await redisHelpers.expire(redisKey, ttlSeconds);
      }

      // Get organization quota from cache or database
      const org = await cacheUtil.getOrgCached(orgId);
      
      if (!org) {
        throw new Error('Organization not found');
      }

      const quota = org.tokenQuota || 0;

      // Check if quota exceeded
      if (currentUsage > quota) {
        // Rollback the increment
        await redisHelpers.del(redisKey);
        
        throw new QuotaExceededError(`Token quota exceeded. Used: ${currentUsage}, Quota: ${quota}`);
      }

      const remaining = quota - currentUsage;

      logger.debug('Token quota checked and consumed', {
        orgId,
        tokensUsed: tokensToUse,
        currentUsage,
        quota,
        remaining,
        monthKey,
      });

      return {
        allowed: true,
        remaining,
        used: currentUsage,
        quota,
        monthKey,
      };
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        throw error;
      }
      
      logger.error('Failed to check and consume tokens', {
        orgId,
        tokensToUse,
        error: error.message,
      });
      
      // On Redis error, allow the request but log it
      return {
        allowed: true,
        remaining: 0,
        used: 0,
        quota: 0,
        fallback: true,
      };
    }
  }

  async getTokenUsage(orgId) {
    try {
      // Get current month key
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      
      const redisKey = REDIS_KEYS.ORG_TOKENS(orgId, monthKey);

      // Get current usage from Redis
      const usage = await redisHelpers.get(redisKey);
      const currentUsage = usage ? parseInt(usage, 10) : 0;

      // Get organization quota from cache or database
      const org = await cacheUtil.getOrgCached(orgId);
      
      if (!org) {
        throw new Error('Organization not found');
      }

      const quota = org.tokenQuota || 0;
      const remaining = Math.max(0, quota - currentUsage);

      // Calculate reset date (first day of next month)
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      return {
        used: currentUsage,
        quota,
        remaining,
        resetDate,
        monthKey,
        percentage: quota > 0 ? Math.round((currentUsage / quota) * 100) : 0,
      };
    } catch (error) {
      logger.error('Failed to get token usage', {
        orgId,
        error: error.message,
      });
      
      // Fallback to database
      return await this.getTokenUsageFromDB(orgId);
    }
  }

  async getTokenUsageFromDB(orgId) {
    try {
      const { prisma } = await import('../config/db.js');
      
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { tokenQuota: true, tokenUsed: true },
      });

      if (!org) {
        throw new Error('Organization not found');
      }

      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      return {
        used: org.tokenUsed || 0,
        quota: org.tokenQuota || 0,
        remaining: Math.max(0, (org.tokenQuota || 0) - (org.tokenUsed || 0)),
        resetDate,
        fallback: true,
      };
    } catch (error) {
      logger.error('Failed to get token usage from database', {
        orgId,
        error: error.message,
      });
      
      throw error;
    }
  }

  async syncTokenUsageToDB(orgId) {
    try {
      // Get current month key
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      
      const redisKey = REDIS_KEYS.ORG_TOKENS(orgId, monthKey);

      // Get current usage from Redis
      const usage = await redisHelpers.get(redisKey);
      const currentUsage = usage ? parseInt(usage, 10) : 0;

      // Update database
      const { prisma } = await import('../config/db.js');
      
      await prisma.organization.update({
        where: { id: orgId },
        data: { tokenUsed: currentUsage },
      });

      logger.info('Token usage synced to database', {
        orgId,
        usage: currentUsage,
        monthKey,
      });

      return currentUsage;
    } catch (error) {
      logger.error('Failed to sync token usage to database', {
        orgId,
        error: error.message,
      });
      
      throw error;
    }
  }

  async resetMonthlyQuota() {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;

      logger.info('Resetting monthly token quotas', { monthKey });

      // Reset all organization Redis counters for the new month
      const pattern = REDIS_KEYS.ORG_TOKENS('*', monthKey);
      const client = redisHelpers.getClient();
      const keys = await client.keys(pattern);

      if (keys.length > 0) {
        await client.del(...keys);
        logger.info(`Cleared ${keys.length} Redis token counters for new month`, {
          monthKey,
        });
      }

      // Reset database tokenUsed for all organizations
      const { prisma } = await import('../config/db.js');
      
      const result = await prisma.organization.updateMany({
        data: { tokenUsed: 0 },
      });

      logger.info('Monthly token quotas reset in database', {
        organizationsUpdated: result.count,
        monthKey,
      });

      return {
        redisKeysCleared: keys.length,
        organizationsUpdated: result.count,
        monthKey,
      };
    } catch (error) {
      logger.error('Failed to reset monthly quotas', {
        error: error.message,
      });
      
      throw error;
    }
  }

  async getOrgQuotaStats(orgId) {
    try {
      const usage = await this.getTokenUsage(orgId);
      
      // Get additional stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { prisma } = await import('../config/db.js');
      
      // Get execution count for current month
      const executionCount = await prisma.execution.count({
        where: {
          orgId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      // Get successful executions
      const successfulExecutions = await prisma.execution.count({
        where: {
          orgId,
          status: 'success',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      const successRate = executionCount > 0 ? Math.round((successfulExecutions / executionCount) * 100) : 0;

      return {
        ...usage,
        executionCount,
        successfulExecutions,
        successRate,
        daysUntilReset: Math.ceil((usage.resetDate - now) / (1000 * 60 * 60 * 24)),
      };
    } catch (error) {
      logger.error('Failed to get org quota stats', {
        orgId,
        error: error.message,
      });
      
      throw error;
    }
  }

  async estimateTokensForExecution(workflowId, input = {}) {
    try {
      // This is a simple estimation - in a real implementation, you might
      // want to analyze the workflow complexity and input size
      
      const { prisma } = await import('../config/db.js');
      
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { 
          name: true,
          triggerConfig: true,
          createdAt: true,
        },
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Base token estimation
      let estimatedTokens = 1000; // Base cost

      // Add tokens based on input size
      const inputSize = JSON.stringify(input).length;
      estimatedTokens += Math.ceil(inputSize / 4); // Rough estimate

      // Add tokens based on workflow complexity (placeholder logic)
      const workflowAge = Date.now() - workflow.createdAt.getTime();
      const complexityFactor = Math.min(workflowAge / (1000 * 60 * 60 * 24 * 30), 2); // Max 2x for older workflows
      estimatedTokens *= (1 + complexityFactor);

      return Math.ceil(estimatedTokens);
    } catch (error) {
      logger.error('Failed to estimate tokens for execution', {
        workflowId,
        error: error.message,
      });
      
      // Return a conservative estimate
      return 2000;
    }
  }
}

export class QuotaExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QuotaExceededError';
    this.code = 'QUOTA_EXCEEDED';
    this.statusCode = 429;
  }
}

export const quotaUtil = new QuotaUtil();
