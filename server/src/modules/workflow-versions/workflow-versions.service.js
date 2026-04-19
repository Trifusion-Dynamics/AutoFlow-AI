import { workflowVersionRepository } from './workflow-versions.repository.js';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.util.js';

export class WorkflowVersionService {
  async createVersion(workflowId, orgId, userId, changeNote) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId, orgId }
    });

    if (!workflow) {
      throw new AppError('Workflow not found', 'WORKFLOW_NOT_FOUND', 404);
    }

    const versionNumber = workflow.currentVersion;

    const version = await workflowVersionRepository.create({
      workflowId,
      orgId,
      version: versionNumber,
      name: workflow.name,
      steps: workflow.steps,
      agentInstruction: workflow.agentInstruction,
      triggerType: workflow.triggerType,
      triggerConfig: workflow.triggerConfig,
      variables: workflow.variables,
      changedBy: userId,
      changeNote
    });

    // Update current version for next time
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { currentVersion: versionNumber + 1 }
    });

    logger.info(`Version v${versionNumber} created for workflow ${workflowId}`);
    return version;
  }

  async getVersions(workflowId, orgId) {
    return workflowVersionRepository.findByWorkflowId(workflowId, orgId);
  }

  async getVersion(workflowId, version, orgId) {
    const v = await workflowVersionRepository.findByVersion(workflowId, parseInt(version), orgId);
    if (!v) {
      throw new AppError('Version not found', 'VERSION_NOT_FOUND', 404);
    }
    return v;
  }

  async rollbackToVersion(workflowId, versionNumber, orgId, userId) {
    const targetVersion = await this.getVersion(workflowId, versionNumber, orgId);

    // Update workflow with target version config
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        name: targetVersion.name,
        steps: targetVersion.steps,
        agentInstruction: targetVersion.agentInstruction,
        triggerType: targetVersion.triggerType,
        triggerConfig: targetVersion.triggerConfig,
        variables: targetVersion.variables
      }
    });

    // Create a new version for the rollback action itself
    await this.createVersion(
      workflowId, 
      orgId, 
      userId, 
      `Rolled back to v${versionNumber}`
    );

    logger.info(`Workflow ${workflowId} rolled back to v${versionNumber}`);
    return updatedWorkflow;
  }
}

export const workflowVersionService = new WorkflowVersionService();
