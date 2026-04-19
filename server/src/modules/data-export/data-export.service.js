import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.util.js';
import { v4 as uuidv4 } from 'uuid';

export class DataExportService {
  async requestExport(orgId, userId, format = 'json') {
    const job = await prisma.dataExportJob.create({
      data: {
        orgId,
        requestedBy: userId,
        status: 'processing',
        format
      }
    });

    // In a real app, this would trigger a BullMQ job
    // For now, we return that it's processing
    logger.info(`Data export requested for org ${orgId} by user ${userId}`);
    
    return { 
      jobId: job.id, 
      status: 'processing',
      message: 'Your export is being generated and will be ready shortly.'
    };
  }

  async getExportStatus(jobId, orgId) {
    const job = await prisma.dataExportJob.findUnique({
      where: { id: jobId }
    });

    if (!job || job.orgId !== orgId) {
      throw new AppError('Export job not found', 'EXPORT_NOT_FOUND', 404);
    }

    return job;
  }

  async deleteOrgData(orgId, userId, confirmation) {
    if (confirmation !== "DELETE MY DATA") {
      throw new AppError('Invalid confirmation phrase', 'INVALID_CONFIRMATION', 400);
    }

    // GDPR Right to Erasure: 30-day grace period
    const org = await prisma.organization.update({
      where: { id: orgId },
      data: { 
        isActive: false,
        settings: {
          deleteRequestedAt: new Date(),
          deleteRequestedBy: userId
        }
      }
    });

    // Anonymize users
    await prisma.user.updateMany({
      where: { orgId },
      data: {
        name: 'Deleted User',
        email: `deleted_${uuidv4()}@deleted.autoflow.ai`
      }
    });

    // Revoke all API keys
    await prisma.apiKey.updateMany({
      where: { orgId },
      data: { isActive: false }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'org.deletion_requested',
        resourceType: 'organization',
        resourceId: orgId
      }
    });

    logger.warn(`Organization ${orgId} data deletion requested by ${userId}`);

    return { 
      success: true, 
      message: 'Your organization has been deactivated. Data will be permanently deleted after 30 days.' 
    };
  }
}

export const dataExportService = new DataExportService();
