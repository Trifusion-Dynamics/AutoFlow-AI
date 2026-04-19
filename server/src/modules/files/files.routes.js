import { Router } from 'express';
import { filesController } from './files.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { fileUpload } from '../../middlewares/fileUpload.middleware.js';

const router = Router();

router.post('/upload', authenticate, fileUpload.single('file'), (req, res) => filesController.upload(req, res));
router.get('/', authenticate, (req, res) => filesController.list(req, res));
router.get('/download/:id', authenticate, (req, res) => filesController.download(req, res));
router.delete('/:id', authenticate, (req, res) => filesController.delete(req, res));

export { router as filesRoutes };
