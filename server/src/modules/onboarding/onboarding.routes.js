import { Router } from 'express';
import { onboardingController } from './onboarding.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * Onboarding Routes
 */
router.get('/progress', authenticate, (req, res) => onboardingController.getProgress(req, res));
router.get('/checklist', authenticate, (req, res) => onboardingController.getChecklist(req, res));
router.post('/reset', authenticate, (req, res) => onboardingController.resetOnboarding(req, res));

export { router as onboardingRoutes };
