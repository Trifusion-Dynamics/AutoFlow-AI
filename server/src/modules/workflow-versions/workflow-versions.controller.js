import { workflowVersionService } from './workflow-versions.service.js';
import { successResponse } from '../../utils/response.util.js';
import { responseTransformer } from '../../utils/responseTransformer.util.js';

export class WorkflowVersionController {
  async list(req, res) {
    const versions = await workflowVersionService.getVersions(
      req.params.workflowId, 
      req.user.orgId
    );
    return successResponse(res, versions, 'Workflow versions retrieved');
  }

  async getOne(req, res) {
    const version = await workflowVersionService.getVersion(
      req.params.workflowId,
      req.params.version,
      req.user.orgId
    );
    return successResponse(res, version, 'Workflow version details retrieved');
  }

  async rollback(req, res) {
    const workflow = await workflowVersionService.rollbackToVersion(
      req.params.workflowId,
      req.params.version,
      req.user.orgId,
      req.user.id
    );
    return successResponse(
      res, 
      responseTransformer.workflow(workflow), 
      `Rolled back to v${req.params.version}`
    );
  }
}

export const workflowVersionController = new WorkflowVersionController();
