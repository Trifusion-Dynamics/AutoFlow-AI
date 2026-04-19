import { outboundWebhookService } from './outbound-webhooks.service.js';
import { successResponse, paginatedResponse } from '../../utils/response.util.js';
import { getCursorPaginationMeta, encodeCursor } from '../../utils/pagination.util.js';

export class OutboundWebhookController {
  async listWebhooks(req, res, next) {
    try {
      const orgId = req.user?.orgId || req.apiKeyAuth?.orgId;
      const { limit = '20', cursor } = req.query;

      const result = await outboundWebhookService.listWebhooks(orgId, {
        limit: parseInt(limit, 10) || 20,
        cursor,
      });

      const pagination = getCursorPaginationMeta(result.webhooks, parseInt(limit, 10) || 20, result.total);

      // Mask secrets in list view
      const webhooks = result.webhooks.map(wh => ({
        ...wh,
        secret: wh.secret.substring(0, 10) + '...',
      }));

      return paginatedResponse(res, webhooks, pagination);
    } catch (error) {
      next(error);
    }
  }

  async createWebhook(req, res, next) {
    try {
      const orgId = req.user?.orgId || req.apiKeyAuth?.orgId;
      const webhook = await outboundWebhookService.registerWebhook(orgId, req.validatedBody);

      return successResponse(res, webhook, 201);
    } catch (error) {
      next(error);
    }
  }

  async getWebhook(req, res, next) {
    try {
      const orgId = req.user?.orgId || req.apiKeyAuth?.orgId;
      const webhook = await outboundWebhookService.getWebhook(req.params.id, orgId);

      return successResponse(res, webhook);
    } catch (error) {
      next(error);
    }
  }

  async deleteWebhook(req, res, next) {
    try {
      const orgId = req.user?.orgId || req.apiKeyAuth?.orgId;
      const result = await outboundWebhookService.deleteWebhook(req.params.id, orgId);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async testWebhook(req, res, next) {
    try {
      const orgId = req.user?.orgId || req.apiKeyAuth?.orgId;
      const result = await outboundWebhookService.sendTestEvent(req.params.id, orgId);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async listDeliveries(req, res, next) {
    try {
      const orgId = req.user?.orgId || req.apiKeyAuth?.orgId;
      const { limit = '20', cursor, event, success } = req.query;

      const options = {
        limit: parseInt(limit, 10) || 20,
        cursor,
        event,
        success: success !== undefined ? success === 'true' : undefined,
      };

      const result = await outboundWebhookService.listDeliveries(req.params.id, orgId, options);
      const pagination = getCursorPaginationMeta(result.deliveries, parseInt(limit, 10) || 20, result.total);

      return paginatedResponse(res, result.deliveries, pagination);
    } catch (error) {
      next(error);
    }
  }
}

export const outboundWebhookController = new OutboundWebhookController();
