import { Router } from 'express';
import { auditController } from './audit.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/audit - Get audit logs
router.get('/',
  requirePermission('org:settings'),
  auditController.getAuditLogs
);

// GET /api/audit/stats - Get audit statistics
router.get('/stats',
  requirePermission('org:settings'),
  auditController.getAuditStats
);

// GET /api/audit/export - Export audit logs
router.get('/export',
  requirePermission('org:settings'),
  auditController.exportAuditLogs
);

// POST /api/audit/cleanup - Cleanup old audit logs
router.post('/cleanup',
  requirePermission('org:settings'),
  (req, res, next) => {
    // Validate daysToKeep
    const { daysToKeep } = req.body;
    if (daysToKeep !== undefined) {
      const days = parseInt(daysToKeep);
      if (isNaN(days) || days < 30 || days > 365) {
        return res.status(400).json({
          error: 'Invalid daysToKeep',
          message: 'daysToKeep must be a number between 30 and 365',
        });
      }
      req.body.daysToKeep = days;
    }
    next();
  },
  auditController.cleanupAuditLogs
);

// GET /api/audit/:id - Get specific audit log
router.get('/:id',
  requirePermission('org:settings'),
  auditController.getAuditLog
);

// GET /api/audit/user/:userId - Get audit logs for specific user
router.get('/user/:userId',
  requirePermission('org:settings'),
  auditController.getUserAuditLogs
);

// GET /api/audit/resource/:resourceType/:resourceId - Get audit logs for specific resource
router.get('/resource/:resourceType/:resourceId',
  requirePermission('org:settings'),
  auditController.getResourceAuditLogs
);

export { router as auditRoutes };
