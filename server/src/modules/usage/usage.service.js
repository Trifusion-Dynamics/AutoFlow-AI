import { prisma } from '../../config/db.js';
import { quotaUtil } from '../../utils/quota.util.js';
import { logger } from '../../utils/logger.util.js';

export class UsageService {

  /**
   * Get current usage breakdown for an org.
   */
  async getCurrentUsage(orgId) {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        tokenUsage,
        executionsToday,
        executionsThisWeek,
        executionsThisMonth,
        activeWorkflows,
      ] = await Promise.all([
        quotaUtil.getTokenUsage(orgId),
        prisma.execution.count({
          where: { orgId, createdAt: { gte: startOfDay } },
        }),
        prisma.execution.count({
          where: { orgId, createdAt: { gte: startOfWeek } },
        }),
        prisma.execution.count({
          where: { orgId, createdAt: { gte: startOfMonth } },
        }),
        prisma.workflow.count({
          where: { orgId, status: 'active' },
        }),
      ]);

      return {
        tokens: {
          used: tokenUsage.used,
          quota: tokenUsage.quota,
          remaining: tokenUsage.remaining,
          percentage: tokenUsage.percentage,
          resetDate: tokenUsage.resetDate,
        },
        executions: {
          today: executionsToday,
          thisWeek: executionsThisWeek,
          thisMonth: executionsThisMonth,
        },
        activeWorkflows,
        period: 'current',
      };
    } catch (error) {
      logger.error('Failed to get current usage', { orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Get usage history with daily breakdown.
   */
  async getUsageHistory(orgId, period = '30d') {
    try {
      const now = new Date();
      let days;

      switch (period) {
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '90d': days = 90; break;
        default: days = 30;
      }

      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Get all executions in the period
      const executions = await prisma.execution.findMany({
        where: {
          orgId,
          createdAt: { gte: startDate },
        },
        select: {
          status: true,
          tokensUsed: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by date
      const dailyMap = {};

      for (let d = 0; d < days; d++) {
        const date = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000);
        const key = date.toISOString().split('T')[0];
        dailyMap[key] = {
          date: key,
          executions: 0,
          successes: 0,
          failures: 0,
          tokensUsed: 0,
          successRate: 0,
        };
      }

      for (const exec of executions) {
        const key = exec.createdAt.toISOString().split('T')[0];
        if (dailyMap[key]) {
          dailyMap[key].executions++;
          dailyMap[key].tokensUsed += exec.tokensUsed || 0;
          if (exec.status === 'success') {
            dailyMap[key].successes++;
          } else if (exec.status === 'failed') {
            dailyMap[key].failures++;
          }
        }
      }

      // Calculate success rates
      const daily = Object.values(dailyMap).map(day => ({
        ...day,
        successRate: day.executions > 0
          ? Math.round((day.successes / day.executions) * 100)
          : 0,
      }));

      return {
        period,
        days,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        daily,
      };
    } catch (error) {
      logger.error('Failed to get usage history', { orgId, period, error: error.message });
      throw error;
    }
  }

  /**
   * Get top workflows by different metrics.
   */
  async getTopWorkflows(orgId) {
    try {
      // Top 5 by execution count
      const topByExecutions = await prisma.workflow.findMany({
        where: { orgId },
        orderBy: { runCount: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          runCount: true,
          successCount: true,
          failCount: true,
          status: true,
        },
      });

      // Top 5 by failure rate (with at least 5 runs)
      const allWorkflows = await prisma.workflow.findMany({
        where: { orgId, runCount: { gte: 5 } },
        select: {
          id: true,
          name: true,
          runCount: true,
          successCount: true,
          failCount: true,
          status: true,
        },
      });

      const topByFailureRate = allWorkflows
        .map(wf => ({
          ...wf,
          failureRate: wf.runCount > 0 ? Math.round((wf.failCount / wf.runCount) * 100) : 0,
        }))
        .sort((a, b) => b.failureRate - a.failureRate)
        .slice(0, 5);

      // Top 5 by token usage (aggregate from executions)
      const tokenAgg = await prisma.execution.groupBy({
        by: ['workflowId'],
        where: { orgId },
        _sum: { tokensUsed: true },
        orderBy: { _sum: { tokensUsed: 'desc' } },
        take: 5,
      });

      const workflowIds = tokenAgg.map(t => t.workflowId);
      const workflowMap = {};
      if (workflowIds.length > 0) {
        const workflows = await prisma.workflow.findMany({
          where: { id: { in: workflowIds } },
          select: { id: true, name: true, status: true },
        });
        for (const wf of workflows) {
          workflowMap[wf.id] = wf;
        }
      }

      const topByTokens = tokenAgg.map(t => ({
        id: t.workflowId,
        name: workflowMap[t.workflowId]?.name || 'Unknown',
        status: workflowMap[t.workflowId]?.status || 'unknown',
        totalTokensUsed: t._sum.tokensUsed || 0,
      }));

      return {
        byExecutionCount: topByExecutions,
        byTokenUsage: topByTokens,
        byFailureRate: topByFailureRate,
      };
    } catch (error) {
      logger.error('Failed to get top workflows', { orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Get current rate limit status for a user.
   */
  async getRateLimitStatus(userId) {
    try {
      // Rate limit info comes from express-rate-limit headers
      // We can provide general info about the configured limits
      return {
        endpoints: {
          general: {
            windowMs: 60000,
            maxRequests: 200,
            description: 'General API rate limit',
          },
          auth: {
            windowMs: 60000,
            maxRequests: 10,
            description: 'Authentication endpoints rate limit',
          },
          webhooks: {
            windowMs: 60000,
            maxRequests: 100,
            description: 'Webhook endpoints rate limit',
          },
        },
        note: 'Current usage is reflected in X-RateLimit-* response headers',
      };
    } catch (error) {
      logger.error('Failed to get rate limit status', { userId, error: error.message });
      throw error;
    }
  }
}

export const usageService = new UsageService();
