import { createHash } from 'crypto';
import { logger } from '../utils/logger.util.js';

/**
 * Middleware to set Cache-Control headers and ETag
 * @param {number} maxAge Cache duration in seconds
 * @param {object} options { public: boolean, noStore: boolean }
 */
export const setCacheHeaders = (maxAge = 0, options = {}) => {
  return (req, res, next) => {
    // Only apply to GET requests
    if (req.method !== 'GET') {
      return next();
    }

    if (options.noStore) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      const visibility = options.public ? 'public' : 'private';
      res.setHeader('Cache-Control', `${visibility}, max-age=${maxAge}`);
    }

    // ETag Implementation
    const originalSend = res.send;
    res.send = function (body) {
      if (res.statusCode === 200 && typeof body === 'string' || Buffer.isBuffer(body)) {
        const etag = `W/"${createHash('md5').update(body).digest('hex').substring(0, 16)}"`;
        res.setHeader('ETag', etag);

        if (req.headers['if-none-match'] === etag) {
          logger.debug(`Cache hit (ETag) for ${req.path}`);
          return res.status(304).end();
        }
      }
      return originalSend.apply(res, arguments);
    };

    next();
  };
};
