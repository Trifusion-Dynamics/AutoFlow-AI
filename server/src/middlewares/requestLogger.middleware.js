import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { API_VERSION } from '../config/constants.js';
import { requestContext } from '../utils/requestContext.util.js';
import { logger } from '../utils/logger.util.js';

/**
 * Enhanced request logger middleware
 * Integrates AsyncLocalStorage for tracing and request context propagation
 */
export function requestLogger(req, res, next) {
  const startHrTime = process.hrtime.bigint();
  
  // Generate IDs
  const requestId = req.headers['x-request-id'] || `req_${uuidv4()}`;
  const traceId = req.headers['x-trace-id'] || `trace_${uuidv4()}`;
  
  // Set headers
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Trace-Id', traceId);
  res.setHeader('X-API-Version', API_VERSION);

  // Initialize context data
  const contextData = {
    requestId,
    traceId,
    orgId: null, // Will be set by auth middleware
    userId: null, // Will be set by auth middleware
    startTime: startHrTime
  };

  // Wrap the entire request in AsyncLocalStorage context
  requestContext.run(contextData, () => {
    // Override res.writeHead to add response time
    const originalWriteHead = res.writeHead.bind(res);
    res.writeHead = function (statusCode, statusMessage, headers) {
      if (!res.headersSent) {
        const elapsedNs = process.hrtime.bigint() - startHrTime;
        const elapsedMs = Number(elapsedNs / 1000000n);
        res.setHeader('X-Response-Time', `${elapsedMs}ms`);
      }
      return originalWriteHead(statusCode, statusMessage, headers);
    };

    // Skip health checks and metrics from main logs if needed
    const skip = (req) => {
      return req.url.includes('/health') || req.url.includes('/metrics');
    };

    // Production format (JSON via Winston)
    if (env.NODE_ENV === 'production') {
      const morganMiddleware = morgan((tokens, req, res) => {
        const data = {
          method: tokens.method(req, res),
          url: tokens.url(req, res),
          status: parseInt(tokens.status(req, res)),
          responseTime: parseFloat(tokens['response-time'](req, res)),
          ip: tokens['remote-addr'](req, res),
          userAgent: tokens['user-agent'](req, res),
        };
        
        // Log via Winston HTTP level
        logger.http('HTTP Request', data);
        return null;
      }, { skip });

      return morganMiddleware(req, res, next);
    } 
    
    // Development format (Pretty console via Morgan strings + Winston)
    const morganMiddleware = morgan(':method :url :status :response-time ms - :res[content-length]', {
      skip,
      stream: {
        write: (message) => logger.http(message.trim())
      }
    });

    return morganMiddleware(req, res, next);
  });
}
