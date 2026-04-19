import express from 'express';
import { integrationsController } from './integrations.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', integrationsController.getAvailable);
router.post('/connect', integrationsController.connect);
router.delete('/:name', integrationsController.disconnect);
router.post('/test', integrationsController.testConnection);

export default router;
