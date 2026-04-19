import { Router } from 'express';
import { outboundWebhookController } from './outbound-webhooks.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createWebhookSchema } from './outbound-webhooks.schema.js';
import { apiLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { idempotencyCheck } from '../../middlewares/idempotency.middleware.js';

const router = Router();

// GET /api/v1/outbound-webhooks — List all webhooks
router.get('/',
  apiLimiter,
  authenticate,
  outboundWebhookController.listWebhooks
);

// POST /api/v1/outbound-webhooks — Create webhook
router.post('/',
  apiLimiter,
  authenticate,
  validate(createWebhookSchema),
  idempotencyCheck,
  outboundWebhookController.createWebhook
);

// GET /api/v1/outbound-webhooks/:id — Get webhook details
router.get('/:id',
  apiLimiter,
  authenticate,
  outboundWebhookController.getWebhook
);

// DELETE /api/v1/outbound-webhooks/:id — Delete webhook
router.delete('/:id',
  apiLimiter,
  authenticate,
  outboundWebhookController.deleteWebhook
);

// POST /api/v1/outbound-webhooks/:id/test — Send test event
router.post('/:id/test',
  apiLimiter,
  authenticate,
  outboundWebhookController.testWebhook
);

// GET /api/v1/outbound-webhooks/:id/deliveries — List delivery history
router.get('/:id/deliveries',
  apiLimiter,
  authenticate,
  outboundWebhookController.listDeliveries
);

export { router as outboundWebhookRoutes };
