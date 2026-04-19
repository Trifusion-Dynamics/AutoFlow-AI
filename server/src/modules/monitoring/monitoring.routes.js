import { Router } from 'express';
import { monitoringController } from './monitoring.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * Monitoring module routes are now registered at the root level in app.js
 * for easier access by monitoring tools.
 */
router.get('/ping', (req, res) => res.send('pong'));

export { router as monitoringRoutes };

