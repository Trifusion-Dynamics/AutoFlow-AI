import { prisma } from '../../config/db.js';
import { redisHelpers } from '../../config/redis.js';
import { logger } from '../../utils/logger.util.js';
import { PLAN_LIMITS } from '../../config/plans.js';
import { PlanLimitError, NotFoundError } from '../../utils/errors.js';
import { quotaUtil } from '../../utils/quota.util.js';

class BillingService {
  /**
   * Get organization's current plan and status
   */
  async getCurrentPlan(orgId) {
    const subscription = await prisma.orgSubscription.findUnique({
      where: { orgId },
      include: { plan: true }
    });

    if (!subscription) {
      // Fallback to free plan info if no subscription record found
      return {
        orgId,
        plan: 'free',
        status: 'active',
        limits: PLAN_LIMITS.free
      };
    }

    const planName = subscription.plan?.name || 'free';

    return {
      orgId,
      plan: planName,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialEndsAt: subscription.trialEndsAt,
      limits: PLAN_LIMITS[planName] || PLAN_LIMITS.free
    };
  }

  /**
   * Check if a resource creation/action is allowed under current plan limits
   */
  async checkPlanLimits(orgId, resource) {
    const { limits, plan } = await this.getCurrentPlan(orgId);
    
    let current = 0;
    let limit = -1;
    let allowed = true;

    switch (resource) {
      case 'workflow':
        current = await prisma.workflow.count({ where: { orgId } });
        limit = limits.workflows;
        break;
      
      case 'member':
        current = await prisma.user.count({ where: { orgId } });
        limit = limits.teamMembers;
        break;

      case 'execution':
        const stats = await quotaUtil.getTokenUsage(orgId);
        // Assuming executions are tracked in Redis for current month
        // In a real app, you'd have a specific counter for executions
        const executionKey = `usage:executions:${orgId}:${new Date().toISOString().slice(0, 7)}`;
        const executionCount = await redisHelpers.get(executionKey);
        current = executionCount ? parseInt(executionCount) : 0;
        limit = limits.executionsPerMonth;
        break;

      case 'apiCall':
        const apiCallKey = `usage:apicalls:${orgId}:${new Date().toISOString().slice(0, 7)}`;
        const apiCallCount = await redisHelpers.get(apiCallKey);
        current = apiCallCount ? parseInt(apiCallCount) : 0;
        limit = limits.apiCallsPerMonth;
        break;

      default:
        throw new Error(`Unknown resource type: ${resource}`);
    }

    if (limit !== -1 && current >= limit) {
      allowed = false;
    }

    return { 
      allowed, 
      current, 
      limit, 
      plan,
      upgradeRequired: !allowed 
    };
  }

  async enforceWorkflowLimit(orgId) {
    const check = await this.checkPlanLimits(orgId, 'workflow');
    if (!check.allowed) {
      throw new PlanLimitError(`Workflow limit reached (${check.limit}). Please upgrade your ${check.plan} plan.`);
    }
  }

  async enforceExecutionLimit(orgId) {
    const check = await this.checkPlanLimits(orgId, 'execution');
    if (!check.allowed) {
      throw new PlanLimitError(`Monthly execution limit reached (${check.limit}). Please upgrade your ${check.plan} plan.`);
    }
    
    // Increment execution count in Redis
    const executionKey = `usage:executions:${orgId}:${new Date().toISOString().slice(0, 7)}`;
    await redisHelpers.incr(executionKey);
    // Set expiry to end of month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    await redisHelpers.expire(executionKey, Math.floor((endOfMonth.getTime() - now.getTime()) / 1000));
  }

  async enforceMemberLimit(orgId) {
    const check = await this.checkPlanLimits(orgId, 'member');
    if (!check.allowed) {
      throw new PlanLimitError(`Team member limit reached (${check.limit}). Please upgrade your ${check.plan} plan.`);
    }
  }

  async getUsageSummary(orgId) {
    const currentPlan = await this.getCurrentPlan(orgId);
    const limits = currentPlan.limits;

    const workflowCount = await prisma.workflow.count({ where: { orgId } });
    const memberCount = await prisma.user.count({ where: { orgId } });
    
    const tokenStats = await quotaUtil.getTokenUsage(orgId);
    
    const executionKey = `usage:executions:${orgId}:${new Date().toISOString().slice(0, 7)}`;
    const executionCount = await redisHelpers.get(executionKey);
    const currentExecutions = executionCount ? parseInt(executionCount) : 0;

    const apiCallKey = `usage:apicalls:${orgId}:${new Date().toISOString().slice(0, 7)}`;
    const apiCallCount = await redisHelpers.get(apiCallKey);
    const currentApiCalls = apiCallCount ? parseInt(apiCallCount) : 0;

    return {
      plan: currentPlan.plan,
      status: currentPlan.status,
      workflows: { 
        current: workflowCount, 
        limit: limits.workflows, 
        percentage: limits.workflows === -1 ? 0 : Math.round((workflowCount / limits.workflows) * 100) 
      },
      executions: { 
        current: currentExecutions, 
        limit: limits.executionsPerMonth, 
        percentage: limits.executionsPerMonth === -1 ? 0 : Math.round((currentExecutions / limits.executionsPerMonth) * 100) 
      },
      tokens: { 
        current: tokenStats.used, 
        limit: limits.tokenQuota, 
        percentage: tokenStats.percentage 
      },
      members: { 
        current: memberCount, 
        limit: limits.teamMembers, 
        percentage: limits.teamMembers === -1 ? 0 : Math.round((memberCount / limits.teamMembers) * 100) 
      },
      apiCalls: { 
        current: currentApiCalls, 
        limit: limits.apiCallsPerMonth, 
        percentage: limits.apiCallsPerMonth === -1 ? 0 : Math.round((currentApiCalls / limits.apiCallsPerMonth) * 100) 
      }
    };
  }

  async upgradePlan(orgId, planName) {
    const planConfig = PLAN_LIMITS[planName];
    if (!planConfig) {
      throw new NotFoundError(`Plan ${planName} not found`);
    }

    // Upsert BillingPlan in DB
    let plan = await prisma.billingPlan.findUnique({ where: { name: planName } });
    if (!plan) {
      plan = await prisma.billingPlan.create({
        data: {
          name: planName,
          displayName: planConfig.displayName,
          price: planConfig.price,
          tokenQuota: planConfig.tokenQuota,
          workflowLimit: planConfig.workflows,
          executionLimit: planConfig.executionsPerMonth,
          apiCallLimit: planConfig.apiCallsPerMonth,
          teamMembersLimit: planConfig.teamMembers,
          features: planConfig.features
        }
      });
    }

    // Update or Create Subscription
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const subscription = await prisma.orgSubscription.upsert({
      where: { orgId },
      create: {
        orgId,
        planId: plan.id,
        status: 'active',
        currentPeriodEnd: periodEnd
      },
      update: {
        planId: plan.id,
        status: 'active',
        currentPeriodEnd: periodEnd,
        trialEndsAt: null
      }
    });

    // Update org directly for quick access
    await prisma.organization.update({
      where: { id: orgId },
      data: { 
        plan: planName,
        tokenQuota: planConfig.tokenQuota
      }
    });

    // Create Invoice
    await prisma.orgInvoice.create({
      data: {
        orgId,
        subscriptionId: subscription.id,
        amount: planConfig.price,
        status: 'paid',
        periodStart: now,
        periodEnd: periodEnd,
        paidAt: now,
        items: [{ plan: planName, amount: planConfig.price }]
      }
    });

    logger.info(`Organization ${orgId} upgraded to ${planName}`);
    return { success: true, plan: planName, subscription };
  }

  async startTrial(orgId, planName = 'pro') {
    const planConfig = PLAN_LIMITS[planName];
    if (!planConfig) throw new NotFoundError('Plan not found');

    let plan = await prisma.billingPlan.findUnique({ where: { name: planName } });
    if (!plan) {
      plan = await prisma.billingPlan.create({
        data: {
          name: planName,
          displayName: planConfig.displayName,
          price: planConfig.price,
          tokenQuota: planConfig.tokenQuota,
          workflowLimit: planConfig.workflows,
          executionLimit: planConfig.executionsPerMonth,
          apiCallLimit: planConfig.apiCallsPerMonth,
          teamMembersLimit: planConfig.teamMembers,
          features: planConfig.features
        }
      });
    }

    const now = new Date();
    const trialDays = parseInt(process.env.TRIAL_DAYS || '14');
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const subscription = await prisma.orgSubscription.upsert({
      where: { orgId },
      create: {
        orgId,
        planId: plan.id,
        status: 'trialing',
        currentPeriodEnd: trialEndsAt,
        trialEndsAt
      },
      update: {
        planId: plan.id,
        status: 'trialing',
        currentPeriodEnd: trialEndsAt,
        trialEndsAt
      }
    });

    await prisma.organization.update({
      where: { id: orgId },
      data: { 
        plan: planName,
        tokenQuota: planConfig.tokenQuota
      }
    });

    return { success: true, trialEndsAt };
  }
}

export const billingService = new BillingService();
