import { errorResponse } from '../utils/response.util.js';

/**
 * Per-endpoint request body size limits.
 * Returns 413 if the Content-Length exceeds the allowed size.
 */

const SIZE_LIMITS = {
  default: 1 * 1024 * 1024,       // 1MB
  fileUpload: 10 * 1024 * 1024,   // 10MB
  webhookReceiver: 5 * 1024 * 1024, // 5MB
};

/**
 * Create a request size limiter middleware for a specific limit.
 * @param {'default'|'fileUpload'|'webhookReceiver'} limitType
 */
export function requestSizeLimit(limitType = 'default') {
  const maxBytes = SIZE_LIMITS[limitType] || SIZE_LIMITS.default;

  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > maxBytes) {
      const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);
      return errorResponse(
        res,
        'PAYLOAD_TOO_LARGE',
        `Request body exceeds maximum allowed size of ${maxMB}MB`,
        413,
      );
    }

    next();
  };
}

export { SIZE_LIMITS };
