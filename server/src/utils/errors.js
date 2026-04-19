/**
 * Base class for application errors
 */
export class AppError extends Error {
  constructor(message, code, statusCode, details = []) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when validation fails (Zod, etc.)
 */
export class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Thrown when authentication fails
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * Thrown when a user doesn't have permissions
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * Thrown when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

/**
 * Thrown when there's a resource conflict
 */
export class ConflictError extends AppError {
  constructor(message) {
    super(message, 'CONFLICT', 409);
  }
}

/**
 * Thrown when a usage quota is exceeded (e.g., tokens)
 */
export class QuotaExceededError extends AppError {
  constructor(message = 'Usage quota exceeded') {
    super(message, 'QUOTA_EXCEEDED', 429);
  }
}

/**
 * Thrown when a billing plan limit is exceeded (e.g., max workflows)
 */
export class PlanLimitError extends AppError {
  constructor(message = 'Plan limit reached. Please upgrade.') {
    super(message, 'PLAN_LIMIT_EXCEEDED', 403);
  }
}

/**
 * Thrown when an agent execution fails
 */
export class AgentError extends AppError {
  constructor(message, details = []) {
    super(message, 'AGENT_EXECUTION_FAILED', 500, details);
  }
}

/**
 * Thrown when a rate limit is exceeded
 */
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}
