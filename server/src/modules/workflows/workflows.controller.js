import { workflowService } from './workflows.service.js';
import { successResponse } from '../../utils/response.util.js';
import { AppError } from '../../utils/errors.js';
import { responseTransformer } from '../../utils/responseTransformer.util.js';

export class WorkflowController {
  async getWorkflows(req, res) {
    try {
      const result = await workflowService.getWorkflows(req.user.orgId, req.query);
      result.workflows = result.workflows.map(w => responseTransformer.workflow(w));
      return successResponse(res, result, 'Workflows retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async createWorkflow(req, res) {
    try {
      const result = await workflowService.createWorkflow(
        req.user.id, 
        req.user.orgId, 
        req.validatedBody
      );
      result.workflow = responseTransformer.workflow(result.workflow);
      return successResponse(res, result, 'Workflow created successfully', 201);
    } catch (error) {
      throw error;
    }
  }

  async getWorkflowById(req, res) {
    try {
      const workflow = await workflowService.getWorkflowById(
        req.params.id, 
        req.user.orgId
      );
      return successResponse(res, responseTransformer.workflow(workflow), 'Workflow retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async updateWorkflow(req, res) {
    try {
      const workflow = await workflowService.updateWorkflow(
        req.params.id,
        req.user.orgId,
        req.user.id,
        req.validatedBody
      );
      return successResponse(res, responseTransformer.workflow(workflow), 'Workflow updated successfully');
    } catch (error) {
      throw error;
    }
  }

  async deleteWorkflow(req, res) {
    try {
      await workflowService.deleteWorkflow(
        req.params.id,
        req.user.orgId,
        req.user.id
      );
      return successResponse(res, null, 'Workflow deleted successfully');
    } catch (error) {
      throw error;
    }
  }

  async runWorkflow(req, res) {
    try {
      const result = await workflowService.runWorkflow(
        req.params.id,
        req.user.orgId,
        req.user.id,
        req.validatedBody.input
      );
      return successResponse(res, result, 'Workflow execution started', 202);
    } catch (error) {
      throw error;
    }
  }

  async activateWorkflow(req, res) {
    try {
      const workflow = await workflowService.activateWorkflow(
        req.params.id,
        req.user.orgId
      );
      return successResponse(res, responseTransformer.workflow(workflow), 'Workflow activated successfully');
    } catch (error) {
      throw error;
    }
  }

  async pauseWorkflow(req, res) {
    try {
      const workflow = await workflowService.pauseWorkflow(
        req.params.id,
        req.user.orgId
      );
      return successResponse(res, responseTransformer.workflow(workflow), 'Workflow paused successfully');
    } catch (error) {
      throw error;
    }
  }
}

export const workflowController = new WorkflowController();
