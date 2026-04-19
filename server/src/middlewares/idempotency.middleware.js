import { redisHelpers, redisClient } from '../config/redis.js';
import { logger } from '../utils/logger.util.js';

const IDEMPOTENCY_TTL = 86400; // 24 hours

/**
 * Idempotency middleware for POST requests.
 * 
 * If the client sends an `Idempotency-Key` header, the middleware will:
 * 1. Check Redis for a cached response matching that key + orgId
 * 2. If found, replay the cached response with `Idempotency-Replayed: true`
 * 3. If not found, intercept the response to cache it for future replays
 * 
 * If no `Idempotency-Key` header is present, the request proceeds normally.
 */
export function idempotencyCheck(req, res, next) {
  // Only apply to POST requests
  if (req.method !== 'POST') {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'];

  // If no key provided, skip
  if (!idempotencyKey) {
    return next();
  }

  // Need orgId from auth — it's set after auth middleware
  const orgId = req.user?.orgId || req.apiKeyAuth?.orgId || 'anonymous';
  const redisKey = `idempotency:${orgId}:${idempotencyKey}`;

  handleIdempotency(req, res, next, redisKey, idempotencyKey);
}

async function handleIdempotency(req, res, next, redisKey, idempotencyKey) {
  try {
    // Check if Redis is available
    if (!redisClient.isReady()) {
      // Skip idempotency if Redis is down — proceed normally
      req.idempotencyKey = idempotencyKey;
      return next();
    }

    // Check if a cached response exists
    const cached = await redisHelpers.get(redisKey);

    if (cached) {
      // Parse cached response
      let cachedResponse;
      try {
        cachedResponse = typeof cached === 'string' ? JSON.parse(cached) : cached;
      } catch {
        cachedResponse = cached;
      }

      logger.info('Idempotency cache hit — replaying response', {
        idempotencyKey,
        redisKey,
      });

      // Set replayed header
      res.set('Idempotency-Replayed', 'true');

      // Replay cached headers
      if (cachedResponse.headers) {
        for (const [key, value] of Object.entries(cachedResponse.headers)) {
          if (key.toLowerCase() !== 'idempotency-replayed') {
            res.set(key, value);
          }
        }
      }

      return res.status(cachedResponse.status || 200).json(cachedResponse.body);
    }

    // No cached response — intercept the response to cache it
    req.idempotencyKey = idempotencyKey;

    // Monkey-patch res.json to capture the response
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      // Store response in Redis (fire and forget)
      const responseToCache = {
        status: res.statusCode,
        body,
        headers: {
          'content-type': res.get('content-type'),
        },
      };

      const cacheValue = JSON.stringify(responseToCache);
      redisHelpers.set(redisKey, cacheValue, IDEMPOTENCY_TTL).catch((err) => {
        logger.error('Failed to cache idempotency response', {
          idempotencyKey,
          error: err.message,
        });
      });

      // Call original json method
      return originalJson(body);
    };

    next();
  } catch (error) {
    logger.error('Idempotency middleware error', {
      idempotencyKey,
      error: error.message,
    });
    // On any error, proceed normally
    next();
  }
}
