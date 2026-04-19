import { analyticsService } from './analytics.service.js';
import { successResponse } from '../../utils/response.util.js';

export class AnalyticsController {
  async getExecutions(req, res) {
    const analytics = await analyticsService.getExecutionAnalytics(req.user.orgId, req.query);
    return successResponse(res, analytics, 'Execution analytics retrieved');
  }

  async getTokens(req, res) {
    const analytics = await analyticsService.getTokenAnalytics(req.user.orgId);
    return successResponse(res, analytics, 'Token analytics retrieved');
  }

  async getPerformance(req, res) {
    const analytics = await analyticsService.getPerformanceMetrics(req.user.orgId);
    return successResponse(res, analytics, 'Performance metrics retrieved');
  }
}

export const analyticsController = new AnalyticsController();
