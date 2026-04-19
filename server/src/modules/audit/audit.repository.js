import { prisma } from '../../config/db.js';

export class AuditRepository {
  async findByOrgId(orgId, filters = {}, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const { action, userId, resourceType, from, to } = filters;
    
    const skip = (page - 1) * limit;

    const where = {
      orgId,
      ...(action && { action }),
      ...(userId && { userId }),
      ...(resourceType && { resourceType }),
      ...(from && { createdAt: { gte: new Date(from) } }),
      ...(to && { createdAt: { lte: new Date(to) } }),
    };

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      auditLogs: auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        details: log.details ? JSON.parse(log.details) : null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        user: log.user,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id, orgId) {
    const auditLog = await prisma.auditLog.findFirst({
      where: { id, orgId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!auditLog) {
      return null;
    }

    return {
      id: auditLog.id,
      action: auditLog.action,
      resourceType: auditLog.resourceType,
      resourceId: auditLog.resourceId,
      details: auditLog.details ? JSON.parse(auditLog.details) : null,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      createdAt: auditLog.createdAt,
      user: auditLog.user,
    };
  }

  async getAuditStats(orgId, filters = {}) {
    const { from, to } = filters;
    
    const where = {
      orgId,
      ...(from && { createdAt: { gte: new Date(from) } }),
      ...(to && { createdAt: { lte: new Date(to) } }),
    };

    const [
      totalLogs,
      actionCounts,
      resourceTypeCounts,
      userCounts,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      
      prisma.auditLog.groupBy({
        by: ['resourceType'],
        where,
        _count: { resourceType: true },
        orderBy: { _count: { resourceType: 'desc' } },
        take: 10,
      }),
      
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    // Get user details for user counts
    const userIds = userCounts.map(uc => uc.userId);
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    }) : [];

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    return {
      totalLogs,
      topActions: actionCounts.map(ac => ({
        action: ac.action,
        count: ac._count.action,
      })),
      topResourceTypes: resourceTypeCounts.map(rc => ({
        resourceType: rc.resourceType,
        count: rc._count.resourceType,
      })),
      topUsers: userCounts.map(uc => ({
        user: userMap[uc.userId] || { id: uc.userId, name: 'Unknown', email: 'unknown' },
        count: uc._count.userId,
      })),
    };
  }

  async cleanupOldLogs(orgId, daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        orgId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  async create(data) {
    return await prisma.auditLog.create({
      data: {
        orgId: data.orgId,
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async findByUserId(orgId, userId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      orgId,
      userId,
    };

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      auditLogs: auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        details: log.details ? JSON.parse(log.details) : null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        user: log.user,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findByResource(orgId, resourceType, resourceId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      orgId,
      resourceType,
      resourceId,
    };

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      auditLogs: auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        details: log.details ? JSON.parse(log.details) : null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        user: log.user,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export const auditRepository = new AuditRepository();
