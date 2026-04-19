import { redisHelpers } from '../config/redis.js';
import { logger } from '../utils/logger.util.js';
import { errorTracker } from '../utils/errorTracker.util.js';

/**
 * Global Error Rate Monitoring Middleware
 * Tracks total requests vs errors in a rolling 1-minute window
 */
export async function monitorErrorRate(req, res, next) {
  const windowKey = `err_monitor:${Math.floor(Date.now() / 60000)}`;
  
  // Track total requests
  await redisHelpers.incr(`${windowKey}:total`);
  await redisHelpers.expire(`${windowKey}:total`, 120);

  // Capture errors on response finish
  res.on('finish', async () => {
    if (res.statusCode >= 500) {
      const errorCount = await redisHelpers.incr(`${windowKey}:errors`);
      await redisHelpers.expire(`${windowKey}:errors`, 120);

      const totalReqs = parseInt(await redisHelpers.get(`${windowKey}:total`) || '1');
      const errorRate = (errorCount / totalReqs) * 100;

      if (errorRate > 10) {
        logger.warn(`⚠️ HIGH ERROR RATE: ${errorRate.toFixed(2)}% in current minute`, {
          errors: errorCount,
          total: totalReqs
        });
      }

      if (errorRate > 25) {
        logger.error(`🚨 CRITICAL ERROR RATE: ${errorRate.toFixed(2)}% - System instability detected`);
        // We could trigger a global circuit breaker here if needed
      }
    }
  });

  next();
}

/**
 * Error Handler integration for aggregation
 */
export function handleErrorAggregation(err, req, res, next) {
  // Pass to tracker for aggregation
  errorTracker.track(err, {
    path: req.path,
    method: req.method,
    orgId: req.orgId,
    userId: req.user?.id
  });
  
  next(err);
}
