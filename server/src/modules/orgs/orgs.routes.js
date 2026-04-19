import { Router } from 'express';
import { orgController } from './orgs.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { updateOrgSchema, getOrgStatsSchema, getOrgUsageSchema } from './orgs.schema.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/orgs/me - Get organization details
router.get('/me',
  orgController.getOrgDetails
);

// PUT /api/orgs/me - Update organization settings
router.put('/me',
  requirePermission('org:settings'),
  validate(updateOrgSchema),
  orgController.updateOrgSettings
);

// GET /api/orgs/me/stats - Get organization statistics
router.get('/me/stats',
  requirePermission('billing:view'),
  validate(getOrgStatsSchema, 'query'),
  orgController.getOrgStats
);

// GET /api/orgs/me/usage - Get organization usage
router.get('/me/usage',
  requirePermission('billing:view'),
  validate(getOrgUsageSchema, 'query'),
  orgController.getOrgUsage
);

// GET /api/orgs/me/members - Get organization members
router.get('/me/members',
  requirePermission('member:manage'),
  orgController.getOrgMembers
);

// PUT /api/orgs/me/members/:memberId/role - Update member role
router.put('/me/members/:memberId/role',
  requirePermission('member:manage'),
  (req, res, next) => {
    // Validate role input
    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!req.body.role || !validRoles.includes(req.body.role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be one of: owner, admin, member, viewer',
      });
    }
    next();
  },
  orgController.updateMemberRole
);

export { router as orgRoutes };
