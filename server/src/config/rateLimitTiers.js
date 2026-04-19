/**
 * API Rate Limit Tiers configuration
 * Defined per plan: free, starter, pro, enterprise
 * windowMs: 1 minute (60000)
 */
export const RATE_LIMIT_TIERS = {
  free: {
    api: { windowMs: 60000, max: 60 },
    workflows: { windowMs: 60000, max: 10 },
    executions: { windowMs: 60000, max: 5 },
    webhooks: { windowMs: 60000, max: 20 }
  },
  starter: {
    api: { windowMs: 60000, max: 200 },
    workflows: { windowMs: 60000, max: 30 },
    executions: { windowMs: 60000, max: 20 },
    webhooks: { windowMs: 60000, max: 100 }
  },
  pro: {
    api: { windowMs: 60000, max: 1000 },
    workflows: { windowMs: 60000, max: 100 },
    executions: { windowMs: 60000, max: 100 },
    webhooks: { windowMs: 60000, max: 500 }
  },
  enterprise: {
    api: { windowMs: 60000, max: 10000 },
    workflows: { windowMs: 60000, max: -1 }, // Unlimited
    executions: { windowMs: 60000, max: -1 },
    webhooks: { windowMs: 60000, max: -1 }
  }
};
