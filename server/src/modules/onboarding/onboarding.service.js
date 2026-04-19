import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.util.js';

export const ONBOARDING_STEPS = [
  'profile_complete',
  'first_workflow_created',
  'workflow_activated',
  'first_execution_run',
  'webhook_configured',
  'api_key_created',
  'team_member_invited'
];

/**
 * Onboarding Service
 */
export class OnboardingService {
  /**
   * Get onboarding progress for an org
   */
  async getProgress(orgId) {
    let progress = await prisma.onboardingProgress.findUnique({
      where: { orgId }
    });

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: { orgId, completedSteps: [] }
      });
    }

    const completedCount = (progress.completedSteps || []).length;
    const totalSteps = ONBOARDING_STEPS.length;
    const percentage = Math.round((completedCount / totalSteps) * 100);

    const nextStep = ONBOARDING_STEPS.find(step => !(progress.completedSteps || []).includes(step));

    return {
      orgId,
      steps: progress.completedSteps,
      completedCount,
      totalSteps,
      percentage,
      nextStep,
      completedAt: progress.completedAt
    };
  }

  /**
   * Complete a specific onboarding step
   */
  async completeStep(orgId, step) {
    if (!ONBOARDING_STEPS.includes(step)) {
      throw new Error(`Invalid onboarding step: ${step}`);
    }

    const progress = await prisma.onboardingProgress.findUnique({
      where: { orgId }
    });

    const completedSteps = progress?.completedSteps || [];
    if (completedSteps.includes(step)) return this.getProgress(orgId);

    const newCompletedSteps = [...completedSteps, step];
    const isFinished = newCompletedSteps.length === ONBOARDING_STEPS.length;

    const updated = await prisma.onboardingProgress.upsert({
      where: { orgId },
      update: {
        completedSteps: newCompletedSteps,
        currentStep: step,
        completedAt: isFinished ? new Date() : null
      },
      create: {
        orgId,
        completedSteps: newCompletedSteps,
        currentStep: step,
        completedAt: isFinished ? new Date() : null
      }
    });

    if (isFinished) {
      logger.info(`Organization ${orgId} completed onboarding!`);
      // Could trigger a notification here
    }

    return this.getProgress(orgId);
  }

  /**
   * Auto-detect and sync onboarding progress based on DB state
   */
  async autoDetectProgress(orgId) {
    const stepsToComplete = [];

    // 1. Profile complete (assumed if org exists)
    stepsToComplete.push('profile_complete');

    // 2. First workflow created
    const workflowCount = await prisma.workflow.count({ where: { orgId } });
    if (workflowCount > 0) stepsToComplete.push('first_workflow_created');

    // 3. Workflow activated
    const activeWorkflow = await prisma.workflow.findFirst({ where: { orgId, status: 'active' } });
    if (activeWorkflow) stepsToComplete.push('workflow_activated');

    // 4. First execution run
    const executionCount = await prisma.execution.count({ where: { orgId } });
    if (executionCount > 0) stepsToComplete.push('first_execution_run');

    // 5. Webhook configured
    const webhookCount = await prisma.outboundWebhook.count({ where: { orgId } });
    if (webhookCount > 0) stepsToComplete.push('webhook_configured');

    // 6. API Key created
    const apiKeyCount = await prisma.apiKey.count({ where: { orgId } });
    if (apiKeyCount > 0) stepsToComplete.push('api_key_created');

    // 7. Team member invited
    const invitationCount = await prisma.teamInvitation.count({ where: { orgId } });
    const memberCount = await prisma.user.count({ where: { orgId } });
    if (invitationCount > 0 || memberCount > 1) stepsToComplete.push('team_member_invited');

    // Update progress in DB
    const progress = await prisma.onboardingProgress.findUnique({ where: { orgId } });
    const currentCompleted = progress?.completedSteps || [];
    
    // Merge only new steps
    const finalSteps = [...new Set([...currentCompleted, ...stepsToComplete])];
    
    await prisma.onboardingProgress.upsert({
      where: { orgId },
      update: { 
        completedSteps: finalSteps,
        completedAt: finalSteps.length === ONBOARDING_STEPS.length ? new Date() : null
      },
      create: { orgId, completedSteps: finalSteps }
    });

    return this.getProgress(orgId);
  }

  /**
   * Get detailed checklist with metadata
   */
  async getChecklist(orgId) {
    const progress = await this.autoDetectProgress(orgId);
    
    const checklistDefinitions = {
      profile_complete: { title: 'Complete your profile', description: 'Set up your organization name and settings.', action: { method: 'GET', url: '/api/v1/orgs/me' } },
      first_workflow_created: { title: 'Create your first workflow', description: 'Build an automation from scratch or template.', action: { method: 'POST', url: '/api/v1/workflows' } },
      workflow_activated: { title: 'Activate your workflow', description: 'Enable your workflow to start processing triggers.', action: { method: 'PATCH', url: '/api/v1/workflows/:id' } },
      first_execution_run: { title: 'Run an execution', description: 'Trigger your workflow and see it in action.', action: { method: 'POST', url: '/api/v1/executions/:id/trigger' } },
      webhook_configured: { title: 'Configure a webhook', description: 'Connect outward notifications to your endpoints.', action: { method: 'POST', url: '/api/v1/outbound-webhooks' } },
      api_key_created: { title: 'Create an API Key', description: 'Enable programmatic access to the platform.', action: { method: 'POST', url: '/api/v1/api-keys' } },
      team_member_invited: { title: 'Invite a team member', description: 'Collaborate with your team on workflows.', action: { method: 'POST', url: '/api/v1/teams/invitations' } }
    };

    return ONBOARDING_STEPS.map(step => ({
      step,
      ...checklistDefinitions[step],
      completed: progress.steps.includes(step),
    }));
  }

  /**
   * Reset onboarding for testing
   */
  async resetOnboarding(orgId) {
    return await prisma.onboardingProgress.update({
      where: { orgId },
      data: { completedSteps: [], completedAt: null, currentStep: null }
    });
  }
}

export const onboardingService = new OnboardingService();
