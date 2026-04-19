import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JWTExpired, JWSInvalid } from 'jose/errors';
import { logger } from '../utils/logger.util.js';
import { errorResponse } from '../utils/response.util.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export function errorHandler(error, req, res, next) {
  // Log the error
  const logData = {
    error: error.message,
    code: error.code,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  };

  if (env.NODE_ENV !== 'production') {
    logData.stack = error.stack;
  }

  logger.error('API Error:', logData);

  // 1. Custom Application Errors (AppError and its sub-classes)
  if (error instanceof AppError) {
    return errorResponse(
      res,
      error.code,
      error.message,
      error.statusCode,
      error.details
    );
  }

  // 2. Prisma Database Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return errorResponse(
          res,
          'DUPLICATE_ENTRY',
          'A record with this value already exists',
          409,
          [{ field: error.meta?.target?.[0] || 'unknown', message: 'Must be unique' }]
        );
      case 'P2025':
        return errorResponse(
          res,
          'NOT_FOUND',
          'Record not found',
          404
        );
      case 'P2003':
        return errorResponse(
          res,
          'FOREIGN_KEY_CONSTRAINT',
          'Referenced record does not exist',
          400
        );
      default:
        return errorResponse(
          res,
          'DATABASE_ERROR',
          'Database operation failed',
          500
        );
    }
  }

  // 3. Zod Validation Errors
  if (error instanceof ZodError) {
    const fieldErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return errorResponse(
      res,
      'VALIDATION_ERROR',
      'Invalid input data',
      400,
      fieldErrors
    );
  }

  // 4. JWT Authentication Errors
  if (error instanceof JWTExpired) {
    return errorResponse(
      res,
      'TOKEN_EXPIRED',
      'Access token has expired',
      401
    );
  }

  if (error instanceof JWSInvalid || error.message.includes('JWT')) {
    return errorResponse(
      res,
      'INVALID_TOKEN',
      'Invalid authentication token',
      401
    );
  }

  // 5. Default internal error
  const message = env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  return errorResponse(
    res,
    'INTERNAL_ERROR',
    message,
    500
  );
}

