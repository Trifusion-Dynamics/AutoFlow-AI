import { Router } from 'express';
import { apiLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Apply rate limiter to all workflow routes
router.use(apiLimiter);

// All workflow routes will be implemented in Phase 2
router.use('*', (req, res) => {
  return res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Workflows module will be implemented in Phase 2',
    },
  });
});

export { router as workflowRoutes };
