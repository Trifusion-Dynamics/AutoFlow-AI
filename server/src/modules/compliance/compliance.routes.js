import express from 'express';
import { complianceController } from './compliance.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/privacy-settings', complianceController.getPrivacySettings);
router.put('/privacy-settings', complianceController.updatePrivacySettings);
router.get('/data-summary', complianceController.getDataSummary);
router.post('/consent', complianceController.recordConsent);

export default router;
