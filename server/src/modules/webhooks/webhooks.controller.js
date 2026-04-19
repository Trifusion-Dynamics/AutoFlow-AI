import { workflowRepository } from '../workflows/workflows.repository.js';
import { prisma } from '../../config/db.js';
import { agentService } from '../../agents/agent.service.js';
import { logger } from '../../utils/logger.util.js';
import { successResponse } from '../../utils/response.util.js';
import { AppError } from '../../utils/errors.js';

export class WebhookController {
  async handleWebhook(req, res) {
    try {
      const workflowId = req.params.workflowId;
      
      // Find workflow by id (status must be 'active')
      const workflow = await workflowRepository.findByWebhookId(workflowId, null);
      
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'WORKFLOW_NOT_FOUND',
            message: 'Workflow not found or not active'
          }
        });
      }

      // Verify webhook secret
      const providedSecret = req.headers['x-webhook-secret'];
      const storedSecret = workflow.triggerConfig?.webhookSecret;
      
      if (storedSecret && providedSecret !== storedSecret) {
        logger.warn('Webhook secret verification failed', { 
          workflowId, 
          providedSecret: providedSecret ? 'provided' : 'missing' 
        });
        
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_WEBHOOK_SECRET',
            message: 'Invalid webhook secret'
          }
        });
      }

      // Create execution record
      const execution = await prisma.execution.create({
        data: {
          workflowId: workflow.id,
          orgId: workflow.orgId,
          triggeredBy: 'webhook',
          triggerData: req.body,
          status: 'pending'
        }
      });

      // Fetch org data for context
      const org = await prisma.organization.findUnique({
        where: { id: workflow.orgId }
      });

      // Execute workflow directly (no queue) - run async, don't await (non-blocking)
      agentService.executeWorkflow(execution, workflow, org)
        .catch(err => logger.error('Background execution error:', err));

      logger.info('Webhook triggered workflow execution', {
        workflowId: workflow.id,
        executionId: execution.id,
        orgId: workflow.orgId
      });

      return successResponse(res, {
        executionId: execution.id,
        status: 'running',
        message: 'Workflow triggered successfully'
      }, 'Webhook processed successfully', 202);

    } catch (error) {
      logger.error('Webhook processing error:', error);
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'WEBHOOK_ERROR',
          message: 'Internal server error processing webhook'
        }
      });
    }
  }
}

export const webhookController = new WebhookController();
