import { Router } from 'express';
import { billingController } from './billing.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const upgradeSchema = z.object({
  plan: z.enum(['starter', 'pro', 'enterprise'])
});

const trialSchema = z.object({
  plan: z.enum(['pro', 'enterprise']).optional()
});

router.get('/plan', 
  authenticate, 
  billingController.getCurrentPlan
);

router.get('/usage', 
  authenticate, 
  billingController.getUsageSummary
);

router.get('/invoices', 
  authenticate, 
  requirePermission('billing:view'), 
  billingController.getInvoices
);

router.post('/upgrade', 
  authenticate, 
  requirePermission('billing:view'), 
  validate(upgradeSchema),
  billingController.upgradePlan
);

router.post('/trial/start', 
  authenticate, 
  requirePermission('org:settings'), 
  validate(trialSchema),
  billingController.startTrial
);

export { router as billingRoutes };
