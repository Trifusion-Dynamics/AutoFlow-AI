import express from 'express';
import { analyticsController } from './analytics.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/executions', analyticsController.getExecutions);
router.get('/tokens', analyticsController.getTokens);
router.get('/performance', analyticsController.getPerformance);

export default router;
