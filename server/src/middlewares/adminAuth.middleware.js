import { ForbiddenError, AuthenticationError } from '../utils/errors.js';
import { env } from '../config/env.js';

/**
 * Middleware to restrict access to system administrators only.
 * Checks both the user's isSystemAdmin flag and an optional ADMIN_SECRET header for additional security.
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // 1. Ensure user is authenticated (via previous authenticate middleware)
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // 2. Check isSystemAdmin flag from DB (should be on req.user)
    if (!req.user.isSystemAdmin) {
      throw new ForbiddenError('System administrator access required');
    }

    // 3. Optional: Check for ADMIN_SECRET header
    const adminSecret = req.headers['x-admin-secret'];
    if (env.ADMIN_SECRET && adminSecret !== env.ADMIN_SECRET) {
      throw new ForbiddenError('Invalid admin secret');
    }

    next();
  } catch (error) {
    next(error);
  }
};
