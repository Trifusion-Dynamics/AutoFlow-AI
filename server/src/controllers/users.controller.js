import { usersService } from '../services/users.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';
import { parsePaginationParams, getPaginationMeta } from '../utils/pagination.util.js';

export class UsersController {
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      
      const user = await usersService.getProfile(userId);
      
      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, email } = req.validatedBody;
      
      const updatedUser = await usersService.updateProfile(userId, { name, email });
      
      return successResponse(res, updatedUser);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.validatedBody;
      
      const result = await usersService.changePassword(userId, oldPassword, newPassword);
      
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getOrgMembers(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const pagination = parsePaginationParams(req.query);
      
      const { users, pagination: paginationMeta } = await usersService.getOrgMembers(orgId, pagination);
      
      return successResponse(res, users, 200, { pagination: paginationMeta });
    } catch (error) {
      next(error);
    }
  }

  async inviteMember(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const { email, role } = req.validatedBody;
      
      const result = await usersService.inviteMember(orgId, email, role);
      
      return successResponse(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const { userId } = req.validatedParams;
      const { role } = req.validatedBody;
      
      const updatedUser = await usersService.updateMemberRole(orgId, userId, role);
      
      return successResponse(res, updatedUser);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const { userId } = req.validatedParams;
      
      const deletedUser = await usersService.removeMember(orgId, userId);
      
      return successResponse(res, deletedUser);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
