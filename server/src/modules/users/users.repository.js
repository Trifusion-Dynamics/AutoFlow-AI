import { prisma } from '../../config/db.js';

export class UsersRepository {
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        orgId: true,
      },
    });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        orgId: true,
      },
    });
  }

  async findByOrgId(orgId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const { skip, take } = this._getSkipTake(page, limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { orgId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where: { orgId } }),
    ]);

    return { users, total };
  }

  async create(data) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        orgId: true,
      },
    });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        orgId: true,
      },
    });
  }

  async delete(id) {
    // Soft delete by setting isActive to false
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        orgId: true,
      },
    });
  }

  async findWithOrg(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            tokenQuota: true,
            tokenUsed: true,
          },
        },
      },
    });
  }

  async updateRole(id, role) {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        orgId: true,
      },
    });
  }

  async findByEmailWithPassword(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        org: true,
      },
    });
  }

  _getSkipTake(page, limit) {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }
}

export const usersRepository = new UsersRepository();
