import { prisma } from '../../config/db.js';
import { cacheUtil } from '../../utils/cache.util.js';
import { quotaUtil } from '../../utils/quota.util.js';
import { logger } from '../../utils/logger.util.js';
import { ROLES } from '../../config/constants.js';

export class OrgService {
  async getOrgDetails(orgId) {
    try {
      // Try to get from cache first
      const cached = await cacheUtil.getOrgCached(orgId);
      
      if (cached) {
        // Get additional data that's not cached
        const [memberCount, workflowCount] = await Promise.all([
          prisma.user.count({ where: { orgId, isActive: true } }),
          prisma.workflow.count({ where: { orgId } }),
        ]);

        return {
          ...cached,
          memberCount,
          workflowCount,
        };
      }

      // Fallback to database if cache fails
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
          _count: {
            select: {
              users: { where: { isActive: true } },
              workflows: true,
            },
          },
        },
      });

      if (!org) {
        throw new Error('Organization not found');
      }

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        tokenQuota: org.tokenQuota,
        tokenUsed: org.tokenUsed,
        isActive: org.isActive,
        settings: org.settings || {},
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        memberCount: org._count.users,
        workflowCount: org._count.workflows,
      };
    } catch (error) {
      logger.error('Failed to get organization details', {
        orgId,
        error: error.message,
      });
      throw error;
    }
  }

  async updateOrgSettings(orgId, userId, data) {
    try {
      // Get current organization to check permissions
      const currentOrg = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
          users: {
            where: { id: userId },
            select: { role: true },
          },
        },
      });

      if (!currentOrg) {
        throw new Error('Organization not found');
      }

      const userRole = currentOrg.users[0]?.role;

      // Check permissions
      if (data.name && userRole !== ROLES.OWNER) {
        throw new Error('Only organization owners can update the organization name');
      }

      if (data.settings && ![ROLES.OWNER, ROLES.ADMIN].includes(userRole)) {
        throw new Error('Only owners and admins can update organization settings');
      }

      // Prepare update data
      const updateData = {};
      
      if (data.name) {
        updateData.name = data.name;
      }

      if (data.settings) {
        // Merge with existing settings
        const currentSettings = currentOrg.settings || {};
        updateData.settings = {
          ...currentSettings,
          ...data.settings,
        };
      }

      // Update organization
      const updatedOrg = await prisma.organization.update({
        where: { id: orgId },
        data: updateData,
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          tokenQuota: true,
          tokenUsed: true,
          isActive: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Invalidate cache
      await cacheUtil.invalidateOrgCache(orgId);

      // Log audit
      await this.logAuditEvent(orgId, userId, 'org.updated', 'organization', orgId, {
        updatedFields: Object.keys(updateData),
      });

      logger.info('Organization settings updated', {
        orgId,
        userId,
        updatedFields: Object.keys(updateData),
      });

      return updatedOrg;
    } catch (error) {
      logger.error('Failed to update organization settings', {
        orgId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  async getOrgStats(orgId, period = 'month') {
    try {
      const now = new Date();
      let startDate;

      // Calculate start date based on period
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Get various statistics
      const [
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        avgExecutionTime,
        quotaStats,
      ] = await Promise.all([
        prisma.workflow.count({ where: { orgId } }),
        prisma.workflow.count({ where: { orgId, status: 'active' } }),
        prisma.execution.count({
          where: {
            orgId,
            createdAt: { gte: startDate },
          },
        }),
        prisma.execution.count({
          where: {
            orgId,
            status: 'success',
            createdAt: { gte: startDate },
          },
        }),
        prisma.execution.count({
          where: {
            orgId,
            status: 'failed',
            createdAt: { gte: startDate },
          },
        }),
        this.getAverageExecutionTime(orgId, startDate),
        quotaUtil.getOrgQuotaStats(orgId),
      ]);

      const successRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;

      return {
        period,
        workflows: {
          total: totalWorkflows,
          active: activeWorkflows,
        },
        executions: {
          total: totalExecutions,
          successful: successfulExecutions,
          failed: failedExecutions,
          successRate,
          averageTime: avgExecutionTime,
        },
        quota: quotaStats,
        dateRange: {
          start: startDate,
          end: now,
        },
      };
    } catch (error) {
      logger.error('Failed to get organization statistics', {
        orgId,
        period,
        error: error.message,
      });
      throw error;
    }
  }

  async getOrgUsage(orgId, period = 'month') {
    try {
      const now = new Date();
      let startDate;

      // Calculate start date based on period
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Get usage data
      const [
        quotaStats,
        executionCount,
        apiCallCount,
      ] = await Promise.all([
        quotaUtil.getOrgQuotaStats(orgId),
        prisma.execution.count({
          where: {
            orgId,
            createdAt: { gte: startDate },
          },
        }),
        this.getApiCallCount(orgId, startDate),
      ]);

      return {
        period,
        tokens: quotaStats,
        executions: {
          count: executionCount,
        },
        apiCalls: {
          count: apiCallCount,
        },
        dateRange: {
          start: startDate,
          end: now,
        },
      };
    } catch (error) {
      logger.error('Failed to get organization usage', {
        orgId,
        period,
        error: error.message,
      });
      throw error;
    }
  }

  async getOrgMembers(orgId) {
    try {
      const members = await prisma.user.findMany({
        where: { orgId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return members;
    } catch (error) {
      logger.error('Failed to get organization members', {
        orgId,
        error: error.message,
      });
      throw error;
    }
  }

  async updateMemberRole(orgId, userId, targetUserId, newRole) {
    try {
      // Check permissions
      const [currentUser, targetUser] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId, orgId }, select: { role: true } }),
        prisma.user.findUnique({ where: { id: targetUserId, orgId }, select: { role: true } }),
      ]);

      if (!currentUser || !targetUser) {
        throw new Error('User not found');
      }

      // Only owners and admins can change roles
      if (![ROLES.OWNER, ROLES.ADMIN].includes(currentUser.role)) {
        throw new Error('Only owners and admins can change member roles');
      }

      // Cannot change role of users with higher or equal role
      const roleHierarchy = { [ROLES.OWNER]: 4, [ROLES.ADMIN]: 3, [ROLES.MEMBER]: 2, [ROLES.VIEWER]: 1 };
      const currentUserLevel = roleHierarchy[currentUser.role];
      const targetUserLevel = roleHierarchy[targetUser.role];
      const newRoleLevel = roleHierarchy[newRole];

      if (targetUserLevel >= currentUserLevel) {
        throw new Error('Cannot change role of users with equal or higher role');
      }

      if (newRoleLevel >= currentUserLevel) {
        throw new Error('Cannot assign role equal or higher than your own');
      }

      // Update the role
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId, orgId },
        data: { role: newRole },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      // Log audit
      await this.logAuditEvent(orgId, userId, 'member.role_changed', 'user', targetUserId, {
        oldRole: targetUser.role,
        newRole: newRole,
      });

      logger.info('Member role updated', {
        orgId,
        userId,
        targetUserId,
        oldRole: targetUser.role,
        newRole: newRole,
      });

      return updatedUser;
    } catch (error) {
      logger.error('Failed to update member role', {
        orgId,
        userId,
        targetUserId,
        newRole,
        error: error.message,
      });
      throw error;
    }
  }

  async getAverageExecutionTime(orgId, startDate) {
    try {
      const result = await prisma.execution.aggregate({
        where: {
          orgId,
          createdAt: { gte: startDate },
          status: 'success',
          completedAt: { not: null },
          startedAt: { not: null },
        },
        _avg: {
          // This would need to be calculated as completedAt - startedAt
          // For now, return a placeholder
        },
      });

      // Placeholder calculation - in a real implementation, you'd calculate the actual duration
      return 45000; // 45 seconds average
    } catch (error) {
      logger.error('Failed to get average execution time', {
        orgId,
        error: error.message,
      });
      return 0;
    }
  }

  async getApiCallCount(orgId, startDate) {
    try {
      // This would typically come from your API logging system
      // For now, return a placeholder based on execution count
      const executionCount = await prisma.execution.count({
        where: {
          orgId,
          createdAt: { gte: startDate },
        },
      });

      // Estimate API calls (roughly 3-5 calls per execution)
      return executionCount * 4;
    } catch (error) {
      logger.error('Failed to get API call count', {
        orgId,
        error: error.message,
      });
      return 0;
    }
  }

  async logAuditEvent(orgId, userId, action, resourceType, resourceId, details = {}) {
    try {
      await prisma.auditLog.create({
        data: {
          orgId,
          userId,
          action,
          resourceType,
          resourceId,
          details: JSON.stringify(details),
        },
      });
    } catch (error) {
      logger.error('Failed to log audit event', {
        error: error.message,
        action,
        orgId,
        userId,
      });
    }
  }
}

export const orgService = new OrgService();
