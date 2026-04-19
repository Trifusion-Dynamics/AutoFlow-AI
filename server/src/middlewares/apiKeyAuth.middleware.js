import { apiKeyService } from '../modules/api-keys/api-keys.service.js';
import { errorResponse } from '../utils/response.util.js';

export async function authenticateApiKey(req, res, next) {
  try {
    const apiKey = req.header('X-API-Key');

    if (!apiKey) {
      return errorResponse(
        res,
        'MISSING_API_KEY',
        'API key is required for this endpoint',
        401
      );
    }

    // Validate API key format
    if (!apiKey.startsWith('ak_live_')) {
      return errorResponse(
        res,
        'INVALID_API_KEY_FORMAT',
        'Invalid API key format',
        401
      );
    }

    // Authenticate the API key
    const apiKeyAuth = await apiKeyService.authenticateApiKey(apiKey);

    if (!apiKeyAuth) {
      return errorResponse(
        res,
        'INVALID_API_KEY',
        'Invalid or expired API key',
        401
      );
    }

    // Attach API key authentication info to request
    req.apiKeyAuth = apiKeyAuth;
    req.authType = 'apiKey';

    next();
  } catch (error) {
    return errorResponse(
      res,
      'API_KEY_AUTH_ERROR',
      'API key authentication failed',
      500
    );
  }
}

export function requireApiKeyPermissions(requiredPermissions = []) {
  return (req, res, next) => {
    if (!req.apiKeyAuth) {
      return errorResponse(
        res,
        'API_KEY_REQUIRED',
        'API key authentication is required',
        401
      );
    }

    const hasPermissions = apiKeyService.validateApiKeyPermissions(
      req.apiKeyAuth,
      requiredPermissions
    );

    if (!hasPermissions) {
      return errorResponse(
        res,
        'INSUFFICIENT_API_KEY_PERMISSIONS',
        `API key lacks required permissions: ${requiredPermissions.join(', ')}`,
        403
      );
    }

    next();
  };
}

export function requireApiKeyOrJWT(requiredPermissions = []) {
  return async (req, res, next) => {
    // Check if already authenticated via JWT
    if (req.user) {
      req.authType = 'jwt';
      return next();
    }

    // Try API key authentication
    await authenticateApiKey(req, res, (err) => {
      if (err) return next(err);
      
      // Check API key permissions if required
      if (requiredPermissions.length > 0) {
        const hasPermissions = apiKeyService.validateApiKeyPermissions(
          req.apiKeyAuth,
          requiredPermissions
        );

        if (!hasPermissions) {
          return errorResponse(
            res,
            'INSUFFICIENT_API_KEY_PERMISSIONS',
            `API key lacks required permissions: ${requiredPermissions.join(', ')}`,
            403
          );
        }
      }

      next();
    });
  };
}
