import winston from 'winston';
import 'winston-daily-rotate-file';
import { env } from '../config/env.js';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { requestContext } from './requestContext.util.js';

// Create logs directory if it doesn't exist
try {
  mkdirSync('logs', { recursive: true });
} catch (error) {
  // Directory already exists or permission error
}

/**
 * Custom redaction transformer for sensitive data
 */
const redactSecrets = winston.format((info) => {
  const secretKeys = [
    'password', 'passwordHash', 'token', 'refreshToken',
    'apiKey', 'keyHash', 'secret', 'webhookSecret',
    'ANTHROPIC_API_KEY', 'SMTP_PASS', 'ENCRYPTION_KEY',
    'AWS_SECRET_ACCESS_KEY', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'
  ];

  const redact = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
    
    for (const key in newObj) {
      if (secretKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        newObj[key] = '***REDACTED***';
      } else if (typeof newObj[key] === 'object') {
        newObj[key] = redact(newObj[key]);
      }
    }
    return newObj;
  };

  // Process message if it's an object or contains objects
  if (typeof info.message === 'object') {
    info.message = redact(info.message);
  }
  
  // Process any additional metadata
  const { ...meta } = info;
  Object.keys(meta).forEach(key => {
    if (key !== 'message' && key !== 'level' && key !== 'timestamp') {
      info[key] = redact(meta[key]);
    }
  });

  return info;
});

/**
 * Injects request context into every log entry
 */
const injectContext = winston.format((info) => {
  const context = requestContext.getContext();
  if (context) {
    info.requestId = context.requestId || info.requestId;
    info.traceId = context.traceId || info.traceId;
    info.orgId = context.orgId || info.orgId;
    info.userId = context.userId || info.userId;
  }
  
  info.environment = env.NODE_ENV;
  info.service = 'autoflow-api';
  info.version = process.env.npm_package_version || '1.0.0';
  
  return info;
});

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  injectContext(),
  redactSecrets(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  injectContext(),
  redactSecrets(),
  winston.format.printf(({ timestamp, level, message, requestId, orgId, ...meta }) => {
    let msg = `${timestamp} [${level}]`;
    if (requestId) msg += ` (Req: ${requestId})`;
    if (orgId) msg += ` (Org: ${orgId})`;
    msg += `: ${typeof message === 'object' ? JSON.stringify(message) : message}`;
    
    // Filter out internal fields from meta
    const extra = { ...meta };
    delete extra.timestamp;
    delete extra.level;
    delete extra.message;
    delete extra.service;
    delete extra.version;
    delete extra.environment;
    delete extra.requestId;
    delete extra.traceId;
    delete extra.orgId;
    delete extra.userId;

    if (Object.keys(extra).length > 0) {
      msg += ` ${JSON.stringify(extra)}`;
    }
    return msg;
  })
);

// Define transports
const transports = [
  // Combined log rotation
  new winston.transports.DailyRotateFile({
    filename: join('logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '14d',
    level: 'info',
  }),
  // Error log rotation
  new winston.transports.DailyRotateFile({
    filename: join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '14d',
    level: 'error',
  }),
  // HTTP specific log
  new winston.transports.DailyRotateFile({
    filename: join('logs', 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '14d',
    level: 'http',
  }),
  // Agent specific log (AI calls)
  new winston.transports.DailyRotateFile({
    filename: join('logs', 'agent-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '14d',
    level: 'debug', // We'll use debug level for detailed agent logs
    format: winston.format.combine(
      winston.format((info) => info.label === 'agent' ? info : false)(),
      winston.format.json()
    )
  })
];

const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: transports,
});

// Add console transport for non-production environments
if (env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

export { logger };
