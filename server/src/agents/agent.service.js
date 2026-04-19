import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.util.js';
import { EXECUTION_STATUS } from '../config/constants.js';
import { quotaUtil } from '../utils/quota.util.js';
import { outboundWebhookService } from '../modules/outbound-webhooks/outbound-webhooks.service.js';
import { notificationsService } from '../modules/notifications/notifications.service.js';
import { billingService } from '../modules/billing/billing.service.js';
import { addAgentJob } from '../queues/agent.queue.js';
import { realtimeEmitter } from '../realtime/emitter.js';
import { agentEngine } from './engine.js';

export class AgentService {

  /**
   * Execute a workflow - now with background support via BullMQ
   */
  async executeWorkflow(workflowId, input = {}, options = {}) {
    const { orgId, triggeredBy = 'manual', useQueue = true } = options;
    const startTime = Date.now();

    try {
      // 1. Enforce limits
      await billingService.enforceExecutionLimit(orgId);

      // 2. Get workflow
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { org: true }
      });

      if (!workflow) throw new Error('Workflow not found');

      // 3. Create execution record (PENDING)
      const execution = await prisma.execution.create({
        data: {
          workflowId,
          orgId,
          status: EXECUTION_STATUS.PENDING,
          triggeredBy,
          triggerData: input,
        },
      });

      // 4. Either queue it or run directly
      if (useQueue) {
        await addAgentJob(execution.id, workflowId, orgId, input);
        logger.info(`Workflow ${workflowId} queued for execution ${execution.id}`);
        
        realtimeEmitter.emitToOrg(orgId, 'execution:queued', {
          executionId: execution.id,
          workflowName: workflow.name
        });

        return { executionId: execution.id, status: 'queued' };
      } else {
        // Direct execution (blocking)
        return await this._runSync(workflow, execution.id, input);
      }
    } catch (error) {
      logger.error(`Execution start error:`, error);
      throw error;
    }
  }

  /**
   * Internal sync runner (used by workers or direct calls)
   */
  async _runSync(workflow, executionId, input) {
    const startTime = Date.now();
    const { orgId } = workflow;

    try {
      // 1. Context for engine
      const context = {
        executionId,
        workflowId: workflow.id,
        orgId,
        orgName: workflow.org.name,
        workflowName: workflow.name,
        agentInstruction: workflow.agentInstruction,
        triggerData: input,
        variables: workflow.variables,
        aiModel: workflow.aiModel,
        aiConfig: workflow.aiConfig,
        timeoutSeconds: workflow.timeoutSeconds || 300
      };

      // 2. Run Engine
      const result = await agentEngine.run(context);

      const durationMs = Date.now() - startTime;
      const actualTokensUsed = result.tokensUsed || 0;

      // 3. Update DB
      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: EXECUTION_STATUS.SUCCESS,
          completedAt: new Date(),
          durationMs,
          tokensUsed: actualTokensUsed,
          output: result.output || {},
        }
      });

      // 4. Update Stats
      await prisma.workflow.update({
        where: { id: workflow.id },
        data: {
          runCount: { increment: 1 },
          lastRunAt: new Date(),
          successCount: { increment: 1 }
        }
      });

      // 5. Quota fallback (sync if needed)
      await quotaUtil.checkAndConsumeTokens(orgId, actualTokensUsed);

      // 6. Emit Complete
      realtimeEmitter.emitToExecution(executionId, orgId, 'execution:completed', {
        status: 'success',
        durationMs,
        output: result.output
      });

      // 7. Post-execution services
      this._dispatchPostExecution(workflow, executionId, result, durationMs);

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      
      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: EXECUTION_STATUS.FAILED,
          completedAt: new Date(),
          durationMs,
          errorMessage: error.message
        }
      });

      realtimeEmitter.emitToExecution(executionId, orgId, 'execution:failed', {
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Async post-execution tasks
   */
  async _dispatchPostExecution(workflow, executionId, result, durationMs) {
    const { orgId } = workflow;
    
    // Webhooks
    outboundWebhookService.dispatchEvent(orgId, 'execution.completed', {
      executionId,
      workflowId: workflow.id,
      status: 'success',
      output: result.output
    }).catch(e => logger.error('Webhook error:', e));

    // Notifications
    notificationsService.notifyOrg(orgId, 'execution.completed', 
      `Workflow ${workflow.name} finished`,
      `Finalized in ${durationMs}ms`,
      { executionId }
    ).catch(e => logger.error('Notification error:', e));
  }
}

export const agentService = new AgentService();

