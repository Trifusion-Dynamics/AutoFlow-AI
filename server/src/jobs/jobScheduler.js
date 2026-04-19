import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { redisHelpers } from '../config/redis.js';
import { logger } from '../utils/logger.util.js';
import { quotaUtil } from '../utils/quota.util.js';
import { billingService } from '../modules/billing/billing.service.js';
import { notificationsService } from '../modules/notifications/notifications.service.js';

class JobScheduler {
  constructor() {
    this.jobs = new Map();
    this.running = new Set();
  }

  registerJob(name, schedule, handler, options = {}) {
    const job = cron.schedule(schedule, async () => {
      // 1. Local lock (prevent same-instance overlap)
      if (this.running.has(name)) {
        logger.warn(`Job ${name} is already running locally, skipping this tick`);
        return;
      }

      // 2. Distributed lock (prevent multi-instance overlap)
      const { acquireLock, releaseLock } = await import('../utils/redisPatterns.util.js');
      const lockKey = `job:${name}`;
      const lock = await acquireLock(lockKey, (options.lockDuration || 300)); // Default 5 min

      if (!lock.acquired) {
        logger.debug(`Job ${name} is being executed by another instance, skipping`);
        return;
      }

      this.running.add(name);
      const start = Date.now();
      logger.info(`Starting background job: ${name}`);

      try {
        await handler();
        const duration = Date.now() - start;
        logger.info(`Background job ${name} completed successfully in ${duration}ms`);
      } catch (error) {
        logger.error(`Background job ${name} failed:`, error);
      } finally {
        this.running.delete(name);
        // Release the lock when done
        await releaseLock(lockKey, lock.lockId);
      }
    }, {
      scheduled: false,
      timezone: options.timezone || 'UTC'
    });

    this.jobs.set(name, job);
    return job;
  }


  startAll() {
    for (const [name, job] of this.jobs) {
      job.start();
      logger.info(`Background job ${name} started`);
    }
  }

  stopAll() {
    for (const [name, job] of this.jobs) {
      job.stop();
      logger.info(`Background job ${name} stopped`);
    }
  }

  registerDefaultJobs() {
    // 1. sync-token-usage - every 5 minutes
    this.registerJob('sync-token-usage', '*/5 * * * *', async () => {
      const orgs = await prisma.organization.findMany({ select: { id: true } });
      for (const org of orgs) {
        try {
          await quotaUtil.syncTokenUsageToDB(org.id);
        } catch (err) {
          logger.error(`Failed to sync token usage for org ${org.id}:`, err.message);
        }
      }
    });

    // 2. check-trial-expiry - daily at midnight
    this.registerJob('check-trial-expiry', '0 0 * * *', async () => {
      const now = new Date();
      const expiredTrials = await prisma.orgSubscription.findMany({
        where: {
          status: 'trialing',
          trialEndsAt: { lt: now }
        },
        include: { org: true }
      });

      for (const sub of expiredTrials) {
        try {
          await billingService.upgradePlan(sub.orgId, 'free');
          await notificationsService.notifyOwners(sub.orgId, 'plan.trial_expired', 
            'Trial expired', 'Your trial has ended and you have been moved to the free plan.');
          logger.info(`Trial expired and org ${sub.orgId} moved to free plan`);
        } catch (err) {
          logger.error(`Failed to expire trial for org ${sub.orgId}:`, err.message);
        }
      }
    });

    // 3. cleanup-old-executions - daily at 2am
    this.registerJob('cleanup-old-executions', '0 2 * * *', async () => {
      const days = parseInt(process.env.EXECUTION_RETENTION_DAYS || '60');
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const result = await prisma.agentMessage.deleteMany({
        where: {
          createdAt: { lt: cutoff }
        }
      });
      logger.info(`Deleted ${result.count} old agent messages older than ${days} days`);
    });

    // 4. cleanup-expired-invitations - every hour
    this.registerJob('cleanup-expired-invitations', '0 * * * *', async () => {
      const now = new Date();
      const result = await prisma.teamInvitation.updateMany({
        where: {
          status: 'pending',
          expiresAt: { lt: now }
        },
        data: { status: 'expired' }
      });
      logger.info(`Marked ${result.count} invitations as expired`);
    });

    // 5. cleanup-old-notifications - every week (Sunday midnight)
    this.registerJob('cleanup-old-notifications', '0 0 * * 0', async () => {
      const days = parseInt(process.env.NOTIFICATION_RETENTION_DAYS || '90');
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const result = await prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: { lt: cutoff }
        }
      });
      logger.info(`Deleted ${result.count} old read notifications`);
    });

    // 6. check-quota-warnings - every hour
    this.registerJob('check-quota-warnings', '0 * * * *', async () => {
      const orgs = await prisma.organization.findMany({ 
        where: { isActive: true },
        select: { id: true, name: true } 
      });

      for (const org of orgs) {
        try {
          const stats = await quotaUtil.getTokenUsage(org.id);
          const { percentage } = stats;

          const warned80Key = `quota_warned:${org.id}:80`;
          const warned95Key = `quota_warned:${org.id}:95`;

          if (percentage >= 95) {
            const alreadyWarned = await redisHelpers.get(warned95Key);
            if (!alreadyWarned) {
              await notificationsService.notifyOwners(org.id, 'quota.warning_95',
                '95% Token Quota Reached', 'You have used 95% of your monthly token quota.');
              await redisHelpers.set(warned95Key, '1', 86400 * 30); // 30 day lockout
            }
          } else if (percentage >= 80) {
            const alreadyWarned = await redisHelpers.get(warned80Key);
            if (!alreadyWarned) {
              await notificationsService.notifyOwners(org.id, 'quota.warning_80',
                '80% Token Quota Reached', 'You have used 80% of your monthly token quota.');
              await redisHelpers.set(warned80Key, '1', 86400 * 30);
            }
          }
        } catch (err) {
          logger.error(`Failed quota check for org ${org.id}:`, err.message);
        }
      }
    });

    // 7. health-check-webhooks - every 6 hours
    this.registerJob('health-check-webhooks', '0 */6 * * *', async () => {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 24);

      const result = await prisma.outboundWebhook.updateMany({
        where: {
          isActive: false,
          updatedAt: { lt: cutoff }
        },
        data: {
          isActive: true,
          failureCount: 0
        }
      });
      logger.info(`Re-enabled ${result.count} disabled webhooks for auto-recovery`);
    });

    // 8. process-data-export - every 2 minutes
    this.registerJob('process-data-export', '*/2 * * * *', async () => {
      const pendingJobs = await prisma.dataExportJob.findMany({
        where: { status: 'processing' }
      });

      for (const job of pendingJobs) {
        try {
          logger.info(`Processing data export job: ${job.id}`);
          // Mocking ZIP generation and saving
          await prisma.dataExportJob.update({
            where: { id: job.id },
            data: { 
              status: 'completed', 
              completedAt: new Date(),
              fileUrl: `https://storage.autoflow.ai/exports/${job.id}.zip`,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24hr expiry
            }
          });
        } catch (err) {
          logger.error(`Failed to process data export ${job.id}:`, err.message);
          await prisma.dataExportJob.update({
            where: { id: job.id },
            data: { status: 'failed' }
          });
        }
      }
    });

    // 9. hard-delete-org-data - daily at 3am
    this.registerJob('hard-delete-org-data', '0 3 * * *', async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30); // 30 day grace period

      const pendingDeletions = await prisma.organization.findMany({
        where: { 
          isActive: false,
          updatedAt: { lt: cutoff }
        }
      });

      for (const org of pendingDeletions) {
        if (org.settings?.deleteRequestedAt) {
          logger.warn(`Executing HARD DELETE for organization: ${org.id}`);
          await prisma.organization.delete({ where: { id: org.id } });
        }
      }
    });

    // 10. send-weekly-digest - every Monday 9am
    this.registerJob('send-weekly-digest', '0 9 * * 1', async () => {
      const orgs = await prisma.organization.findMany({ where: { isActive: true } });
      for (const org of orgs) {
        if (org.settings?.marketingEmails !== false) {
          logger.info(`Queuing weekly digest for org: ${org.id}`);
          // Integration with email service would go here
        }
      }
    });

    // 11. marketplace-stats-sync - every hour
    this.registerJob('marketplace-stats-sync', '0 * * * *', async () => {
      logger.info('Syncing marketplace download counts...');
      // Sync logic
    });
  }
}

export const jobScheduler = new JobScheduler();
