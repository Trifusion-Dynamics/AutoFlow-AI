import { usersRepository } from '../repositories/users.repository.js';
import { prisma } from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/crypto.util.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.util.js';
import { ROLES } from '../config/constants.js';
import { billingService } from '../modules/billing/billing.service.js';

export class UsersService {
  async getProfile(userId) {
    const user = await usersRepository.findWithOrg(userId);
    
    if (!user) {
      throw new AppError(
        'User not found',
        'USER_NOT_FOUND',
        404
      );
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  }

  async updateProfile(userId, data) {
    const { name, email } = data;
    
    // Check if email is being updated and if it's already taken
    if (email) {
      const existingUser = await usersRepository.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        throw new AppError(
          'Email already exists',
          'EMAIL_EXISTS',
          409
        );
      }
    }

    const updatedUser = await usersRepository.update(userId, { name, email });
    
    if (!updatedUser) {
      throw new AppError(
        'User not found',
        'USER_NOT_FOUND',
        404
      );
    }

    logger.info('User profile updated', { userId, name, email });

    return updatedUser;
  }

  async changePassword(userId, oldPassword, newPassword) {
    // Get user with password hash
    const user = await usersRepository.findByEmailWithPassword(userId);
    
    if (!user) {
      throw new AppError(
        'User not found',
        'USER_NOT_FOUND',
        404
      );
    }

    // Verify old password
    const isValidPassword = await comparePassword(oldPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(
        'Current password is incorrect',
        'INVALID_PASSWORD',
        400
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await usersRepository.update(userId, { passwordHash: newPasswordHash });

    // Revoke all refresh tokens for this user (security)
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    logger.info('User password changed', { userId });

    return { message: 'Password updated successfully' };
  }

  async getOrgMembers(orgId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    
    const { users, total } = await usersRepository.findByOrgId(orgId, { page, limit });
    
    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async inviteMember(orgId, email, role) {
    // Check member limit (billing)
    await billingService.enforceMemberLimit(orgId);

    // Check if user already exists
    const existingUser = await usersRepository.findByEmail(email);
    
    if (existingUser) {
      throw new AppError(
        'User already exists',
        'USER_EXISTS',
        409
      );
    }

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      throw new AppError(
        'Invalid role',
        'INVALID_ROLE',
        400
      );
    }

    // TODO: Implement invitation logic with email sending
    // For now, this is a placeholder as mentioned in requirements
    
    logger.info('Member invitation placeholder', { orgId, email, role });

    return { 
      message: 'Invitation functionality will be implemented in Phase 3',
      invitation: {
        orgId,
        email,
        role,
        status: 'pending',
      }
    };
  }

  async updateMemberRole(orgId, targetUserId, newRole) {
    // Validate role
    if (!Object.values(ROLES).includes(newRole)) {
      throw new AppError(
        'Invalid role',
        'INVALID_ROLE',
        400
      );
    }

    // Get target user
    const targetUser = await usersRepository.findById(targetUserId);
    
    if (!targetUser) {
      throw new AppError(
        'User not found',
        'USER_NOT_FOUND',
        404
      );
    }

    // Check if user belongs to the organization
    if (targetUser.orgId !== orgId) {
      throw new AppError(
        'User does not belong to this organization',
        'USER_NOT_IN_ORG',
        403
      );
    }

    // Prevent changing the owner role
    if (targetUser.role === ROLES.OWNER) {
      throw new AppError(
        'Cannot change owner role',
        'CANNOT_CHANGE_OWNER',
        403
      );
    }

    // Update role
    const updatedUser = await usersRepository.updateRole(targetUserId, newRole);

    logger.info('Member role updated', { 
      orgId, 
      targetUserId, 
      oldRole: targetUser.role, 
      newRole 
    });

    return updatedUser;
  }

  async removeMember(orgId, targetUserId) {
    // Get target user
    const targetUser = await usersRepository.findById(targetUserId);
    
    if (!targetUser) {
      throw new AppError(
        'User not found',
        'USER_NOT_FOUND',
        404
      );
    }

    // Check if user belongs to the organization
    if (targetUser.orgId !== orgId) {
      throw new AppError(
        'User does not belong to this organization',
        'USER_NOT_IN_ORG',
        403
      );
    }

    // Prevent removing the owner
    if (targetUser.role === ROLES.OWNER) {
      throw new AppError(
        'Cannot remove organization owner',
        'CANNOT_REMOVE_OWNER',
        403
      );
    }

    // Soft delete user
    const deletedUser = await usersRepository.delete(targetUserId);

    logger.info('Member removed', { orgId, targetUserId });

    return deletedUser;
  }
}

export const usersService = new UsersService();
