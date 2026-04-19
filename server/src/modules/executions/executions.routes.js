import { Router } from 'express';
import { executionController } from './executions.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { getExecutionsQuerySchema } from '../workflows/workflows.schema.js';
import { apiLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { tierRateLimiter } from '../../middlewares/tierLimiter.middleware.js';

const router = Router();

// GET /api/executions - List all executions for org
router.get('/', 
  apiLimiter,
  authenticate,
  tierRateLimiter,
  requirePermission('execution:view'),
  validate(getExecutionsQuerySchema, 'query'),
  executionController.getExecutions
);

// GET /api/executions/stats - Get execution statistics
router.get('/stats',
  apiLimiter,
  authenticate,
  tierRateLimiter,
  requirePermission('execution:view'),
  executionController.getStats
);

// GET /api/executions/:id - Get single execution
router.get('/:id',
  apiLimiter,
  authenticate,
  tierRateLimiter,
  requirePermission('execution:view'),
  executionController.getExecution
);

// GET /api/v1/executions/:id/stream - Stream execution updates (SSE)
router.get('/:id/stream',
  authenticate,
  requirePermission('execution:view'),
  executionController.streamExecution
);

// GET /api/executions/workflow/:workflowId - Get executions for specific workflow
router.get('/workflow/:workflowId',
  apiLimiter,
  authenticate,
  requirePermission('execution:view'),
  validate(getExecutionsQuerySchema, 'query'),
  executionController.getExecutionsByWorkflow
);

export default router;
