import { usageService } from './usage.service.js';
import { successResponse } from '../../utils/response.util.js';

export class UsageController {
  async getCurrentUsage(req, res, next) {
    try {
      const orgId = req.user?.orgId || req.apiKeyAuth?.orgId;
      const usage = await usageService.getCurrentUsage(orgId);
      return successResponse(res, usage);
    } catch (error) {
      next(error);
    }
  }

  async getUsageHistory(req, res, next) {
    try {
      const orgId = req.user?.orgId || req.apiKeyAuth?.orgId;
      const { period = '30d' } = req.query;
      const history = await usageService.getUsageHistory(orgId, period);
      return successResponse(res, history);
    } catch (error) {
      next(error);
    }
  }

  async getTopWorkflows(req, res, next) {
    try {
      const orgId = req.user?.orgId || req.apiKeyAuth?.orgId;
      const top = await usageService.getTopWorkflows(orgId);
      return successResponse(res, top);
    } catch (error) {
      next(error);
    }
  }

  async getRateLimitStatus(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const status = await usageService.getRateLimitStatus(userId);
      return successResponse(res, status);
    } catch (error) {
      next(error);
    }
  }
}

export const usageController = new UsageController();
