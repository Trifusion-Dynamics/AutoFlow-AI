import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workflowService } from '../../src/modules/workflows/workflows.service.js';
import { workflowRepository } from '../../src/modules/workflows/workflows.repository.js';
import { billingService } from '../../src/modules/billing/billing.service.js';
import { agentService } from '../../src/agents/agent.service.js';
import { prisma } from '../../src/config/db.js';
import { AppError } from '../../src/utils/errors.js';

vi.mock('../../src/modules/workflows/workflows.repository.js', () => ({
  workflowRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findByOrgId: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    softDelete: vi.fn(),
  },
}));

vi.mock('../../src/modules/billing/billing.service.js', () => ({
  billingService: {
    enforceWorkflowLimit: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../src/agents/agent.service.js', () => ({
  agentService: {
    executeWorkflow: vi.fn(),
  },
}));

vi.mock('../../src/config/db.js', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe('WorkflowService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWorkflow()', () => {
    it('should create a workflow successfully', async () => {
      const data = { name: 'Test Workflow', triggerType: 'manual' };
      const workflow = { id: 'wf-1', ...data };
      
      workflowRepository.create.mockResolvedValue(workflow);

      const result = await workflowService.createWorkflow('user-1', 'org-1', data);

      expect(result.workflow).toEqual(workflow);
      expect(billingService.enforceWorkflowLimit).toHaveBeenCalledWith('org-1');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should generate webhook secret for webhook trigger', async () => {
      const data = { name: 'Webhook WF', triggerType: 'webhook' };
      workflowRepository.create.mockImplementation((d) => Promise.resolve({ id: 'wf-2', ...d }));

      const result = await workflowService.createWorkflow('user-1', 'org-1', data);

      expect(result.workflow.triggerConfig.webhookSecret).toBeDefined();
      expect(result.webhookUrl).toContain('/api/webhooks/wf-2');
    });
  });

  describe('runWorkflow()', () => {
    it('should trigger execution for active workflow', async () => {
      const workflow = { id: 'wf-1', status: 'active', orgId: 'org-1' };
      workflowRepository.findById.mockResolvedValue(workflow);
      agentService.executeWorkflow.mockResolvedValue({ executionId: 'ex-1', status: 'queued' });

      const result = await workflowService.runWorkflow('wf-1', 'org-1', 'user-1', {});

      expect(result.executionId).toBe('ex-1');
      expect(result.status).toBe('queued');
    });

    it('should throw 400 for draft workflow', async () => {
      workflowRepository.findById.mockResolvedValue({ id: 'wf-1', status: 'draft' });

      await expect(workflowService.runWorkflow('wf-1', 'org-1', 'user-1', {}))
        .rejects.toThrow(AppError);
    });
  });

  describe('deleteWorkflow()', () => {
    it('should soft delete the workflow', async () => {
      workflowRepository.findById.mockResolvedValue({ id: 'wf-1', triggerType: 'manual' });
      
      await workflowService.deleteWorkflow('wf-1', 'org-1', 'user-1');

      expect(workflowRepository.softDelete).toHaveBeenCalledWith('wf-1', 'org-1');
    });
  });
});
