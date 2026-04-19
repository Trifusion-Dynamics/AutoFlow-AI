import { Router } from 'express';
import { templatesController } from './templates.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { setCacheHeaders } from '../../middlewares/cacheHeaders.middleware.js';

const router = Router();

/**
 * Public/Shared Template Routes
 */
router.get('/', setCacheHeaders(3600, { public: true }), (req, res) => templatesController.getTemplates(req, res));
router.get('/categories', setCacheHeaders(86400, { public: true }), (req, res) => templatesController.getCategories(req, res));
router.get('/my', authenticate, setCacheHeaders(60, { public: false }), (req, res) => templatesController.getOrgTemplates(req, res));
router.get('/:id', setCacheHeaders(3600, { public: true }), (req, res) => templatesController.getTemplateById(req, res));


/**
 * Authenticated Template Routes
 */
router.post('/', authenticate, (req, res) => templatesController.createTemplate(req, res));
router.post('/:id/use', authenticate, (req, res) => templatesController.useTemplate(req, res));

export { router as templatesRoutes };
