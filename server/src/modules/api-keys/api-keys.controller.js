import { apiKeyService } from './api-keys.service.js';
import { successResponse } from '../../utils/response.util.js';
import { AppError } from '../../utils/errors.js';

export class ApiKeyController {
  async generateApiKey(req, res, next) {
    try {
      const { name, permissions, expiresAt } = req.body;
      const orgId = req.user.orgId;
      const userId = req.user.id;

      const apiKey = await apiKeyService.generateApiKey(orgId, userId, {
        name,
        permissions,
        expiresAt,
      });

      return successResponse(res, apiKey, 'API key generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async listApiKeys(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        permission: req.query.permission,
      };

      const result = await apiKeyService.listApiKeys(orgId, options);

      return successResponse(res, result, 'API keys retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getApiKey(req, res, next) {
    try {
      const { id } = req.params;
      const orgId = req.user.orgId;

      const apiKey = await apiKeyService.getApiKey(id, orgId);

      return successResponse(res, apiKey, 'API key retrieved successfully');
    } catch (error) {
      if (error.message === 'API key not found') {
        return next(new AppError('API key not found', 'API_KEY_NOT_FOUND', 404));
      }
      next(error);
    }
  }

  async revokeApiKey(req, res, next) {
    try {
      const { id } = req.params;
      const orgId = req.user.orgId;
      const userId = req.user.id;

      const apiKey = await apiKeyService.revokeApiKey(id, orgId, userId);

      return successResponse(res, apiKey, 'API key revoked successfully');
    } catch (error) {
      if (error.message === 'API key not found') {
        return next(new AppError('API key not found', 'API_KEY_NOT_FOUND', 404));
      }
      next(error);
    }
  }

  async getApiKeyStats(req, res, next) {
    try {
      const orgId = req.user.orgId;

      const stats = await apiKeyService.getApiKeyStats(orgId);

      return successResponse(res, stats, 'API key stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const apiKeyController = new ApiKeyController();
