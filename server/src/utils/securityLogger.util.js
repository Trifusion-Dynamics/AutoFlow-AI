import { logger } from './logger.util.js';
import { redisHelpers } from '../config/redis.js';

/**
 * Enhanced Security Logger & Intrusion Monitoring
 */
export const securityLogger = {
  /**
   * Log a security event with high visibility
   */
  log: async (event, details) => {
    const { ip, userId, orgId, severity = 'MEDIUM' } = details;
    
    // 1. Structured log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      ip,
      userId,
      orgId,
      severity,
      ...details
    };

    if (severity === 'CRITICAL' || severity === 'HIGH') {
      logger.error(`🚨 SECURITY ALERT: ${event}`, logEntry);
    } else {
      logger.warn(`🛡️ Security Event: ${event}`, logEntry);
    }

    // 2. IP-based event tracking for rate limiting/blocking
    if (ip) {
      const key = `sec_events:${ip}`;
      const count = await redisHelpers.incr(key);
      if (count === 1) {
        await redisHelpers.expire(key, 3600); // 1 hour window
      }

      // 3. Automated IP blocking if threshold exceeded
      if (count > 20) {
        await securityLogger.blockIp(ip, 3600, 'Threshold of suspicious activities exceeded');
      }
    }
  },

  /**
   * Temporarily block an IP address
   */
  blockIp: async (ip, durationSeconds = 3600, reason = 'Automated block') => {
    const key = `ip_blocklist:${ip}`;
    await redisHelpers.set(key, JSON.stringify({ reason, blockedAt: new Date().toISOString() }), durationSeconds);
    logger.error(`🚫 IP BLOCKED: ${ip}`, { reason, durationSeconds });
  },

  /**
   * Check if IP is blocked
   */
  isIpBlocked: async (ip) => {
    const key = `ip_blocklist:${ip}`;
    const blocked = await redisHelpers.get(key);
    return !!blocked;
  }
};
