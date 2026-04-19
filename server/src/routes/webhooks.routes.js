import { Router } from 'express';
import { webhookLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Apply webhook rate limiter to all webhook routes
router.use(webhookLimiter);

// All webhook routes will be implemented in Phase 2
router.use('*', (req, res) => {
  return res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Webhooks module will be implemented in Phase 2',
    },
  });
});

export { router as webhookRoutes };
