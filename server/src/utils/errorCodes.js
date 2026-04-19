/**
 * Centralized error codes for SDK-ready API responses.
 * Each code maps to an HTTP status, default message, and docs URL.
 */

const BASE_DOCS_URL = 'https://docs.autoflow.ai/errors';

export const ERROR_CODES = {
  // Workflow errors
  WORKFLOW_NOT_FOUND: {
    httpStatus: 404,
    message: 'Workflow not found',
    docsUrl: `${BASE_DOCS_URL}/WORKFLOW_NOT_FOUND`,
  },
  WORKFLOW_NOT_ACTIVE: {
    httpStatus: 400,
    message: 'Workflow must be active to perform this action',
    docsUrl: `${BASE_DOCS_URL}/WORKFLOW_NOT_ACTIVE`,
  },

  // Execution errors
  EXECUTION_FAILED: {
    httpStatus: 500,
    message: 'Workflow execution failed',
    docsUrl: `${BASE_DOCS_URL}/EXECUTION_FAILED`,
  },
  EXECUTION_NOT_FOUND: {
    httpStatus: 404,
    message: 'Execution not found',
    docsUrl: `${BASE_DOCS_URL}/EXECUTION_NOT_FOUND`,
  },

  // Quota errors
  QUOTA_EXCEEDED: {
    httpStatus: 429,
    message: 'Token quota exceeded for this billing period',
    docsUrl: `${BASE_DOCS_URL}/QUOTA_EXCEEDED`,
  },

  // Validation errors
  VALIDATION_ERROR: {
    httpStatus: 400,
    message: 'Invalid input data',
    docsUrl: `${BASE_DOCS_URL}/VALIDATION_ERROR`,
  },
  INVALID_CRON_EXPRESSION: {
    httpStatus: 400,
    message: 'Invalid cron expression provided',
    docsUrl: `${BASE_DOCS_URL}/INVALID_CRON_EXPRESSION`,
  },

  // Auth errors
  UNAUTHORIZED: {
    httpStatus: 401,
    message: 'Authentication required',
    docsUrl: `${BASE_DOCS_URL}/UNAUTHORIZED`,
  },
  FORBIDDEN: {
    httpStatus: 403,
    message: 'Insufficient permissions',
    docsUrl: `${BASE_DOCS_URL}/FORBIDDEN`,
  },
  INVALID_TOKEN: {
    httpStatus: 401,
    message: 'Invalid or expired authentication token',
    docsUrl: `${BASE_DOCS_URL}/INVALID_TOKEN`,
  },

  // API Key errors
  API_KEY_EXPIRED: {
    httpStatus: 401,
    message: 'API key has expired',
    docsUrl: `${BASE_DOCS_URL}/API_KEY_EXPIRED`,
  },
  API_KEY_REVOKED: {
    httpStatus: 401,
    message: 'API key has been revoked',
    docsUrl: `${BASE_DOCS_URL}/API_KEY_REVOKED`,
  },

  // Webhook errors
  WEBHOOK_SECRET_INVALID: {
    httpStatus: 401,
    message: 'Invalid webhook signature',
    docsUrl: `${BASE_DOCS_URL}/WEBHOOK_SECRET_INVALID`,
  },
  WEBHOOK_NOT_FOUND: {
    httpStatus: 404,
    message: 'Outbound webhook not found',
    docsUrl: `${BASE_DOCS_URL}/WEBHOOK_NOT_FOUND`,
  },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: {
    httpStatus: 429,
    message: 'Too many requests, please try again later',
    docsUrl: `${BASE_DOCS_URL}/RATE_LIMIT_EXCEEDED`,
  },

  // Idempotency
  IDEMPOTENCY_KEY_REUSED: {
    httpStatus: 409,
    message: 'Idempotency key has already been used with different request parameters',
    docsUrl: `${BASE_DOCS_URL}/IDEMPOTENCY_KEY_REUSED`,
  },

  // Tool errors
  TOOL_EXECUTION_FAILED: {
    httpStatus: 500,
    message: 'External tool execution failed',
    docsUrl: `${BASE_DOCS_URL}/TOOL_EXECUTION_FAILED`,
  },

  // General errors
  INTERNAL_ERROR: {
    httpStatus: 500,
    message: 'Internal server error',
    docsUrl: `${BASE_DOCS_URL}/INTERNAL_ERROR`,
  },
  NOT_FOUND: {
    httpStatus: 404,
    message: 'Resource not found',
    docsUrl: `${BASE_DOCS_URL}/NOT_FOUND`,
  },
  DUPLICATE_ENTRY: {
    httpStatus: 409,
    message: 'A record with this value already exists',
    docsUrl: `${BASE_DOCS_URL}/DUPLICATE_ENTRY`,
  },
  PAYLOAD_TOO_LARGE: {
    httpStatus: 413,
    message: 'Request payload exceeds the allowed size limit',
    docsUrl: `${BASE_DOCS_URL}/PAYLOAD_TOO_LARGE`,
  },
  CORS_NOT_ALLOWED: {
    httpStatus: 403,
    message: 'Origin not allowed by CORS policy',
    docsUrl: `${BASE_DOCS_URL}/CORS_NOT_ALLOWED`,
  },
};

/**
 * Get error info by code string. Falls back to INTERNAL_ERROR if unknown.
 */
export function getErrorInfo(code) {
  return ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;
}
