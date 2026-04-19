import { Router } from 'express';
import { streamController } from './stream.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * SSE Streaming Routes
 */
router.get('/executions/:id', authenticate, (req, res) => streamController.streamExecution(req, res));
router.get('/org', authenticate, (req, res) => streamController.streamOrgEvents(req, res));

export { router as streamRoutes };
