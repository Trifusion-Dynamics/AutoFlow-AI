import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { outboundWebhookRepository } from './outbound-webhooks.repository.js';
import { logger } from '../../utils/logger.util.js';
import { AppError } from '../../utils/errors.js';

// Retry intervals in milliseconds
const RETRY_INTERVALS = [
  1 * 60 * 1000,      // 1 minute
  5 * 60 * 1000,      // 5 minutes
  30 * 60 * 1000,     // 30 minutes
  2 * 60 * 60 * 1000, // 2 hours
  8 * 60 * 60 * 1000, // 8 hours
];

const MAX_FAILURES = 10;
const DELIVERY_TIMEOUT = 10000; // 10 seconds

export class OutboundWebhookService {

  /**
   * Register a new outbound webhook.
   * The signing secret is generated and returned only once (like API keys).
   */
  async registerWebhook(orgId, data) {
    // Generate HMAC signing secret
    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;

    const webhook = await outboundWebhookRepository.create({
      orgId,
      name: data.name,
      url: data.url,
      secret,
      events: data.events,
    });

    logger.info('Outbound webhook registered', {
      webhookId: webhook.id,
      orgId,
      events: data.events,
    });

    // Return with secret visible (only this one time)
    return {
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      secret, // Only returned on creation
      events: webhook.events,
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
    };
  }

  /**
   * List all outbound webhooks for an org.
   */
  async listWebhooks(orgId, options = {}) {
    return outboundWebhookRepository.findByOrgId(orgId, options);
  }

  /**
   * Get a single webhook (without secret).
   */
  async getWebhook(id, orgId) {
    const webhook = await outboundWebhookRepository.findById(id, orgId);
    if (!webhook) {
      throw new AppError('Outbound webhook not found', 'WEBHOOK_NOT_FOUND', 404);
    }

    // Don't expose full secret — show prefix only
    return {
      ...webhook,
      secret: webhook.secret.substring(0, 10) + '...',
    };
  }

  /**
   * Delete an outbound webhook.
   */
  async deleteWebhook(id, orgId) {
    const webhook = await outboundWebhookRepository.findById(id, orgId);
    if (!webhook) {
      throw new AppError('Outbound webhook not found', 'WEBHOOK_NOT_FOUND', 404);
    }

    await outboundWebhookRepository.delete(id, orgId);

    logger.info('Outbound webhook deleted', { webhookId: id, orgId });

    return { deleted: true };
  }

  /**
   * Send a test event to a webhook.
   */
  async sendTestEvent(id, orgId) {
    const webhook = await outboundWebhookRepository.findById(id, orgId);
    if (!webhook) {
      throw new AppError('Outbound webhook not found', 'WEBHOOK_NOT_FOUND', 404);
    }

    const testPayload = {
      test: true,
      message: 'This is a test delivery from AutoFlow AI',
      timestamp: new Date().toISOString(),
    };

    const result = await this.deliverWebhook(webhook, 'test.ping', testPayload);

    return {
      success: result.success,
      statusCode: result.statusCode,
      duration: result.duration,
    };
  }

  /**
   * List delivery history for a webhook.
   */
  async listDeliveries(webhookId, orgId, options = {}) {
    // Verify ownership
    const webhook = await outboundWebhookRepository.findById(webhookId, orgId);
    if (!webhook) {
      throw new AppError('Outbound webhook not found', 'WEBHOOK_NOT_FOUND', 404);
    }

    return outboundWebhookRepository.findDeliveriesByWebhookId(webhookId, options);
  }

  /**
   * Deliver a webhook event to the registered URL.
   * Signs the payload with HMAC-SHA256 and records the delivery.
   */
  async deliverWebhook(webhook, event, payload) {
    const deliveryId = uuidv4();
    const startTime = Date.now();

    const deliveryPayload = {
      id: deliveryId,
      event,
      createdAt: new Date().toISOString(),
      data: payload,
    };

    // Sign payload
    const bodyString = JSON.stringify(deliveryPayload);
    const signature = this.createSignature(webhook.secret, bodyString);

    let statusCode = null;
    let responseBody = null;
    let success = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AutoFlow-Webhooks/1.0',
          'AutoFlow-Signature': `sha256=${signature}`,
          'AutoFlow-Event': event,
          'AutoFlow-Delivery': deliveryId,
        },
        body: bodyString,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      statusCode = response.status;

      try {
        responseBody = await response.text();
        if (responseBody.length > 1024) {
          responseBody = responseBody.substring(0, 1024) + '...(truncated)';
        }
      } catch {
        responseBody = null;
      }

      success = statusCode >= 200 && statusCode < 300;
    } catch (error) {
      statusCode = 0;
      responseBody = error.message;
      success = false;
    }

    const duration = Date.now() - startTime;

    // Save delivery record
    const delivery = await outboundWebhookRepository.createDelivery({
      webhookId: webhook.id,
      event,
      payload: deliveryPayload,
      statusCode,
      responseBody,
      duration,
      success,
      attemptCount: 1,
    });

    // Update webhook metadata
    await outboundWebhookRepository.update(webhook.id, webhook.orgId, {
      lastCalledAt: new Date(),
      lastStatusCode: statusCode,
    });

    // Handle failure
    if (!success) {
      await outboundWebhookRepository.incrementFailure(webhook.id);

      // Check if we should disable the webhook
      const updatedWebhook = await outboundWebhookRepository.findById(webhook.id, webhook.orgId);
      if (updatedWebhook && updatedWebhook.failureCount >= MAX_FAILURES) {
        await outboundWebhookRepository.disable(webhook.id);
        logger.warn('Outbound webhook disabled due to excessive failures', {
          webhookId: webhook.id,
          failureCount: updatedWebhook.failureCount,
        });
      } else {
        // Schedule retry
        const retryIndex = Math.min(
          (updatedWebhook?.failureCount || 1) - 1,
          RETRY_INTERVALS.length - 1
        );
        const nextRetryAt = new Date(Date.now() + RETRY_INTERVALS[retryIndex]);

        await outboundWebhookRepository.updateDelivery(delivery.id, {
          nextRetryAt,
        });

        logger.info('Webhook delivery failed, retry scheduled', {
          webhookId: webhook.id,
          deliveryId: delivery.id,
          nextRetryAt,
          attempt: updatedWebhook?.failureCount || 1,
        });
      }
    } else {
      // Reset failure count on success
      if (webhook.failureCount > 0) {
        await outboundWebhookRepository.resetFailure(webhook.id);
      }
    }

    logger.info('Webhook delivered', {
      webhookId: webhook.id,
      deliveryId: delivery.id,
      event,
      success,
      statusCode,
      duration,
    });

    return { success, statusCode, duration, deliveryId };
  }

  /**
   * Dispatch an event to all subscribed webhooks for an org.
   * All deliveries are fired async (non-blocking).
   */
  async dispatchEvent(orgId, event, data) {
    try {
      // Find all active webhooks subscribed to this event
      let webhooks;
      try {
        webhooks = await outboundWebhookRepository.findActiveByOrgAndEvent(orgId, event);
      } catch {
        // Fallback for databases that don't support array_contains
        webhooks = await outboundWebhookRepository.findActiveByOrgAndEventFallback(orgId, event);
      }

      if (!webhooks || webhooks.length === 0) {
        return;
      }

      logger.info('Dispatching outbound webhook event', {
        orgId,
        event,
        webhookCount: webhooks.length,
      });

      // Fire all deliveries async — NEVER await (non-blocking)
      for (const webhook of webhooks) {
        this.deliverWebhook(webhook, event, data).catch(err => {
          logger.error('Outbound webhook delivery error', {
            webhookId: webhook.id,
            event,
            error: err.message,
          });
        });
      }
    } catch (error) {
      logger.error('Failed to dispatch outbound webhook event', {
        orgId,
        event,
        error: error.message,
      });
    }
  }

  /**
   * Create HMAC-SHA256 signature for payload verification.
   * 
   * Developers can verify webhook authenticity using this algorithm:
   * 
   * ```javascript
   * const crypto = require('crypto');
   * 
   * function verifyWebhookSignature(secret, payload, signatureHeader) {
   *   const expectedSignature = crypto
   *     .createHmac('sha256', secret)
   *     .update(payload)
   *     .digest('hex');
   *   
   *   const providedSignature = signatureHeader.replace('sha256=', '');
   *   return crypto.timingSafeEqual(
   *     Buffer.from(expectedSignature),
   *     Buffer.from(providedSignature)
   *   );
   * }
   * 
   * // Usage in Express:
   * app.post('/my-webhook', (req, res) => {
   *   const signature = req.headers['autoflow-signature'];
   *   const rawBody = JSON.stringify(req.body);
   *   
   *   if (!verifyWebhookSignature(process.env.WEBHOOK_SECRET, rawBody, signature)) {
   *     return res.status(401).json({ error: 'Invalid signature' });
   *   }
   *   // Process webhook event...
   * });
   * ```
   */
  createSignature(secret, payload) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify a webhook signature (exported for SDK use).
   */
  static verifyWebhookSignature(secret, payload, signatureHeader) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
      .digest('hex');

    const providedSignature = signatureHeader.replace('sha256=', '');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(providedSignature)
      );
    } catch {
      return false;
    }
  }
}

export const outboundWebhookService = new OutboundWebhookService();
