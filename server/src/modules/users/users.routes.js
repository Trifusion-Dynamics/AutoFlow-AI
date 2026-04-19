import { Router } from 'express';
import { usersController } from './users.controller.js';
import { validate, validateParams } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { z } from 'zod';
import { ROLES } from '../../config/constants.js';

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(Object.values(ROLES), {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(Object.values(ROLES), {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

const userIdParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

const router = Router();

// Apply authentication to all user routes
router.use(authenticate);

// GET /api/users/me - Get current user profile
router.get('/me', usersController.getProfile);

// PUT /api/users/me - Update current user profile
router.put('/me', validate(updateProfileSchema), usersController.updateProfile);

// POST /api/users/change-password - Change current user password
router.post('/change-password', validate(changePasswordSchema), usersController.changePassword);

// GET /api/users/org/members - Get organization members (requires member:manage permission)
router.get('/org/members', 
  requirePermission('member:manage'), 
  usersController.getOrgMembers
);

// POST /api/users/org/invite - Invite member to organization (requires member:manage permission)
router.post('/org/invite', 
  requirePermission('member:manage'),
  validate(inviteMemberSchema), 
  usersController.inviteMember
);

// PUT /api/users/org/members/:userId/role - Update member role (requires member:manage permission)
router.put('/org/members/:userId/role', 
  requirePermission('member:manage'),
  validateParams(userIdParamsSchema),
  validate(updateMemberRoleSchema), 
  usersController.updateMemberRole
);

// DELETE /api/users/org/members/:userId - Remove member from organization (requires member:manage permission)
router.delete('/org/members/:userId', 
  requirePermission('member:manage'),
  validateParams(userIdParamsSchema),
  usersController.removeMember
);

export { router as userRoutes };
