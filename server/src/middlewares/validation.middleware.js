import { errorResponse } from '../utils/response.util.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      let data;
      
      switch (source) {
        case 'query':
          data = req.query;
          break;
        case 'params':
          data = req.params;
          break;
        case 'headers':
          data = req.headers;
          break;
        default:
          data = req.body;
      }

      const result = schema.parse(data);
      
      // Update the appropriate request property
      switch (source) {
        case 'query':
          req.query = result;
          break;
        case 'params':
          req.params = result;
          break;
        case 'headers':
          Object.assign(req.headers, result);
          break;
        default:
          req.body = result;
      }
      
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Validation failed',
          400,
          { errors }
        );
      }
      
      next(error);
    }
  };
}
