import { adminService } from './admin.service.js';
import { successResponse } from '../../utils/response.util.js';

class AdminController {
  async getAllOrganizations(req, res, next) {
    try {
      const { page, limit } = req.query;
      const data = await adminService.getAllOrganizations({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });
      return successResponse(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getSystemStats(req, res, next) {
    try {
      const stats = await adminService.getSystemStats();
      return successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async updateOrgPlan(req, res, next) {
    try {
      const { orgId } = req.params;
      const { plan, tokenQuota } = req.body;
      const result = await adminService.updateOrgPlan(orgId, plan, tokenQuota);
      return successResponse(res, result, 'Organization plan updated by admin');
    } catch (error) {
      next(error);
    }
  }

  async impersonateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await adminService.impersonateUser(req.user.id, userId);
      return successResponse(res, result, 'Impersonation context prepared');
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
