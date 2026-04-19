import { authenticate } from './auth.middleware.js';
import { authenticateApiKey, requireApiKeyPermissions } from './apiKeyAuth.middleware.js';
import { errorResponse } from '../utils/response.util.js';

export async function flexibleAuth(req, res, next) {
  try {
    // First try JWT authentication
    const jwtAuthPromise = new Promise((resolve) => {
      authenticate(req, res, resolve);
    });

    await jwtAuthPromise;

    // If JWT authentication succeeded, continue
    if (req.user) {
      req.authType = 'jwt';
      return next();
    }

    // If JWT failed, try API key authentication
    const apiKey = req.header('X-API-Key');
    
    if (apiKey) {
      await authenticateApiKey(req, res, next);
    } else {
      // Neither JWT nor API key provided
      return errorResponse(
        res,
        'AUTHENTICATION_REQUIRED',
        'Either JWT token or API key is required',
        401
      );
    }
  } catch (error) {
    next(error);
  }
}

export function requireFlexibleAuth(requiredPermissions = []) {
  return async (req, res, next) => {
    try {
      // First try JWT authentication
      const jwtAuthPromise = new Promise((resolve) => {
        authenticate(req, res, resolve);
      });

      await jwtAuthPromise;

      // If JWT authentication succeeded, check permissions and continue
      if (req.user) {
        req.authType = 'jwt';
        return next();
      }

      // If JWT failed, try API key authentication
      const apiKey = req.header('X-API-Key');
      
      if (apiKey) {
        await authenticateApiKey(req, res, (err) => {
          if (err) return next(err);
          
          // Check API key permissions if required
          if (requiredPermissions.length > 0) {
            const hasPermissions = requireApiKeyPermissions(requiredPermissions)(req, res, next);
            if (hasPermissions) return next();
          } else {
            return next();
          }
        });
      } else {
        // Neither JWT nor API key provided
        return errorResponse(
          res,
          'AUTHENTICATION_REQUIRED',
          'Either JWT token or API key is required',
          401
        );
      }
    } catch (error) {
      next(error);
    }
  };
}

export function isApiKeyAuth(req) {
  return req.authType === 'apiKey' && !!req.apiKeyAuth;
}

export function isJWTAuth(req) {
  return req.authType === 'jwt' && !!req.user;
}

export function getAuthUser(req) {
  if (isJWTAuth(req)) {
    return req.user;
  } else if (isApiKeyAuth(req)) {
    return {
      id: null, // API keys don't have user IDs
      orgId: req.apiKeyAuth.orgId,
      apiKey: req.apiKeyAuth.apiKey,
      org: req.apiKeyAuth.org,
    };
  }
  return null;
}

export function getAuthOrg(req) {
  if (isJWTAuth(req)) {
    return req.user.org;
  } else if (isApiKeyAuth(req)) {
    return req.apiKeyAuth.org;
  }
  return null;
}

export function getAuthOrgId(req) {
  if (isJWTAuth(req)) {
    return req.user.orgId;
  } else if (isApiKeyAuth(req)) {
    return req.apiKeyAuth.orgId;
  }
  return null;
}
