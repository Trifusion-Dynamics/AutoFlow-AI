import { complianceService } from './compliance.service.js';
import { successResponse } from '../../utils/response.util.js';

export class ComplianceController {
  async getPrivacySettings(req, res) {
    const settings = await complianceService.getPrivacySettings(req.user.orgId);
    return successResponse(res, settings, 'Privacy settings retrieved');
  }

  async updatePrivacySettings(req, res) {
    const settings = await complianceService.updatePrivacySettings(req.user.orgId, req.body);
    return successResponse(res, settings, 'Privacy settings updated');
  }

  async getDataSummary(req, res) {
    const summary = await complianceService.getDataSummary(req.user.orgId);
    return successResponse(res, summary, 'Data processing summary retrieved');
  }

  async recordConsent(req, res) {
    const { consentType, granted } = req.body;
    const result = await complianceService.recordConsent(
      req.user.orgId,
      req.user.id,
      consentType,
      granted,
      req.ip
    );
    return successResponse(res, result, 'Consent record saved');
  }
}

export const complianceController = new ComplianceController();
