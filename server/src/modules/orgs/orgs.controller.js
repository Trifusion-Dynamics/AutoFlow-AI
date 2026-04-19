import { orgService } from './orgs.service.js';
import { successResponse } from '../../utils/response.util.js';
import { AppError } from '../../utils/errors.js';

export class OrgController {
  async getOrgDetails(req, res, next) {
    try {
      const orgId = req.user.orgId;
      
      const org = await orgService.getOrgDetails(orgId);

      return successResponse(res, org, 'Organization details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateOrgSettings(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const userId = req.user.id;
      const { name, settings } = req.body;

      const updatedOrg = await orgService.updateOrgSettings(orgId, userId, {
        name,
        settings,
      });

      return successResponse(res, updatedOrg, 'Organization settings updated successfully');
    } catch (error) {
      if (error.message === 'Organization not found') {
        return next(new AppError('Organization not found', 'ORG_NOT_FOUND', 404));
      }
      if (error.message.includes('Only organization owners can update')) {
        return next(new AppError(error.message, 'INSUFFICIENT_PERMISSIONS', 403));
      }
      next(error);
    }
  }

  async getOrgStats(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const period = req.query.period || 'month';

      const stats = await orgService.getOrgStats(orgId, period);

      return successResponse(res, stats, 'Organization statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getOrgUsage(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const period = req.query.period || 'month';

      const usage = await orgService.getOrgUsage(orgId, period);

      return successResponse(res, usage, 'Organization usage retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getOrgMembers(req, res, next) {
    try {
      const orgId = req.user.orgId;

      const members = await orgService.getOrgMembers(orgId);

      return successResponse(res, members, 'Organization members retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const userId = req.user.id;
      const { memberId } = req.params;
      const { role } = req.body;

      const updatedMember = await orgService.updateMemberRole(orgId, userId, memberId, role);

      return successResponse(res, updatedMember, 'Member role updated successfully');
    } catch (error) {
      if (error.message === 'User not found') {
        return next(new AppError('User not found', 'USER_NOT_FOUND', 404));
      }
      if (error.message.includes('Only owners and admins can change')) {
        return next(new AppError(error.message, 'INSUFFICIENT_PERMISSIONS', 403));
      }
      if (error.message.includes('Cannot change role')) {
        return next(new AppError(error.message, 'INSUFFICIENT_PERMISSIONS', 403));
      }
      next(error);
    }
  }
}

export const orgController = new OrgController();
