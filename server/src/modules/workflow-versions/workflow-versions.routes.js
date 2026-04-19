import express from 'express';
import { workflowVersionController } from './workflow-versions.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/:workflowId/versions', workflowVersionController.list);
router.get('/:workflowId/versions/:version', workflowVersionController.getOne);
router.post('/:workflowId/versions/:version/rollback', workflowVersionController.rollback);

export default router;
