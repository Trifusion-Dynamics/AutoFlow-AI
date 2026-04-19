import { Router } from 'express';
import { apiKeyController } from './api-keys.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { createApiKeySchema, listApiKeysSchema } from './api-keys.schema.js';
import { idempotencyCheck } from '../../middlewares/idempotency.middleware.js';

const router = Router();

// All routes require JWT authentication (not API key authentication)
router.use(authenticate);

// GET /api/api-keys - List API keys
router.get('/', 
  requirePermission('apikey:manage'),
  validate(listApiKeysSchema, 'query'),
  apiKeyController.listApiKeys
);

// POST /api/v1/api-keys - Generate new API key
router.post('/',
  requirePermission('apikey:manage'),
  validate(createApiKeySchema),
  idempotencyCheck,
  apiKeyController.generateApiKey
);

// GET /api/api-keys/stats - Get API key statistics
router.get('/stats',
  requirePermission('apikey:manage'),
  apiKeyController.getApiKeyStats
);

// GET /api/api-keys/:id - Get specific API key
router.get('/:id',
  requirePermission('apikey:manage'),
  apiKeyController.getApiKey
);

// DELETE /api/api-keys/:id - Revoke API key
router.delete('/:id',
  requirePermission('apikey:manage'),
  apiKeyController.revokeApiKey
);

export { router as apiKeyRoutes };
