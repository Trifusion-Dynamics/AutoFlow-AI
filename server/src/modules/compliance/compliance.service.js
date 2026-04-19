import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/errors.js';

export class ComplianceService {
  async getPrivacySettings(orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { settings: true }
    });
    
    const settings = org.settings || {};
    return {
      retentionDays: settings.retentionDays || 90,
      analyticsOptIn: settings.analyticsOptIn !== false,
      marketingEmails: settings.marketingEmails !== false,
      dataSharing: settings.dataSharing || false
    };
  }

  async updatePrivacySettings(orgId, settings) {
    const currentOrg = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    const updatedSettings = {
      ...currentOrg.settings,
      ...settings
    };

    return prisma.organization.update({
      where: { id: orgId },
      data: { settings: updatedSettings }
    });
  }

  async getDataSummary(orgId) {
    // Return summary of what data is held
    const userCount = await prisma.user.count({ where: { orgId } });
    const workflowCount = await prisma.workflow.count({ where: { orgId } });
    const executionCount = await prisma.execution.count({ where: { orgId } });

    return {
      orgId,
      storedEntities: {
        users: userCount,
        workflows: workflowCount,
        executions: executionCount
      },
      retentionPolicy: "90 days for executions, 1 year for audit logs",
      processingPurposes: [
        "Workflow execution and automation",
        "System monitoring and debugging",
        "Analytics for performance optimization"
      ]
    };
  }

  async recordConsent(orgId, userId, consentType, granted, ipAddress) {
    return prisma.consentRecord.create({
      data: {
        orgId,
        userId,
        consentType,
        granted,
        ipAddress
      }
    });
  }
}

export const complianceService = new ComplianceService();
