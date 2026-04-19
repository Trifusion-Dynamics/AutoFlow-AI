import { auditRepository } from './audit.repository.js';
import { successResponse } from '../../utils/response.util.js';
import { AppError } from '../../utils/errors.js';

export class AuditController {
  async getAuditLogs(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const {
        page,
        limit,
        action,
        userId,
        resourceType,
        from,
        to,
      } = req.query;

      const filters = {
        action,
        userId,
        resourceType,
        from,
        to,
      };

      const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      };

      const result = await auditRepository.findByOrgId(orgId, filters, pagination);

      return successResponse(res, result, 'Audit logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAuditLog(req, res, next) {
    try {
      const { id } = req.params;
      const orgId = req.user.orgId;

      const auditLog = await auditRepository.findById(id, orgId);

      if (!auditLog) {
        throw new AppError('Audit log not found', 'AUDIT_LOG_NOT_FOUND', 404);
      }

      return successResponse(res, auditLog, 'Audit log retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAuditStats(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const { from, to } = req.query;

      const filters = {
        from,
        to,
      };

      const stats = await auditRepository.getAuditStats(orgId, filters);

      return successResponse(res, stats, 'Audit statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUserAuditLogs(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const { userId } = req.params;
      const { page, limit } = req.query;

      const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      };

      const result = await auditRepository.findByUserId(orgId, userId, pagination);

      return successResponse(res, result, 'User audit logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getResourceAuditLogs(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const { resourceType, resourceId } = req.params;
      const { page, limit } = req.query;

      const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      };

      const result = await auditRepository.findByResource(
        orgId,
        resourceType,
        resourceId,
        pagination
      );

      return successResponse(res, result, 'Resource audit logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async exportAuditLogs(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const {
        action,
        userId,
        resourceType,
        from,
        to,
        format = 'json',
      } = req.query;

      const filters = {
        action,
        userId,
        resourceType,
        from,
        to,
      };

      // Get all logs (no pagination for export)
      const { auditLogs } = await auditRepository.findByOrgId(orgId, filters, {
        page: 1,
        limit: 10000, // Reasonable limit for export
      });

      if (format === 'csv') {
        // Convert to CSV
        const csvHeader = 'Timestamp,Action,Resource Type,Resource ID,User Name,User Email,IP Address,Details\n';
        const csvRows = auditLogs.map(log => {
          const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
          return `"${log.createdAt}","${log.action}","${log.resourceType}","${log.resourceId}","${log.user?.name || ''}","${log.user?.email || ''}","${log.ipAddress || ''}","${details}"`;
        }).join('\n');

        const csv = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      } else {
        // Default to JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);
        return res.json({
          exportedAt: new Date().toISOString(),
          filters,
          totalLogs: auditLogs.length,
          logs: auditLogs,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async cleanupAuditLogs(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const { daysToKeep = 90 } = req.body;

      // Validate daysToKeep
      if (daysToKeep < 30 || daysToKeep > 365) {
        throw new AppError('Days to keep must be between 30 and 365', 'INVALID_DAYS_TO_KEEP', 400);
      }

      const deletedCount = await auditRepository.cleanupOldLogs(orgId, daysToKeep);

      return successResponse(res, {
        deletedCount,
        daysToKeep,
      }, 'Audit logs cleanup completed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
