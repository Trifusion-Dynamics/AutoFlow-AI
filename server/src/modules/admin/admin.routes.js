import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/adminAuth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { z } from 'zod';
import { PLANS } from '../../config/plans.js';

const router = Router();

// Validation schemas
const updatePlanSchema = z.object({
  plan: z.enum(PLANS),
  tokenQuota: z.number().int().positive().optional()
});

// All routes require authentication and system admin privileges
router.use(authenticate);
router.use(requireAdmin);

router.get('/organizations', 
  adminController.getAllOrganizations
);

router.get('/stats', 
  adminController.getSystemStats
);

router.patch('/organizations/:orgId/plan', 
  validate(updatePlanSchema),
  adminController.updateOrgPlan
);

router.post('/users/:userId/impersonate', 
  adminController.impersonateUser
);

export { router as adminRoutes };
