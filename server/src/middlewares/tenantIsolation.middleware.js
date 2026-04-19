import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.util.js';

/**
 * Middleware for strict tenant isolation.
 * Automatically scopes all Prisma findMany and findFirst queries to the current orgId.
 */
export async function tenantIsolation(req, res, next) {
  try {
    // 1. Extract orgId from user or apiKeyAuth
    const orgId = req.user?.orgId || req.apiKeyAuth?.orgId;

    if (!orgId) {
      // If no orgId is found on an authenticated route, something is wrong
      logger.error('No orgId found in authenticated request', { 
        path: req.path,
        user: req.user?.id,
        apiKey: req.apiKeyAuth?.keyPrefix
      });
      // We don't block here as some routes might be truly global, 
      // but we log a warning.
      req.db = prisma;
      return next();
    }

    // 2. Set req.orgId as single source of truth
    req.orgId = orgId;

    // 3. Prisma client extension for automatic filtering
    req.db = prisma.$extends({
      query: {
        $allModels: {
          async findMany({ args, query }) {
            // Apply orgId filter
            args.where = { ...args.where, orgId: req.orgId };
            return query(args);
          },
          async findFirst({ args, query }) {
            // Apply orgId filter
            args.where = { ...args.where, orgId: req.orgId };
            return query(args);
          },
          async count({ args, query }) {
            // Apply orgId filter for counts too
            args.where = { ...args.where, orgId: req.orgId };
            return query(args);
          }
        }
      }
    });

    logger.debug(`Tenant isolation applied for org: ${orgId}`, { path: req.path });
    next();
  } catch (error) {
    logger.error('Tenant isolation middleware error:', error);
    next(error);
  }
}
