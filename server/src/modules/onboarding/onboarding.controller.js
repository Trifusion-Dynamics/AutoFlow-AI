import { onboardingService } from './onboarding.service.js';
import { successResponse, errorResponse } from '../../utils/response.util.js';

/**
 * Onboarding Controller
 */
export class OnboardingController {
  /**
   * GET /api/v1/onboarding/progress
   */
  async getProgress(req, res) {
    try {
      const progress = await onboardingService.getProgress(req.user.orgId);
      return successResponse(res, progress);
    } catch (error) {
      return errorResponse(res, 'ONBOARDING_FETCH_ERROR', error.message, 500);
    }
  }

  /**
   * GET /api/v1/onboarding/checklist
   */
  async getChecklist(req, res) {
    try {
      const checklist = await onboardingService.getChecklist(req.user.orgId);
      return successResponse(res, checklist);
    } catch (error) {
      return errorResponse(res, 'ONBOARDING_FETCH_ERROR', error.message, 500);
    }
  }

  /**
   * POST /api/v1/onboarding/reset
   */
  async resetOnboarding(req, res) {
    try {
      const result = await onboardingService.resetOnboarding(req.user.orgId);
      return successResponse(res, result, 'Onboarding progress reset');
    } catch (error) {
      return errorResponse(res, 'ONBOARDING_RESET_ERROR', error.message, 500);
    }
  }
}

export const onboardingController = new OnboardingController();
