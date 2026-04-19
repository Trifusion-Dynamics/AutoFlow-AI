import { ZodSchema } from 'zod';
import { errorResponse } from '../utils/response.util.js';

export function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.body);
      req.validatedBody = result;
      next();
    } catch (error) {
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
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.query);
      req.validatedQuery = result;
      next();
    } catch (error) {
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid query parameters',
        400,
        fieldErrors
      );
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.params);
      req.validatedParams = result;
      next();
    } catch (error) {
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid URL parameters',
        400,
        fieldErrors
      );
    }
  };
}
