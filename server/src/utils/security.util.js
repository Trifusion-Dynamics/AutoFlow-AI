import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Sensitive data masking patterns for strings
 */
const SENSITIVE_STR_PATTERNS = [
  /(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24}/g, // Stripe
  /AKIA[0-9A-Z]{16}/g,                       // AWS
  /eyJ[a-zA-Z0-9._-]{10,}/g,                  // JWT
];

/**
 * Security Utilities
 */
export const securityUtil = {
  /**
   * Mask sensitive data in any input (string, object, array)
   */
  maskSecrets: (input) => {
    if (input === null || input === undefined) return input;

    if (typeof input === 'string') {
      let masked = input;
      SENSITIVE_STR_PATTERNS.forEach(pattern => {
        masked = masked.replace(pattern, (match) => {
          const prefix = match.substring(0, 4);
          const suffix = match.substring(match.length - 4);
          return `${prefix}********${suffix}`;
        });
      });
      return masked;
    }

    if (Array.isArray(input)) {
      return input.map(item => securityUtil.maskSecrets(item));
    }

    if (typeof input === 'object') {
      const maskedObj = {};
      const secretKeys = ['password', 'secret', 'token', 'apiKey', 'key', 'auth', 'hash'];
      
      for (const [key, value] of Object.entries(input)) {
        if (secretKeys.some(k => key.toLowerCase().includes(k))) {
          maskedObj[key] = '********';
        } else {
          maskedObj[key] = securityUtil.maskSecrets(value);
        }
      }
      return maskedObj;
    }

    return input;
  },

  /**
   * Consistent token generation with prefix
   */
  generateSecureToken: (prefix = 'af', bytes = 32) => {
    const random = crypto.randomBytes(bytes).toString('hex');
    return `${prefix}_${random}`;
  },

  /**
   * Verify HMAC signature for webhooks
   */
  validateWebhookSignature: (secret, payload, signature) => {
    if (!secret || !payload || !signature) return false;
    
    const hmac = crypto.createHmac('sha256', secret);
    const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = hmac.update(bodyString).digest('hex');
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (e) {
      return false;
    }
  },

  /**
   * Check if an IP is from internal/private range
   */
  isInternalIP: (ip) => {
    if (!ip) return false;
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    
    // 10.0.0.0/8
    if (p1 === 10) return true;
    // 172.16.0.0/12
    if (p1 === 172 && (p2 >= 16 && p2 <= 31)) return true;
    // 192.168.0.0/16
    if (p1 === 192 && p2 === 168) return true;
    // 127.0.0.1
    if (ip === '127.0.0.1' || ip === '::1') return true;
    
    return false;
  },

  /**
   * Consistent hashing for storage (e.g. API key hashes)
   */
  hashForStorage: (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
};

/**
 * Backward compatibility export
 */
export const maskSecrets = securityUtil.maskSecrets;
