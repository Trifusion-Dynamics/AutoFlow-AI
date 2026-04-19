import { teamService } from './team.service.js';
import { successResponse } from '../../utils/response.util.js';

class TeamController {
  async getTeamMembers(req, res, next) {
    try {
      const data = await teamService.getTeamMembers(req.orgId);
      return successResponse(res, data);
    } catch (error) {
      console.error('getTeamMembers Error:', error);
      next(error);
    }
  }

  async inviteMember(req, res, next) {
    try {
      const { email, role } = req.body;
      const invitation = await teamService.inviteMember(
        req.orgId,
        req.user.id,
        email,
        role
      );
      return successResponse(res, invitation, 'Member invited successfully', 201);
    } catch (error) {
      console.error('inviteMember Error:', error);
      next(error);
    }
  }

  async cancelInvitation(req, res, next) {
    try {
      const { id } = req.params;
      await teamService.cancelInvitation(id, req.orgId);
      return successResponse(res, null, 'Invitation cancelled');
    } catch (error) {
      next(error);
    }
  }

  async resendInvitation(req, res, next) {
    try {
      const { id } = req.params;
      const result = await teamService.resendInvitation(id, req.orgId);
      return successResponse(res, result, 'Invitation resent');
    } catch (error) {
      next(error);
    }
  }

  async acceptInvitation(req, res, next) {
    try {
      const { token } = req.body;
      const result = await teamService.acceptInvitation(token, req.user);
      return successResponse(res, result, 'Invitation accepted');
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const updated = await teamService.updateMemberRole(
        req.orgId,
        userId,
        role,
        req.user
      );
      return successResponse(res, updated, 'Member role updated');
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const { userId } = req.params;
      await teamService.removeMember(req.orgId, userId, req.user);
      return successResponse(res, null, 'Member removed');
    } catch (error) {
      next(error);
    }
  }

  async transferOwnership(req, res, next) {
    try {
      const { newOwnerId } = req.body;
      const result = await teamService.transferOwnership(
        req.orgId,
        newOwnerId,
        req.user.id
      );
      return successResponse(res, result, 'Ownership transfer complete');
    } catch (error) {
      next(error);
    }
  }
}

export const teamController = new TeamController();
