export const PLAN_LIMITS = {
  free: {
    name: 'free',
    displayName: 'Free Plan',
    workflows: 3,
    executionsPerMonth: 100,
    tokenQuota: 100000,
    teamMembers: 1,
    apiCallsPerMonth: 1000,
    price: 0,
    features: ['basic_nodes', 'community_support']
  },
  starter: {
    name: 'starter',
    displayName: 'Starter Plan',
    workflows: 20,
    executionsPerMonth: 1000,
    tokenQuota: 500000,
    teamMembers: 5,
    apiCallsPerMonth: 10000,
    price: 29,
    features: ['webhooks', 'email_support', 'priority_execution']
  },
  pro: {
    name: 'pro',
    displayName: 'Pro Plan',
    workflows: 100,
    executionsPerMonth: 10000,
    tokenQuota: 2000000,
    teamMembers: 20,
    apiCallsPerMonth: 100000,
    price: 99,
    features: ['unlimited_webhooks', 'advanced_agents', '24/7_support']
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise Plan',
    workflows: -1,
    executionsPerMonth: -1,
    tokenQuota: 10000000,
    teamMembers: -1,
    apiCallsPerMonth: -1,
    price: 499,
    features: ['custom_integrations', 'dedicated_account_manager', 'on_premise_options']
  }
};

export const PLANS = Object.keys(PLAN_LIMITS);
