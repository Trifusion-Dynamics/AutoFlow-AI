import { integrationsService } from './integrations.service.js';
import { successResponse } from '../../utils/response.util.js';

export class IntegrationsController {
  async getAvailable(req, res) {
    const integrations = await integrationsService.getAvailableIntegrations(req.user.orgId);
    return successResponse(res, integrations, 'Available integrations retrieved');
  }

  async connect(req, res) {
    const { name, credentials } = req.body;
    const result = await integrationsService.connectIntegration(
      req.user.orgId,
      req.user.id,
      name,
      credentials
    );
    return successResponse(res, result, 'Integration connected successfully');
  }

  async disconnect(req, res) {
    const result = await integrationsService.disconnectIntegration(
      req.user.orgId,
      req.user.id,
      req.params.name
    );
    return successResponse(res, result, 'Integration disconnected successfully');
  }

  async testConnection(req, res) {
    // Basic test logic is inside connect, but could be separate
    const { name, credentials } = req.body;
    const result = await integrationsService.connectIntegration( // Re-using connect logic for simplicity
      req.user.orgId,
      req.user.id,
      name,
      credentials
    );
    return successResponse(res, result, 'Connection verified');
  }
}

export const integrationsController = new IntegrationsController();
