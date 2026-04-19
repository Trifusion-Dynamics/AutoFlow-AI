import { prisma } from '../../config/db.js';

export class ApiKeyRepository {
  async create(data) {
    return await prisma.apiKey.create({
      data: {
        orgId: data.orgId,
        createdBy: data.createdBy,
        name: data.name,
        keyHash: data.keyHash,
        keyPrefix: data.keyPrefix,
        permissions: data.permissions,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  }

  async findByKeyHash(keyHash) {
    return await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
      },
    });
  }

  async findByOrgId(orgId, options = {}) {
    const { page = 1, limit = 20, status, permission } = options;
    const skip = (page - 1) * limit;

    const where = {
      orgId,
      ...(status && { isActive: status === 'active' }),
      ...(permission && { permissions: { has: permission } }),
    };

    const [apiKeys, total] = await Promise.all([
      prisma.apiKey.findMany({
        where,
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          permissions: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
          lastUsedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.apiKey.count({ where }),
    ]);

    return {
      apiKeys,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id, orgId) {
    return await prisma.apiKey.findFirst({
      where: { id, orgId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  }

  async revoke(id, orgId) {
    return await prisma.apiKey.update({
      where: { id, orgId },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  }

  async updateLastUsed(id) {
    return await prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async findActiveById(id) {
    return await prisma.apiKey.findUnique({
      where: { id, isActive: true },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
      },
    });
  }

  async countByOrgId(orgId) {
    return await prisma.apiKey.count({
      where: { orgId },
    });
  }

  async findExpiredKeys() {
    return await prisma.apiKey.findMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
        isActive: true,
      },
      select: {
        id: true,
        orgId: true,
        name: true,
      },
    });
  }

  async deactivateExpiredKeys() {
    const expiredKeys = await this.findExpiredKeys();
    
    if (expiredKeys.length > 0) {
      await prisma.apiKey.updateMany({
        where: {
          id: { in: expiredKeys.map(key => key.id) },
        },
        data: { isActive: false },
      });
    }

    return expiredKeys.length;
  }
}

export const apiKeyRepository = new ApiKeyRepository();
