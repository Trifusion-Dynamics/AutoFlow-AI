import { prisma } from "../config/db.js";
import {
  verifyAccessToken,
  extractTokenFromHeader,
} from "../utils/jwt.util.js";
import { errorResponse } from "../utils/response.util.js";
import { redisHelpers } from "../config/redis.js";

export async function blacklistToken(jti, expiresAt) {
  try {
    const key = `token_blacklist:${jti}`;
    await redisHelpers.set(key, '1');
    
    // Calculate TTL in seconds
    const now = Math.floor(Date.now() / 1000);
    const ttl = Math.max(0, expiresAt - now);
    
    if (ttl > 0) {
      await redisHelpers.expire(key, ttl);
    }
  } catch (error) {
    console.error('Failed to blacklist token in Redis:', error);
  }
}

export async function isTokenBlacklisted(jti) {
  try {
    const key = `token_blacklist:${jti}`;
    const exists = await redisHelpers.exists(key);
    return exists > 0;
  } catch (error) {
    console.error('Failed to check token blacklist in Redis:', error);
    return false;
  }
}

export async function authenticate(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);
    if (!token) {
      return errorResponse(
        res,
        "MISSING_TOKEN",
        "Authentication token is required",
        401,
      );
    }

    const payload = await verifyAccessToken(token);

    if (await isTokenBlacklisted(payload.jti)) {
      return errorResponse(
        res,
        "TOKEN_BLACKLISTED",
        "Token has been revoked",
        401,
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { org: true },
    });

    if (!user) {
      return errorResponse(res, "USER_NOT_FOUND", "User not found", 401);
    }

    if (!user.isActive) {
      return errorResponse(
        res,
        "ACCOUNT_DISABLED",
        "Account has been disabled",
        403,
      );
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      org: user.org,
    };

    req.tokenJti = payload.jti;
    next();
  } catch (error) {
    if (error.name === "JWTExpired" || error.name === "JWSInvalid") {
      return errorResponse(
        res,
        "INVALID_TOKEN",
        "Invalid or expired authentication token",
        401,
      );
    }
    next(error);
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);
    if (!token) {
      return next();
    }

    const payload = await verifyAccessToken(token);

    if (await isTokenBlacklisted(payload.jti)) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { org: true },
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        org: user.org,
      };
      req.tokenJti = payload.jti;
    }

    next();
  } catch (error) {
    next();
  }
}

export function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        "UNAUTHORIZED",
        "Authentication required for this resource",
        401,
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        "FORBIDDEN",
        "You do not have permission to access this resource",
        403,
      );
    }

    next();
  };
}
