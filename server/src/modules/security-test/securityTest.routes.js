import { Router } from 'express';
import { securityTestController } from './securityTest.controller.js';

const router = Router();

router.get('/headers', securityTestController.getHeaders);
router.get('/rate-limit-status', securityTestController.getRateLimitStatus);
router.get('/checklist', securityTestController.getChecklist);
router.post('/injection-test', securityTestController.testInjection);

export { router as securityTestRoutes };
