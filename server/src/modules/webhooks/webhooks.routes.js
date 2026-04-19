import { Router } from 'express';
import { webhookController } from './webhooks.controller.js';
import { webhookLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

// POST /api/webhooks/:workflowId - Handle webhook trigger
router.post('/:workflowId',
  webhookLimiter,
  webhookController.handleWebhook
);

export default router;
