import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.util.js';
import { agentService } from '../../agents/agent.service.js';
import { realtimeEmitter } from '../../realtime/emitter.js';

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || '6379'),
  password: new URL(env.REDIS_URL).password,
  tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
};

/**
 * Agent Job Processor
 */
export const agentWorker = new Worker('agent-jobs', async (job) => {
  const { executionId, workflowId, orgId, triggerData } = job.data;
  
  logger.info(`Processing agent job: ${job.id}`, { executionId, workflowId });

  try {
    // 1. Fetch Workflow & Execution
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { org: true }
    });

    if (!workflow) throw new Error('Workflow not found');

    // 2. Update Execution status to running
    await prisma.execution.update({
      where: { id: executionId },
      data: { status: 'running', startedAt: new Date() }
    });

    // 3. Emit started event
    realtimeEmitter.emitToExecution(executionId, orgId, 'execution:started', {
      workflowId,
      workflowName: workflow.name
    });

    // 4. Run Workflow Execution
    const result = await agentService.executeWorkflow(workflow, executionId, triggerData);

    // 5. Update Progress (BullMQ metadata)
    await job.updateProgress(100);

    return result;
  } catch (error) {
    logger.error(`Error in agent worker for job ${job.id}:`, error);
    
    // Update execution status on failure
    await prisma.execution.update({
      where: { id: executionId },
      data: { 
        status: 'failed', 
        completedAt: new Date(),
        errorMessage: error.message 
      }
    });

    realtimeEmitter.emitToExecution(executionId, orgId, 'execution:failed', {
      error: error.message
    });

    throw error;
  }
}, { 
  connection,
  concurrency: 5 
});

agentWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

agentWorker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed with ${err.message}`);
});
