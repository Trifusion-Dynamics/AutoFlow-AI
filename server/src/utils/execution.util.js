import { cacheUtil } from './cache.util.js';
import { logger } from './logger.util.js';

export class ExecutionUtil {
  async updateExecutionStatus(executionId, status, additionalData = {}) {
    try {
      const statusData = {
        status,
        updatedAt: new Date().toISOString(),
        ...additionalData,
      };

      // Set in Redis cache with TTL
      await cacheUtil.setExecutionStatusCached(executionId, statusData, 3600); // 1 hour TTL

      logger.debug('Execution status updated in Redis', {
        executionId,
        status,
        data: statusData,
      });

      return true;
    } catch (error) {
      logger.error('Failed to update execution status in Redis', {
        executionId,
        status,
        error: error.message,
      });
      return false;
    }
  }

  async startExecution(executionId, workflowId) {
    const startedAt = new Date().toISOString();
    
    return await this.updateExecutionStatus(executionId, 'running', {
      startedAt,
      workflowId,
    });
  }

  async completeExecution(executionId, result = {}) {
    const completedAt = new Date().toISOString();
    
    // Calculate duration if startedAt is available
    let durationMs = null;
    const currentStatus = await cacheUtil.getExecutionStatusCached(executionId);
    if (currentStatus?.startedAt) {
      durationMs = new Date(completedAt) - new Date(currentStatus.startedAt);
    }

    return await this.updateExecutionStatus(executionId, 'success', {
      completedAt,
      durationMs,
      ...result,
    });
  }

  async failExecution(executionId, error, result = {}) {
    const completedAt = new Date().toISOString();
    
    // Calculate duration if startedAt is available
    let durationMs = null;
    const currentStatus = await cacheUtil.getExecutionStatusCached(executionId);
    if (currentStatus?.startedAt) {
      durationMs = new Date(completedAt) - new Date(currentStatus.startedAt);
    }

    return await this.updateExecutionStatus(executionId, 'failed', {
      completedAt,
      durationMs,
      error: error.message || error,
      ...result,
    });
  }

  async timeoutExecution(executionId, result = {}) {
    const completedAt = new Date().toISOString();
    
    return await this.updateExecutionStatus(executionId, 'timeout', {
      completedAt,
      ...result,
    });
  }

  async updateExecutionProgress(executionId, progress) {
    return await this.updateExecutionStatus(executionId, 'running', {
      progress,
      lastProgressUpdate: new Date().toISOString(),
    });
  }

  async getExecutionStatus(executionId) {
    try {
      return await cacheUtil.getExecutionStatusCached(executionId);
    } catch (error) {
      logger.error('Failed to get execution status from Redis', {
        executionId,
        error: error.message,
      });
      return null;
    }
  }

  async clearExecutionStatus(executionId) {
    try {
      await cacheUtil.invalidateExecutionStatusCache(executionId);
      
      logger.debug('Execution status cleared from Redis', {
        executionId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to clear execution status from Redis', {
        executionId,
        error: error.message,
      });
      return false;
    }
  }

  async syncExecutionToDatabase(executionId) {
    try {
      // Get current status from Redis
      const status = await this.getExecutionStatus(executionId);
      
      if (!status) {
        return null;
      }

      // Update database with final status
      const { prisma } = await import('../config/db.js');
      
      const updateData = {
        status: status.status,
        completedAt: status.completedAt ? new Date(status.completedAt) : null,
      };

      if (status.tokensUsed) {
        updateData.tokensUsed = status.tokensUsed;
      }

      if (status.error) {
        updateData.error = status.error;
      }

      const updatedExecution = await prisma.execution.update({
        where: { id: executionId },
        data: updateData,
      });

      // Clear from Redis after successful sync
      await this.clearExecutionStatus(executionId);

      logger.info('Execution synced to database', {
        executionId,
        status: status.status,
      });

      return updatedExecution;
    } catch (error) {
      logger.error('Failed to sync execution to database', {
        executionId,
        error: error.message,
      });
      throw error;
    }
  }

  async cleanupExpiredExecutionStatus() {
    try {
      // This would typically be run as a cleanup job
      // For now, it's a placeholder for future implementation
      logger.info('Cleaning up expired execution status entries');
      
      // Implementation would involve scanning Redis keys with pattern
      // and removing entries that are older than a certain threshold
      
      return 0;
    } catch (error) {
      logger.error('Failed to cleanup expired execution status', {
        error: error.message,
      });
      return 0;
    }
  }
}

export const executionUtil = new ExecutionUtil();
