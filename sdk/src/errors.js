export class AutoFlowError extends Error {
  constructor(message, status, code, data) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export class AuthenticationError extends AutoFlowError {}
export class ValidationError extends AutoFlowError {}
export class QuotaExceededError extends AutoFlowError {}
export class NotFoundError extends AutoFlowError {}
export class RateLimitError extends AutoFlowError {}
