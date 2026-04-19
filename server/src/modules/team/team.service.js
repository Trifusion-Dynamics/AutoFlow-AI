import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.util.js';
import crypto from 'crypto';
import { billingService } from '../billing/billing.service.js';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../../utils/errors.js';
import { ROLES } from '../../config/constants.js';

class TeamService {
  /**
   * Invite a new member to the organization
   */
  async inviteMember(orgId, invitedBy, email, role) {
    // 1. Check member limit (billing)
    await billingService.enforceMemberLimit(orgId);

    // 2. Check if already a member
    const existingMember = await prisma.user.findFirst({
      where: { orgId, email }
    });
    if (existingMember) {
      throw new ConflictError('User is already a member of this organization');
    }

    // 3. Check if pending invite exists
    const pendingInvite = await prisma.teamInvitation.findFirst({
      where: { orgId, email, status: 'pending' }
    });
    if (pendingInvite) {
      throw new ConflictError('A pending invitation already exists for this email');
    }

    // 4. Generate invite token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    // 5. Save invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        orgId,
        invitedBy,
        email,
        role,
        token,
        expiresAt,
        status: 'pending'
      }
    });

    // 6. Send invite email (Placeholder for now)
    // TODO: Integration with email service
    logger.info(`Invitation created for ${email} in org ${orgId}. Link: ${process.env.APP_URL}/invite/accept?token=${token}`);

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        userId: invitedBy,
        action: 'member.invited',
        resourceType: 'invitation',
        resourceId: invitation.id,
        newValue: { email, role }
      }
    });

    return invitation;
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token, acceptingUser) {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token }
    });

    if (!invitation || invitation.status !== 'pending') {
      throw new NotFoundError('Invitation not found or no longer pending');
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' }
      });
      throw new ValidationError('Invitation has expired');
    }

    if (acceptingUser.email !== invitation.email) {
      throw new ForbiddenError('This invitation was sent to a different email address');
    }

    // Add user to org with role
    await prisma.user.update({
      where: { id: acceptingUser.id },
      data: {
        orgId: invitation.orgId,
        role: invitation.role
      }
    });

    // Mark invitation accepted
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date()
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: invitation.orgId,
        userId: acceptingUser.id,
        action: 'member.joined',
        resourceType: 'user',
        resourceId: acceptingUser.id
      }
    });

    return { success: true, orgId: invitation.orgId };
  }

  async cancelInvitation(invitationId, orgId) {
    const invitation = await prisma.teamInvitation.findFirst({
      where: { id: invitationId, orgId }
    });

    if (!invitation) throw new NotFoundError('Invitation not found');

    return await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: 'cancelled' }
    });
  }

  async resendInvitation(invitationId, orgId) {
    const invitation = await prisma.teamInvitation.findFirst({
      where: { id: invitationId, orgId }
    });

    if (!invitation) throw new NotFoundError('Invitation not found');

    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const updatedInvite = await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        status: 'pending'
      }
    });

    // Send email again...
    return updatedInvite;
  }

  async getTeamMembers(orgId) {
    const members = await prisma.user.findMany({
      where: { orgId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    const pendingInvites = await prisma.teamInvitation.findMany({
      where: { orgId, status: 'pending' }
    });

    return { members, invitations: pendingInvites };
  }

  async updateMemberRole(orgId, targetUserId, newRole, requestingUser) {
    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, orgId }
    });

    if (!targetUser) throw new NotFoundError('User not found in organization');

    // Business Logic for role changes
    if (requestingUser.role !== ROLES.OWNER && requestingUser.role !== ROLES.ADMIN) {
      throw new ForbiddenError('Only owners and admins can change roles');
    }

    if (requestingUser.role === ROLES.ADMIN && (targetUser.role === ROLES.OWNER || targetUser.role === ROLES.ADMIN)) {
      throw new ForbiddenError('Admins can only change roles of members and viewers');
    }

    if (targetUser.id === requestingUser.id) {
      throw new ForbiddenError('You cannot change your own role');
    }

    // Role specific checks (cannot demote last owner)
    if (targetUser.role === ROLES.OWNER) {
      const ownerCount = await prisma.user.count({
        where: { orgId, role: ROLES.OWNER }
      });
      if (ownerCount <= 1) {
        throw new ForbiddenError('Cannot demote the last owner');
      }
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole }
    });

    // Audit Log
    return updated;
  }

  async removeMember(orgId, targetUserId, requestingUser) {
    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, orgId }
    });

    if (!targetUser) throw new NotFoundError('User not found');
    if (targetUser.id === requestingUser.id) throw new ForbiddenError('Cannot remove yourself');
    if (targetUser.role === ROLES.OWNER) throw new ForbiddenError('Cannot remove an owner');

    // Soft delete
    await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: false, orgId: 'unassigned' } // Or keep orgId and just inactive
    });

    // Revoke tokens and API keys
    await prisma.refreshToken.updateMany({ where: { userId: targetUserId }, data: { isRevoked: true } });
    await prisma.apiKey.updateMany({ where: { createdBy: targetUserId }, data: { isActive: false } });

    return { success: true };
  }

  async transferOwnership(orgId, newOwnerId, currentOwnerId) {
    // This usually requires a high-security flow (confirmation email)
    // For now, implement basic logic
    const newOwner = await prisma.user.findFirst({ where: { id: newOwnerId, orgId } });
    if (!newOwner) throw new NotFoundError('Target user not in organization');

    await prisma.$transaction([
      prisma.user.update({ where: { id: currentOwnerId }, data: { role: ROLES.ADMIN } }),
      prisma.user.update({ where: { id: newOwnerId }, data: { role: ROLES.OWNER } }),
      prisma.organization.update({ 
        where: { id: orgId }, 
        data: { 
          auditLogs: { 
            create: { 
              userId: currentOwnerId, 
              action: 'org.ownership_transferred', 
              newValue: { from: currentOwnerId, to: newOwnerId } 
            } 
          } 
        } 
      })
    ]);

    return { success: true };
  }
}

export const teamService = new TeamService();
