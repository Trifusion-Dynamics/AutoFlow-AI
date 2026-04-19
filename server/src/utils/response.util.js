import { getErrorInfo } from './errorCodes.js';
import { API_VERSION } from '../config/constants.js';

/**
 * Build rate-limit meta from response headers (if set by express-rate-limit).
 */
function getRateLimitMeta(res) {
  const limit = res.get('RateLimit-Limit') || res.get('X-RateLimit-Limit');
  const remaining = res.get('RateLimit-Remaining') || res.get('X-RateLimit-Remaining');
  const reset = res.get('RateLimit-Reset') || res.get('X-RateLimit-Reset');

  if (limit) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10) || 0,
      reset: parseInt(reset, 10) || 0,
    };
  }
  return undefined;
}

/**
 * Build standard meta object for every response.
 */
function buildMeta(res) {
  const meta = {
    requestId: res.locals.requestId || null,
    timestamp: new Date().toISOString(),
    version: API_VERSION,
  };

  const rateLimit = getRateLimitMeta(res);
  if (rateLimit) {
    meta.rateLimit = rateLimit;
  }

  return meta;
}

/**
 * Send a success response with SDK-ready structure.
 */
export function successResponse(res, data, statusCode = 200, meta = {}) {
  const response = {
    success: true,
    data,
    meta: {
      ...buildMeta(res),
      ...meta,
    },
  };

  return res.status(statusCode).json(response);
}

/**
 * Send an error response with SDK-ready structure.
 * Uses error code registry for docs URL.
 */
export function errorResponse(res, code, message, statusCode = 500, details = []) {
  const errorInfo = getErrorInfo(code);

  const response = {
    success: false,
    error: {
      code,
      message: message || errorInfo.message,
      details,
      docs: errorInfo.docsUrl,
    },
    meta: buildMeta(res),
  };

  return res.status(statusCode || errorInfo.httpStatus).json(response);
}

/**
 * Send a paginated response with SDK-ready structure.
 * Supports both offset and cursor pagination.
 */
export function paginatedResponse(res, data, pagination, statusCode = 200) {
  const response = {
    success: true,
    data,
    pagination,
    meta: buildMeta(res),
  };

  return res.status(statusCode).json(response);
}
