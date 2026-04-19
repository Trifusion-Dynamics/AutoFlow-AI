import { prisma } from '../../config/db.js';

export class ExecutionRepository {
  async findById(id, orgId) {
    return await prisma.execution.findFirst({
      where: { 
        id, 
        orgId 
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            triggerType: true
          }
        }
      }
    });
  }

  async findByWorkflowId(workflowId, orgId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      workflowId,
      orgId
    };

    const [executions, total] = await Promise.all([
      prisma.execution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
              triggerType: true
            }
          }
        }
      }),
      prisma.execution.count({ where })
    ]);

    return { executions, total };
  }

  async findByOrgId(orgId, filters = {}, pagination = {}) {
    const { status, workflowId, from, to } = filters;
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    // Building raw SQL for optimization (COUNT OVER pattern)
    // This avoids a separate Promise.all with prisma.count()
    let whereClause = `WHERE "orgId" = $1`;
    const params = [orgId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND "status" = $${paramIndex++}`;
      params.push(status);
    }
    if (workflowId) {
      whereClause += ` AND "workflowId" = $${paramIndex++}`;
      params.push(workflowId);
    }
    if (from) {
      whereClause += ` AND "createdAt" >= $${paramIndex++}`;
      params.push(new Date(from));
    }
    if (to) {
      whereClause += ` AND "createdAt" <= $${paramIndex++}`;
      params.push(new Date(to));
    }

    const query = `
      SELECT e.*, w.name as "workflowName", w."triggerType" as "workflowTriggerType",
             COUNT(*) OVER() as "totalCount"
      FROM "executions" e
      JOIN "workflows" w ON e."workflowId" = w.id
      ${whereClause}
      ORDER BY e."createdAt" DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, skip);

    const results = await prisma.$queryRawUnsafe(query, ...params);
    
    const total = results.length > 0 ? Number(results[0].totalCount) : 0;
    
    // Format to match Prisma's output structure
    const executions = results.map(r => {
      const { totalCount, workflowName, workflowTriggerType, ...execution } = r;
      return {
        ...execution,
        workflow: {
          id: execution.workflowId,
          name: workflowName,
          triggerType: workflowTriggerType
        }
      };
    });

    return { executions, total };
  }


  async create(data) {
    return await prisma.execution.create({
      data: {
        ...data,
        triggerData: data.triggerData || {}
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            triggerType: true
          }
        }
      }
    });
  }

  async updateStatus(id, status, extra = {}) {
    return await prisma.execution.update({
      where: { id },
      data: {
        status,
        ...extra,
        updatedAt: new Date()
      }
    });
  }

  async getStats(orgId) {
    const stats = await prisma.execution.groupBy({
      by: ['status'],
      where: { orgId },
      _count: { id: true },
      _avg: { durationMs: true }
    });

    const result = {
      total: 0,
      success: 0,
      failed: 0,
      running: 0,
      pending: 0,
      avgDuration: 0
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const stat of stats) {
      result.total += stat._count.id;
      
      switch (stat.status) {
        case 'success':
          result.success = stat._count.id;
          break;
        case 'failed':
          result.failed = stat._count.id;
          break;
        case 'running':
          result.running = stat._count.id;
          break;
        case 'pending':
          result.pending = stat._count.id;
          break;
      }

      if (stat._avg.durationMs) {
        totalDuration += stat._avg.durationMs;
        durationCount++;
      }
    }

    if (durationCount > 0) {
      result.avgDuration = Math.round(totalDuration / durationCount);
    }

    return result;
  }
}

export const executionRepository = new ExecutionRepository();
