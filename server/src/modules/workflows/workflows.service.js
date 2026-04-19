import { workflowRepository } from './workflows.repository.js';
import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.util.js';
import { AppError } from '../../utils/errors.js';
import { agentService } from '../../agents/agent.service.js';
import { env } from '../../config/env.js';
import { cronScheduler } from '../../cron/cronScheduler.js';
import crypto from 'crypto';

import { billingService } from '../billing/billing.service.js';
import { workflowVersionService } from '../workflow-versions/workflow-versions.service.js';

export class WorkflowService {
  async createWorkflow(userId, orgId, data) {
    // Enforce plan limits
    await billingService.enforceWorkflowLimit(orgId);

    let workflowData = { ...data };

    // If triggerType = 'webhook', generate webhook secret
    if (data.triggerType === 'webhook') {
      const webhookSecret = crypto.randomBytes(32).toString('hex');
      workflowData.triggerConfig = {
        ...data.triggerConfig,
        webhookSecret
      };
    }

    const workflow = await workflowRepository.create({
      ...workflowData,
      orgId,
      createdBy: userId,
      status: 'draft'
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'workflow.created',
        resourceType: 'workflow',
        resourceId: workflow.id
      }
    });

    logger.info('Workflow created', { workflowId: workflow.id, orgId, userId });

    // Return workflow + webhookUrl if webhook type
    const result = { workflow };
    if (data.triggerType === 'webhook') {
      result.webhookUrl = `${env.APP_URL}/api/webhooks/${workflow.id}`;
    }

    return result;
  }

  async getWorkflows(orgId, query) {
    const { page, limit, status, triggerType, search } = query;
    
    const filters = {};
    if (status) filters.status = status;
    if (triggerType) filters.triggerType = triggerType;
    if (search) filters.search = search;

    const pagination = { page, limit };

    const { workflows, total } = await workflowRepository.findByOrgId(orgId, filters, pagination);

    return {
      workflows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getWorkflowById(id, orgId) {
    const workflow = await workflowRepository.findById(id, orgId);
    
    if (!workflow) {
      throw new AppError('Workflow not found', 'WORKFLOW_NOT_FOUND', 404);
    }

    return workflow;
  }

  async updateWorkflow(id, orgId, userId, data) {
    const existingWorkflow = await workflowRepository.findById(id, orgId);
    
    if (!existingWorkflow) {
      throw new AppError('Workflow not found', 'WORKFLOW_NOT_FOUND', 404);
    }

    // If status = 'active' and changing triggerType, throw error
    if (existingWorkflow.status === 'active' && data.triggerType && data.triggerType !== existingWorkflow.triggerType) {
      throw new AppError(
        'Cannot change trigger type while workflow is active',
        'WORKFLOW_ACTIVE_CHANGE_NOT_ALLOWED',
        400
      );
    }
    
    // Auto-version before update if steps or instruction changed
    const needsVersion = data.steps || data.agentInstruction;
    if (needsVersion) {
      await workflowVersionService.createVersion(
        id, 
        orgId, 
        userId, 
        data.changeNote || 'Auto-saved before update'
      );
    }

    const workflow = await workflowRepository.update(id, orgId, data);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'workflow.updated',
        resourceType: 'workflow',
        resourceId: workflow.id
      }
    });

    logger.info('Workflow updated', { workflowId: workflow.id, orgId, userId });

    return workflow;
  }

  async deleteWorkflow(id, orgId, userId) {
    const workflow = await workflowRepository.findById(id, orgId);
    
    if (!workflow) {
      throw new AppError('Workflow not found', 'WORKFLOW_NOT_FOUND', 404);
    }

    // Unschedule cron workflow if applicable
    if (workflow.triggerType === 'cron') {
      try {
        const unscheduled = cronScheduler.unscheduleWorkflow(id);
        if (unscheduled) {
          logger.info(`Cron workflow unscheduled on deletion: ${workflow.name}`, {
            workflowId: id,
          });
        }
      } catch (error) {
        logger.error(`Failed to unschedule cron workflow on deletion: ${id}`, {
          workflowId: id,
          error: error.message,
        });
      }
    }

    await workflowRepository.softDelete(id, orgId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'workflow.deleted',
        resourceType: 'workflow',
        resourceId: id
      }
    });

    logger.info('Workflow deleted', { workflowId: id, orgId, userId });
  }

  async runWorkflow(id, orgId, userId, input) {
    const workflow = await workflowRepository.findById(id, orgId);
    
    if (!workflow) {
      throw new AppError('Workflow not found', 'WORKFLOW_NOT_FOUND', 404);
    }

    // Only active workflows can run
    if (workflow.status !== 'active') {
      throw new AppError(
        'Workflow must be active to run',
        'WORKFLOW_NOT_ACTIVE',
        400
      );
    }

    // Run workflow using new agent service with quota integration
    const result = await agentService.executeWorkflow(id, input, {
      orgId,
      triggeredBy: userId ? 'manual' : 'api',
      useQueue: true // Ensure background execution
    });

    logger.info('Workflow execution started', { 
      workflowId: id, 
      orgId, 
      userId,
      executionId: result.executionId,
      status: result.status
    });

    return {
      executionId: result.executionId,
      status: result.status,
      message: result.status === 'queued' ? 'Workflow queued' : 'Workflow started',
      pollUrl: `/api/v1/executions/${result.executionId}`,
    };
  }

  async activateWorkflow(id, orgId) {
    const workflow = await workflowRepository.findById(id, orgId);
    
    if (!workflow) {
      throw new AppError('Workflow not found', 'WORKFLOW_NOT_FOUND', 404);
    }

    const updatedWorkflow = await workflowRepository.updateStatus(id, orgId, 'active');

    // Schedule cron workflow if applicable
    if (workflow.triggerType === 'cron') {
      try {
        const scheduled = await cronScheduler.scheduleWorkflow(updatedWorkflow);
        if (scheduled) {
          logger.info(`Cron workflow scheduled on activation: ${workflow.name}`, {
            workflowId: id,
            schedule: workflow.triggerConfig?.schedule,
          });
        }
      } catch (error) {
        logger.error(`Failed to schedule cron workflow on activation: ${id}`, {
          workflowId: id,
          error: error.message,
        });
      }
    }

    return updatedWorkflow;
  }

  async pauseWorkflow(id, orgId) {
    const workflow = await workflowRepository.findById(id, orgId);
    
    if (!workflow) {
      throw new AppError('Workflow not found', 'WORKFLOW_NOT_FOUND', 404);
    }

    // Unschedule cron workflow if applicable
    if (workflow.triggerType === 'cron') {
      try {
        const unscheduled = cronScheduler.unscheduleWorkflow(id);
        if (unscheduled) {
          logger.info(`Cron workflow unscheduled on pause: ${workflow.name}`, {
            workflowId: id,
          });
        }
      } catch (error) {
        logger.error(`Failed to unschedule cron workflow on pause: ${id}`, {
          workflowId: id,
          error: error.message,
        });
      }
    }

    return await workflowRepository.updateStatus(id, orgId, 'paused');
  }
}

export const workflowService = new WorkflowService();
