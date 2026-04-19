import { prisma } from '../../config/db.js';

export class WorkflowVersionRepository {
  async create(data) {
    return prisma.workflowVersion.create({
      data
    });
  }

  async findByWorkflowId(workflowId, orgId) {
    return prisma.workflowVersion.findMany({
      where: { workflowId, orgId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        changeNote: true,
        createdAt: true,
        changedBy: true,
        name: true
      }
    });
  }

  async findByVersion(workflowId, version, orgId) {
    return prisma.workflowVersion.findUnique({
      where: {
        workflowId_version: {
          workflowId,
          version
        }
      }
    });
  }
}

export const workflowVersionRepository = new WorkflowVersionRepository();
