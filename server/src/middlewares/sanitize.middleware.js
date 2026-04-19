import sanitizeHtml from 'sanitize-html';
import { logger } from '../utils/logger.util.js';
import { errorResponse } from '../utils/response.util.js';

/**
 * Deep sanitize all string values in an object.
 * Removes HTML tags, null bytes, and trims whitespace.
 */
function deepSanitize(obj) {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Remove null bytes
    let cleaned = obj.replace(/\0/g, '');
    // Strip HTML
    cleaned = sanitizeHtml(cleaned, {
      allowedTags: [],
      allowedAttributes: {},
    });
    // Trim whitespace
    cleaned = cleaned.trim();
    return cleaned;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = deepSanitize(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Detect malicious patterns (NoSQL Injection, Command Injection)
 */
function detectMaliciousPatterns(obj) {
  const patterns = [
    { regex: /[$]{1,}/, name: 'NoSQL Operator' },
    { regex: /\{.*\}/, name: 'Brace Expansion' },
    { regex: /\|\s*rm\s+-rf/, name: 'Command Injection (Dangerous)' },
    { regex: /;\s*rm\s+-rf/, name: 'Command Injection (Dangerous)' },
    { regex: /\.\.\/|\.\.\\/, name: 'Path Traversal' },
    { regex: /<script\b[^>]*>([\s\S]*?)<\/script>/i, name: 'XSS Script Tag' }
  ];

  const checkValue = (val) => {
    if (typeof val === 'string') {
      for (const pattern of patterns) {
        if (pattern.regex.test(val)) return pattern.name;
      }
    }
    return null;
  };

  const traverse = (data) => {
    if (!data) return null;
    if (typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        // Check keys for NoSQL operators too
        const keyMatch = checkValue(key);
        if (keyMatch) return `${keyMatch} in key`;
        
        const valueMatch = typeof value === 'object' ? traverse(value) : checkValue(value);
        if (valueMatch) return valueMatch;
      }
    }
    return null;
  };

  return traverse(obj);
}

/**
 * Middleware to sanitize all string fields in req.body.
 * Should be applied globally before validation middleware.
 */
export function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    const intrusion = detectMaliciousPatterns(req.body);
    if (intrusion) {
      logger.error(`Suspicious input pattern detected: ${intrusion}`, {
        ip: req.ip,
        orgId: req.orgId,
        userId: req.user?.id
      });
      return errorResponse(res, 'MALICIOUS_INPUT', `Invalid input detected: ${intrusion}`, 403);
    }
    req.body = deepSanitize(req.body);
  }
  next();
}

