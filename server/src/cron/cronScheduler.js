import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { cacheUtil } from '../utils/cache.util.js';
import { logger } from '../utils/logger.util.js';
import { TRIGGER_TYPES, WORKFLOW_STATUS } from '../config/constants.js';
import { agentService } from '../agents/agent.service.js';

export class CronScheduler {
  constructor() {
    this.activeJobs = new Map(); // workflowId -> cron job instance
  }

  async scheduleWorkflow(workflow) {
    try {
      // Validate workflow has cron trigger
      if (workflow.triggerType !== TRIGGER_TYPES.CRON) {
        logger.warn(`Workflow ${workflow.id} is not a cron workflow`, {
          workflowId: workflow.id,
          triggerType: workflow.triggerType,
        });
        return false;
      }

      // Validate cron expression
      if (!workflow.triggerConfig?.schedule) {
        logger.error(`Workflow ${workflow.id} missing cron schedule`, {
          workflowId: workflow.id,
        });
        return false;
      }

      const schedule = workflow.triggerConfig.schedule;

      // Validate cron expression
      if (!cron.validate(schedule)) {
        logger.error(`Invalid cron expression for workflow ${workflow.id}`, {
          workflowId: workflow.id,
          schedule,
        });
        return false;
      }

      // Stop existing job if any
      this.unscheduleWorkflow(workflow.id);

      // Create new cron job
      const job = cron.schedule(schedule, async () => {
        await this.triggerCronWorkflow(workflow.id);
      }, {
        scheduled: false, // Don't start immediately
        timezone: workflow.triggerConfig.timezone || 'UTC',
      });

      // Store the job
      this.activeJobs.set(workflow.id, job);

      // Start the job
      job.start();

      logger.info(`Cron workflow scheduled: ${workflow.name}`, {
        workflowId: workflow.id,
        name: workflow.name,
        schedule,
        timezone: workflow.triggerConfig.timezone || 'UTC',
      });

      return true;
    } catch (error) {
      logger.error(`Failed to schedule cron workflow ${workflow.id}`, {
        workflowId: workflow.id,
        error: error.message,
      });
      return false;
    }
  }

  unscheduleWorkflow(workflowId) {
    try {
      const job = this.activeJobs.get(workflowId);
      
      if (job) {
        job.stop();
        this.activeJobs.delete(workflowId);
        
        logger.info(`Cron workflow unscheduled: ${workflowId}`, {
          workflowId,
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Failed to unschedule cron workflow ${workflowId}`, {
        workflowId,
        error: error.message,
      });
      return false;
    }
  }

  async triggerCronWorkflow(workflowId) {
    try {
      logger.info(`Cron triggering workflow: ${workflowId}`, {
        workflowId,
      });

      // Get fresh workflow data from cache or database
      const workflow = await cacheUtil.getWorkflowCached(workflowId);
      
      if (!workflow) {
        logger.error(`Workflow not found for cron trigger: ${workflowId}`, {
          workflowId,
        });
        return;
      }

      // Check if workflow is still active
      if (workflow.status !== WORKFLOW_STATUS.ACTIVE) {
        logger.warn(`Skipping cron trigger for inactive workflow: ${workflowId}`, {
          workflowId,
          status: workflow.status,
        });
        return;
      }

      // Check if trigger type is still cron
      if (workflow.triggerType !== TRIGGER_TYPES.CRON) {
        logger.warn(`Workflow trigger type changed, unscheduling cron: ${workflowId}`, {
          workflowId,
          triggerType: workflow.triggerType,
        });
        this.unscheduleWorkflow(workflowId);
        return;
      }

      // Get organization details
      const org = await cacheUtil.getOrgCached(workflow.orgId);
      
      if (!org || !org.isActive) {
        logger.warn(`Organization inactive, skipping cron trigger: ${workflowId}`, {
          workflowId,
          orgId: workflow.orgId,
        });
        return;
      }

      // Check token quota
      // TODO: Integrate with quota system when implemented
      // For now, proceed with execution

      // Create execution
      const execution = await prisma.execution.create({
        data: {
          workflowId: workflow.id,
          orgId: workflow.orgId,
          status: 'pending',
          triggeredBy: 'cron',
          input: {},
          metadata: {
            triggeredAt: new Date().toISOString(),
            cronSchedule: workflow.triggerConfig.schedule,
          },
        },
      });

      logger.info(`Cron execution created: ${execution.id}`, {
        executionId: execution.id,
        workflowId: workflow.id,
        orgId: workflow.orgId,
      });

      // Execute workflow asynchronously
      setImmediate(async () => {
        try {
          await agentService.executeWorkflow(workflow.id, {}, {
            executionId: execution.id,
            orgId: workflow.orgId,
            triggeredBy: 'cron',
          });
        } catch (error) {
          logger.error(`Failed to execute cron workflow: ${workflowId}`, {
            workflowId,
            executionId: execution.id,
            error: error.message,
          });

          // Update execution status to failed
          await prisma.execution.update({
            where: { id: execution.id },
            data: {
              status: 'failed',
              error: error.message,
              completedAt: new Date(),
            },
          });
        }
      });

      logger.info(`Cron workflow triggered successfully: ${workflow.name}`, {
        workflowId: workflow.id,
        executionId: execution.id,
      });

    } catch (error) {
      logger.error(`Failed to trigger cron workflow: ${workflowId}`, {
        workflowId,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async loadAllCronWorkflows() {
    try {
      logger.info('Loading all active cron workflows...');

      // Find all active cron workflows
      const cronWorkflows = await prisma.workflow.findMany({
        where: {
          triggerType: TRIGGER_TYPES.CRON,
          status: WORKFLOW_STATUS.ACTIVE,
        },
        select: {
          id: true,
          name: true,
          triggerType: true,
          triggerConfig: true,
          status: true,
          orgId: true,
        },
      });

      logger.info(`Found ${cronWorkflows.length} active cron workflows`);

      let scheduledCount = 0;
      let failedCount = 0;

      for (const workflow of cronWorkflows) {
        try {
          const success = await this.scheduleWorkflow(workflow);
          if (success) {
            scheduledCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          logger.error(`Failed to schedule workflow ${workflow.id}`, {
            workflowId: workflow.id,
            error: error.message,
          });
          failedCount++;
        }
      }

      logger.info(`Cron scheduler loaded: ${scheduledCount} scheduled, ${failedCount} failed`, {
        total: cronWorkflows.length,
        scheduled: scheduledCount,
        failed: failedCount,
      });

      return {
        total: cronWorkflows.length,
        scheduled: scheduledCount,
        failed: failedCount,
      };
    } catch (error) {
      logger.error('Failed to load cron workflows', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async restartScheduler() {
    try {
      logger.info('Restarting cron scheduler...');

      // Stop all active jobs
      this.stopAll();

      // Wait a bit for jobs to stop
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reload all cron workflows
      const result = await this.loadAllCronWorkflows();

      logger.info('Cron scheduler restarted successfully', result);

      return result;
    } catch (error) {
      logger.error('Failed to restart cron scheduler', {
        error: error.message,
      });
      throw error;
    }
  }

  stopAll() {
    try {
      const jobCount = this.activeJobs.size;
      
      // Stop all active jobs
      for (const [workflowId, job] of this.activeJobs) {
        try {
          job.stop();
        } catch (error) {
          logger.error(`Failed to stop cron job for workflow ${workflowId}`, {
            workflowId,
            error: error.message,
          });
        }
      }

      // Clear the map
      this.activeJobs.clear();

      logger.info(`Stopped ${jobCount} cron jobs`);

      return jobCount;
    } catch (error) {
      logger.error('Failed to stop all cron jobs', {
        error: error.message,
      });
      return 0;
    }
  }

  getActiveJobsCount() {
    return this.activeJobs.size;
  }

  getActiveWorkflows() {
    return Array.from(this.activeJobs.keys());
  }

  isWorkflowScheduled(workflowId) {
    return this.activeJobs.has(workflowId);
  }

  async getSchedulerStatus() {
    return {
      activeJobs: this.activeJobs.size,
      activeWorkflows: Array.from(this.activeJobs.keys()),
      uptime: process.uptime(),
    };
  }
}

export const cronScheduler = new CronScheduler();
