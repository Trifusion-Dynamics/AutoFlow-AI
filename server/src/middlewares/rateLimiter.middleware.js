import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { errorResponse } from '../utils/response.util.js';

// Skip rate limiting in test environment
const skipFn = () => env.NODE_ENV === 'test';

// Use memory store for now (Redis integration can be added later)
const createStore = () => {
  return undefined; // Use memory store
};

// Rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  store: createStore(),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipFn,
  handler: (req, res) => {
    return errorResponse(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many authentication attempts, please try again later',
      429
    );
  },
});

// Rate limiter for general API endpoints
export const apiLimiter = rateLimit({
  store: createStore(),
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: skipFn,
  handler: (req, res) => {
    return errorResponse(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests, please try again later',
      429
    );
  },
});

// Rate limiter for webhook endpoints
export const webhookLimiter = rateLimit({
  store: createStore(),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipFn,
  handler: (req, res) => {
    return errorResponse(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many webhook requests, please try again later',
      429
    );
  },
});

// Create a custom rate limiter for specific actions
export function createCustomLimiter(options) {
  return rateLimit({
    store: createStore(),
    windowMs: options.windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: options.max || env.RATE_LIMIT_MAX,
    keyGenerator: options.keyGenerator || ((req) => req.user?.id || req.ip),
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipFn,
    handler: (req, res) => {
      return errorResponse(
        res,
        'RATE_LIMIT_EXCEEDED',
        options.message || 'Too many requests, please try again later',
        429
      );
    },
  });
}
