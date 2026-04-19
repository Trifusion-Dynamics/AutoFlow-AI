import { prisma } from '../../config/db.js';

export class WorkflowRepository {
  async findById(id, orgId) {
    return await prisma.workflow.findFirst({
      where: { 
        id, 
        orgId,
        status: { not: 'archived' } 
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async findByOrgId(orgId, filters = {}, pagination = {}) {
    const { status, triggerType, search } = filters;
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      orgId,
      status: { not: 'archived' }
    };

    if (status) where.status = status;
    if (triggerType) where.triggerType = triggerType;
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.workflow.count({ where })
    ]);

    return { workflows, total };
  }

  async create(data) {
    return await prisma.workflow.create({
      data: {
        ...data,
        triggerConfig: data.triggerConfig || {},
        steps: data.steps || [],
        variables: data.variables || {}
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async update(id, orgId, data) {
    return await prisma.workflow.update({
      where: { 
        id,
        orgId
      },
      data: {
        ...data,
        triggerConfig: data.triggerConfig || undefined,
        steps: data.steps || undefined,
        variables: data.variables || undefined,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async softDelete(id, orgId) {
    return await prisma.workflow.update({
      where: { 
        id,
        orgId
      },
      data: {
        status: 'archived',
        updatedAt: new Date()
      }
    });
  }

  async updateStatus(id, orgId, status) {
    return await prisma.workflow.update({
      where: { 
        id,
        orgId
      },
      data: {
        status,
        updatedAt: new Date()
      }
    });
  }

  async incrementRunCount(id, success) {
    const updateData = {
      runCount: { increment: 1 },
      lastRunAt: new Date(),
      updatedAt: new Date()
    };

    if (success) {
      updateData.successCount = { increment: 1 };
    } else {
      updateData.failCount = { increment: 1 };
    }

    return await prisma.workflow.update({
      where: { id },
      data: updateData
    });
  }

  async findActiveCronWorkflows() {
    return await prisma.workflow.findMany({
      where: {
        triggerType: 'cron',
        status: 'active'
      }
    });
  }

  async findByWebhookId(workflowId, orgId) {
    return await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        orgId,
        triggerType: 'webhook',
        status: 'active'
      }
    });
  }
}

export const workflowRepository = new WorkflowRepository();
