import express from 'express';
import { marketplaceController } from './marketplace.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', marketplaceController.getTemplates);

// Authenticated routes
router.post('/submit', authenticate, marketplaceController.submit);
router.post('/:id/rate', authenticate, marketplaceController.rate);
router.post('/:id/use', authenticate, marketplaceController.useTemplate);

export default router;
