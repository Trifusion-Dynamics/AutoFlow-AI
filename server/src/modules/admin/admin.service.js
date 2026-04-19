import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/errors.js';

class AdminService {
  /**
   * List all organizations with stats
   */
  async getAllOrganizations(query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({
        include: {
          _count: {
            select: {
              users: true,
              workflows: true,
              executions: true
            }
          },
          subscription: {
            include: { plan: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.organization.count()
    ]);

    return {
      orgs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get global system stats
   */
  async getSystemStats() {
    const [
      orgCount, 
      userCount, 
      workflowCount, 
      executionCount,
      activeSubscriptions
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.workflow.count(),
      prisma.execution.count(),
      prisma.orgSubscription.count({ where: { status: 'active' } })
    ]);

    // Monthly growth stats (simplified)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const newOrgsLastMonth = await prisma.organization.count({
      where: { createdAt: { gte: lastMonth } }
    });

    return {
      totalOrganizations: orgCount,
      totalUsers: userCount,
      totalWorkflows: workflowCount,
      totalExecutions: executionCount,
      activeSubscriptions,
      growth: {
        newOrgsLastMonth
      }
    };
  }

  /**
   * Manually update an organization's plan (Admin override)
   */
  async updateOrgPlan(orgId, planName, customQuota = null) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundError('Organization not found');

    // Reuse logic from billing service (or import it)
    const { billingService } = await import('../billing/billing.service.js');
    const result = await billingService.upgradePlan(orgId, planName);

    if (customQuota) {
      await prisma.organization.update({
        where: { id: orgId },
        data: { tokenQuota: customQuota }
      });
    }

    return result;
  }

  /**
   * Impersonate a user (generate a short-lived token)
   * This is a powerful tool, record it in audit logs
   */
  async impersonateUser(adminId, targetUserId) {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { org: true }
    });

    if (!targetUser) throw new NotFoundError('User not found');

    // Log the impersonation event
    await prisma.auditLog.create({
      data: {
        orgId: targetUser.orgId,
        userId: adminId,
        action: 'admin.impersonate',
        resourceType: 'user',
        resourceId: targetUserId,
        newValue: { targetEmail: targetUser.email }
      }
    });

    // Strategy: Return identifying info so the frontend can request an impersonation token
    // or return a signed JWT directly if the auth helper is available.
    return { 
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        orgId: targetUser.orgId,
        role: targetUser.role
      }
    };
  }
}

export const adminService = new AdminService();
