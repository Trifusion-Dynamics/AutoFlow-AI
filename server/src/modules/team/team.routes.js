import { Router } from 'express';
import { teamController } from './team.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { z } from 'zod';
import { ROLES } from '../../config/constants.js';

const router = Router();

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(Object.values(ROLES))
});

const acceptSchema = z.object({
  token: z.string()
});

const updateRoleSchema = z.object({
  role: z.enum(Object.values(ROLES))
});

const transferSchema = z.object({
  newOwnerId: z.string().uuid()
});

// All routes require authentication
router.use(authenticate);

router.get('/members', 
  teamController.getTeamMembers
);

router.post('/invite', 
  requirePermission('member:manage'),
  validate(inviteSchema),
  teamController.inviteMember
);

router.delete('/invite/:id', 
  requirePermission('member:manage'),
  teamController.cancelInvitation
);

router.post('/invite/:id/resend', 
  requirePermission('member:manage'),
  teamController.resendInvitation
);

router.post('/invite/accept', 
  validate(acceptSchema),
  teamController.acceptInvitation
);

router.put('/members/:userId/role', 
  requirePermission('member:manage'),
  validate(updateRoleSchema),
  teamController.updateMemberRole
);

router.delete('/members/:userId', 
  requirePermission('member:manage'),
  teamController.removeMember
);

router.post('/transfer-ownership', 
  requirePermission('org:settings'),
  validate(transferSchema),
  teamController.transferOwnership
);

export { router as teamRoutes };
