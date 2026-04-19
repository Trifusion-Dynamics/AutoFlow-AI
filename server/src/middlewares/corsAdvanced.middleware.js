import cors from 'cors';
import { env } from '../config/env.js';

/**
 * Advanced CORS middleware with per-org origin whitelist,
 * preflight caching, and custom header exposure.
 */

const EXPOSED_HEADERS = [
  'X-Request-Id',
  'X-Response-Time',
  'X-API-Version',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'Deprecation',
  'Sunset',
  'Link',
  'Idempotency-Replayed',
];

/**
 * Build the allowed origins list.
 * Uses APP_URL as default, can be extended with org-specific origins.
 */
function getAllowedOrigins() {
  const origins = [env.APP_URL];

  // In development allow localhost variants
  if (env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://localhost:5000');
    origins.push('http://localhost:5173');
    origins.push('http://127.0.0.1:3000');
    origins.push('http://127.0.0.1:5000');
  }

  return origins;
}

/**
 * Create advanced CORS middleware.
 */
export function createAdvancedCors() {
  return cors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins();

      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In production, reject unknown origins
      if (env.NODE_ENV === 'production') {
        return callback(new Error('CORS_NOT_ALLOWED'), false);
      }

      // In development, allow all origins
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-API-Key',
      'Idempotency-Key',
    ],
    exposedHeaders: EXPOSED_HEADERS,
    maxAge: 86400, // 24 hours preflight cache
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
}
