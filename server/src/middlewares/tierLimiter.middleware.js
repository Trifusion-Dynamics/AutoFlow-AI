import { redisClient } from '../config/redis.js';
import { PLAN_LIMITS, REDIS_KEYS } from '../config/constants.js';
import { errorResponse } from '../utils/response.util.js';
import { logger } from '../utils/logger.util.js';

/**
 * Dynamic Rate Limiter based on Organization Tier
 */
export async function tierRateLimiter(req, res, next) {
  try {
    // 1. Resolve Organization Info
    const org = req.user?.org || req.apiKeyAuth?.org;
    
    if (!org) {
      // Should be caught by auth middleware, but safety first
      return next();
    }

    const orgId = org.id;
    const plan = org.plan || 'free';
    const limitCfg = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // 2. Redis-based Sliding Window
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const key = REDIS_KEYS.RATE_LIMIT(orgId);

    // Pipeline basic operations
    const multi = redisClient.getClient().multi();
    
    // Remove timestamps older than the window
    multi.zRemRangeByScore(key, 0, now - windowMs);
    // Count current requests
    multi.zCard(key);
    // Add current timestamp
    multi.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
    // Set expiry
    multi.expire(key, 65); // Just over 1 minute

    const results = await multi.exec();
    const currentUsage = results[1];

    // 3. Set Headers
    res.setHeader('X-RateLimit-Limit', limitCfg.rpm);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limitCfg.rpm - currentUsage));
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

    // 4. Enforce Limit
    if (currentUsage >= limitCfg.rpm) {
      logger.warn(`Rate limit exceeded for org: ${orgId}`, {
        plan,
        limit: limitCfg.rpm,
        usage: currentUsage,
      });

      return errorResponse(
        res,
        'RATE_LIMIT_EXCEEDED',
        `You have exceeded the rate limit for your ${plan} plan (${limitCfg.rpm} RPM).`,
        429,
        [{ retryAfter: '60s' }]
      );
    }

    next();
  } catch (error) {
    logger.error('Tier rate limiter error:', error);
    // Fail open in case of Redis failure to not block production traffic
    next();
  }
}
