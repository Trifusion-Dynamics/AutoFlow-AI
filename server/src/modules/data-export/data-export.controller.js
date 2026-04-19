import { dataExportService } from './data-export.service.js';
import { successResponse } from '../../utils/response.util.js';

export class DataExportController {
  async request(req, res) {
    const { format } = req.body;
    const result = await dataExportService.requestExport(
      req.user.orgId,
      req.user.id,
      format
    );
    return successResponse(res, result, 'Data export requested');
  }

  async getStatus(req, res) {
    const status = await dataExportService.getExportStatus(
      req.params.id,
      req.user.orgId
    );
    return successResponse(res, status, 'Export status retrieved');
  }

  async deleteAccount(req, res) {
    const { confirmation } = req.body;
    const result = await dataExportService.deleteOrgData(
      req.user.orgId,
      req.user.id,
      confirmation
    );
    return successResponse(res, result, 'Account deletion initiated');
  }
}

export const dataExportController = new DataExportController();
