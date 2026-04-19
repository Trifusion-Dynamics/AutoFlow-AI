import { prisma } from '../../config/db.js';
import { redisHelpers } from '../../config/redis.js';
import { logger } from '../../utils/logger.util.js';

export class AnalyticsService {
  async getExecutionAnalytics(orgId, options = {}) {
    const { from, to, workflowId } = options;
    const cacheKey = `analytics:exec:${orgId}:${workflowId || 'all'}:${from}:${to}`;
    
    // Check cache
    const cached = await redisHelpers.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where = { orgId };
    if (workflowId) where.workflowId = workflowId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    // 1. Summary Metrics
    const aggregate = await prisma.execution.aggregate({
      where,
      _count: { id: true },
      _sum: { tokensUsed: true },
      _avg: { durationMs: true }
    });

    const successCount = await prisma.execution.count({
      where: { ...where, status: 'success' }
    });

    const failedCount = await prisma.execution.count({
      where: { ...where, status: 'failed' }
    });

    // 2. Timeline (grouped by day)
    const timeline = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(id) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM("tokensUsed") as tokens
      FROM executions
      WHERE "orgId" = ${orgId}
      AND "createdAt" >= ${new Date(from || Date.now() - 30 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;

    // 3. Breakdown by Workflow
    const byWorkflow = await prisma.execution.groupBy({
      by: ['workflowId'],
      where,
      _count: { id: true },
      _avg: { durationMs: true, tokensUsed: true }
    });

    // Fetch workflow names
    const workflows = await prisma.workflow.findMany({
      where: { id: { in: byWorkflow.map(b => b.workflowId) } },
      select: { id: true, name: true }
    });
    const workflowMap = new Map(workflows.map(w => [w.id, w.name]));

    const result = {
      summary: {
        total: aggregate._count.id,
        success: successCount,
        failed: failedCount,
        successRate: aggregate._count.id > 0 ? (successCount / aggregate._count.id) * 100 : 0,
        avgDuration: aggregate._avg.durationMs || 0,
        totalTokens: aggregate._sum.tokensUsed || 0
      },
      timeline,
      byWorkflow: byWorkflow.map(b => ({
        workflowId: b.workflowId,
        name: workflowMap.get(b.workflowId) || 'Unknown',
        total: b._count.id,
        avgDuration: b._avg.durationMs,
        avgTokens: b._avg.tokensUsed
      }))
    };

    // Cache for 5 minutes
    await redisHelpers.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async getTokenAnalytics(orgId) {
    // Breakdown of tokens by model, tool, etc.
    const byModel = await prisma.execution.groupBy({
      by: ['workflowId'], // Simplified
      where: { orgId },
      _sum: { tokensUsed: true }
    });

    return { byModel };
  }

  async getPerformanceMetrics(orgId) {
    const slowestWorkflows = await prisma.execution.groupBy({
      by: ['workflowId'],
      where: { orgId, status: 'success' },
      _avg: { durationMs: true },
      orderBy: { _avg: { durationMs: 'desc' } },
      take: 5
    });

    return { slowestWorkflows };
  }
}

export const analyticsService = new AnalyticsService();
