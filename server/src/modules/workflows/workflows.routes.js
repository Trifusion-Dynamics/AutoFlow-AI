import { Router } from 'express';
import { workflowController } from './workflows.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { 
  createWorkflowSchema, 
  updateWorkflowSchema, 
  runWorkflowSchema,
  getWorkflowsQuerySchema 
} from './workflows.schema.js';
import { apiLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { tierRateLimiter } from '../../middlewares/tierLimiter.middleware.js';
import { idempotencyCheck } from '../../middlewares/idempotency.middleware.js';

const router = Router();

// GET /api/workflows - List workflows
router.get('/', 
  apiLimiter,
  authenticate,
  tierRateLimiter,
  requirePermission('workflow:view'),
  validate(getWorkflowsQuerySchema, 'query'),
  workflowController.getWorkflows
);

// POST /api/v1/workflows - Create workflow
router.post('/',
  apiLimiter,
  authenticate,
  tierRateLimiter,
  requirePermission('workflow:create'),
  validate(createWorkflowSchema),
  idempotencyCheck,
  workflowController.createWorkflow
);

// GET /api/workflows/:id - Get workflow by ID
router.get('/:id',
  apiLimiter,
  authenticate,
  tierRateLimiter,
  requirePermission('workflow:view'),
  workflowController.getWorkflowById
);

// PUT /api/workflows/:id - Update workflow
router.put('/:id',
  apiLimiter,
  authenticate,
  tierRateLimiter,
  requirePermission('workflow:edit'),
  validate(updateWorkflowSchema),
  workflowController.updateWorkflow
);

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id',
  apiLimiter,
  authenticate,
  tierRateLimiter,
  requirePermission('workflow:delete'),
  workflowController.deleteWorkflow
);

// POST /api/v1/workflows/:id/run - Run workflow
router.post('/:id/run',
  apiLimiter,
  authenticate,
  tierRateLimiter,
  requirePermission('workflow:run'),
  validate(runWorkflowSchema),
  idempotencyCheck,
  workflowController.runWorkflow
);

// POST /api/workflows/:id/activate - Activate workflow
router.post('/:id/activate',
  apiLimiter,
  authenticate,
  requirePermission('workflow:edit'),
  workflowController.activateWorkflow
);

// POST /api/workflows/:id/pause - Pause workflow
router.post('/:id/pause',
  apiLimiter,
  authenticate,
  requirePermission('workflow:edit'),
  workflowController.pauseWorkflow
);

export { router as workflowRoutes };
