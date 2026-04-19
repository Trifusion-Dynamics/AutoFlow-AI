/**
 * Utility to sanitize and transform database objects for API responses
 */

export const transformUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

export const transformWorkflow = (workflow) => {
  if (!workflow) return null;
  const transformed = { ...workflow };
  
  // Mask webhook secret
  if (transformed.webhookSecret) {
    const secret = transformed.webhookSecret;
    transformed.webhookSecret = `****${secret.slice(-4)}`;
  } else if (transformed.triggerConfig?.webhookSecret) {
    const secret = transformed.triggerConfig.webhookSecret;
    transformed.triggerConfig = {
      ...transformed.triggerConfig,
      webhookSecret: `****${secret.slice(-4)}`
    };
  }

  return transformed;
};

export const transformExecution = (execution) => {
  if (!execution) return null;
  const { internalId, ...safeExecution } = execution; // Example internal field
  return safeExecution;
};

export const transformOrg = (org) => {
  if (!org) return null;
  const { tokenUsed, ...safeOrg } = org; // Can hide specific internal counters if needed
  return safeOrg;
};

export const responseTransformer = {
  user: transformUser,
  workflow: transformWorkflow,
  execution: transformExecution,
  org: transformOrg
};
