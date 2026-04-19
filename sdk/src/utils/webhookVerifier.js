import crypto from 'crypto';

export class WebhookVerifier {
  /**
   * Verify an incoming webhook signature
   * @param {string} secret - The webhook secret
   * @param {string|Object} payload - The raw request body
   * @param {string} signature - The signature from X-AutoFlow-Signature header
   */
  static verify(secret, payload, signature) {
    if (!secret || !payload || !signature) return false;

    const rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (e) {
      return false;
    }
  }
}
