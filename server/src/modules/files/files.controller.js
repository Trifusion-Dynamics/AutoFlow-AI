import { filesService } from './files.service.js';
import { logger } from '../../utils/logger.util.js';

export class FilesController {
  async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const file = await filesService.createFileRecord({
        ...req.file,
        orgId: req.user.orgId,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        data: file
      });
    } catch (error) {
      logger.error('File upload controller error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async download(req, res) {
    try {
      const { id } = req.params;
      const { file, content } = await filesService.getFile(id, req.user.orgId);

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.send(content);
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async list(req, res) {
    try {
      const files = await filesService.listFiles(req.user.orgId);
      res.json({ success: true, data: files });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await filesService.deleteFile(req.params.id, req.user.orgId);
      res.json({ success: true, message: 'File deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const filesController = new FilesController();
