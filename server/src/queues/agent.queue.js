import { Queue, Worker, QueueEvents } from 'bullmq';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.util.js';

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || '6379'),
  password: new URL(env.REDIS_URL).password,
  tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
};

// Queue Definitions
export const agentQueue = new Queue('agent-jobs', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
    timeout: 300000, // 5 minutes
  },
});

export const emailQueue = new Queue('email-jobs', { connection });
export const cronQueue = new Queue('cron-jobs', { 
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 1000
  }
});

// Queue Events Listeners (Optional but good for global logging)
const agentQueueEvents = new QueueEvents('agent-jobs', { connection });

agentQueueEvents.on('completed', ({ jobId }) => {
  logger.info(`Agent job ${jobId} completed successfully`);
});

agentQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Agent job ${jobId} failed: ${failedReason}`);
});

agentQueueEvents.on('stalled', ({ jobId }) => {
  logger.warn(`Agent job ${jobId} stalled! Potential resource issue.`);
});

/**
 * Add an execution job to the queue
 */
export const addAgentJob = async (executionId, workflowId, orgId, triggerData = {}) => {
  return await agentQueue.add('execute-workflow', {
    executionId,
    workflowId,
    orgId,
    triggerData
  });
};

/**
 * Add a repeatable cron job
 */
export const addCronJob = async (workflowId, cronSchedule) => {
  return await cronQueue.add(
    'cron-workflow',
    { workflowId },
    {
      repeat: { pattern: cronSchedule },
      jobId: `cron:${workflowId}` // Ensure only one job per workflow
    }
  );
};

/**
 * Remove a repeatable cron job
 */
export const removeCronJob = async (workflowId) => {
  const jobs = await cronQueue.getRepeatableJobs();
  const job = jobs.find(j => j.id === `cron:${workflowId}`);
  if (job) {
    await cronQueue.removeRepeatableByKey(job.key);
    logger.info(`Removed cron job for workflow: ${workflowId}`);
  }
};
