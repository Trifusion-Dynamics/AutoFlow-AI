import { Router } from 'express';
import { usageController } from './usage.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { apiLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

// GET /api/v1/usage/current — Current usage breakdown
router.get('/current',
  apiLimiter,
  authenticate,
  usageController.getCurrentUsage
);

// GET /api/v1/usage/history — Usage history over time
router.get('/history',
  apiLimiter,
  authenticate,
  usageController.getUsageHistory
);

// GET /api/v1/usage/top — Top workflows by metrics
router.get('/top',
  apiLimiter,
  authenticate,
  usageController.getTopWorkflows
);

// GET /api/v1/usage/rate-limits — Current rate limit status
router.get('/rate-limits',
  apiLimiter,
  authenticate,
  usageController.getRateLimitStatus
);

export { router as usageRoutes };
