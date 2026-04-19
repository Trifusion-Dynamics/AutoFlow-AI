export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

export const WORKFLOW_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
};

export const EXECUTION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
};

export const TRIGGER_TYPES = {
  WEBHOOK: 'webhook',
  CRON: 'cron',
  MANUAL: 'manual',
};

export const PLAN_TYPES = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
};

export const TOKEN_QUOTAS = {
  free: 100000,
  starter: 500000,
  pro: 2000000,
  enterprise: 10000000,
};

export const MAX_AGENT_ITERATIONS = 10;
export const DEFAULT_TIMEOUT_SECONDS = 300;

// API Versioning
export const API_VERSION = 'v1';
export const API_PREFIX = '/api/v1';

// Idempotency
export const IDEMPOTENCY_TTL = 86400; // 24 hours in seconds

// Outbound webhook events
export const OUTBOUND_WEBHOOK_EVENTS = [
  'execution.completed',
  'execution.failed',
  'execution.started',
  'workflow.activated',
  'workflow.paused',
  'quota.warning',
  'quota.exceeded',
];

export const CACHE_TTL = {
  ORG: 300, // 5 minutes
  WORKFLOW: 120, // 2 minutes
  USER: 180, // 3 minutes
  EXECUTION_STATUS: 30, // 30 seconds
};

export const REDIS_KEYS = {
  TOKEN_BLACKLIST: (jti) => `token_blacklist:${jti}`,
  PWD_RESET: (hash) => `pwd_reset:${hash}`,
  RATE_LIMIT: (id) => `rate_limit:${id}`,
  ORG_CACHE: (orgId) => `org:${orgId}`,
  WORKFLOW_CACHE: (id) => `workflow:${id}`,
  USER_CACHE: (userId) => `user:${userId}`,
  ORG_TOKENS: (orgId, month) => `org:${orgId}:tokens:${month}`,
  EXECUTION_STATUS: (execId) => `execution:${execId}:status`,
  IDEMPOTENCY: (orgId, key) => `idempotency:${orgId}:${key}`,
};

// Phase 5: API Scopes
export const API_SCOPES = {
  WORKFLOWS_READ: 'workflows:read',
  WORKFLOWS_WRITE: 'workflows:write',
  WORKFLOWS_RUN: 'workflows:run',
  EXECUTIONS_READ: 'executions:read',
  WEBHOOKS_MANAGE: 'webhooks:manage',
  USAGE_READ: 'usage:read',
  API_KEYS_MANAGE: 'api_keys:manage',
};

// Phase 5: Tiered Rate Limits (Requests Per Minute)
export const PLAN_LIMITS = {
  free: {
    rpm: 60,
    burst: 10,
    concurrency: 2,
  },
  starter: {
    rpm: 300,
    burst: 50,
    concurrency: 5,
  },
  pro: {
    rpm: 1000,
    burst: 100,
    concurrency: 20,
  },
  enterprise: {
    rpm: 5000,
    burst: 500,
    concurrency: 100,
  },
};

