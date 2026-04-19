import helmet from 'helmet';
import { logger } from '../utils/logger.util.js';
import { redisClient } from '../config/redis.js';
import { errorResponse } from '../utils/response.util.js';

/**
 * Security Middleware
 * Combines Helmet, SQLi prevention, Path Traversal checks, and Honeypots
 */
export const securityMiddleware = {
  /**
   * Enhanced Helmet configuration
   */
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.anthropic.com"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
  }),

  /**
   * Block requests and flag IPs for honeypot access
   */
  honeypot: async (req, res, next) => {
    const honeypotPaths = [
      '/.env', '/wp-admin', '/phpMyAdmin', 
      '/admin.php', '/config.php', '/.git',
      '/wp-login.php', '/backup', '/db'
    ];

    if (honeypotPaths.some(path => req.originalUrl.includes(path))) {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const key = `suspicious_ip:${ip}`;
      
      try {
        const count = await redisClient.getClient().incr(key);
        if (count === 1) {
          await redisClient.getClient().expire(key, 86400); // 24 hours
        }
        
        logger.warn(`Honeypot hit from IP: ${ip} for path: ${req.originalUrl}`, { count });
        
        if (count > 3) {
          return res.status(429).json({
            success: false,
            message: 'Too many suspicious requests. Your IP has been flagged.'
          });
        }
      } catch (error) {
        logger.error('Redis error in honeypot middleware:', error);
      }
      
      return res.status(404).end();
    }
    next();
  },

  /**
   * Prevent basic SQL Injection and Path Traversal patterns
   */
  detectAttacks: (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const suspiciousPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQLi
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i, // SQLi
      /\.\.\//, // Path Traversal
      /(sqlmap|nikto|nmap|masscan|zgrab)/i // Tool Fingerprinting
    ];

    const checkString = (str) => {
      if (typeof str !== 'string') return false;
      return suspiciousPatterns.some(pattern => pattern.test(str));
    };

    // Scan body, query, and params
    const isSuspicious = 
      Object.values(req.body || {}).some(v => typeof v === 'string' && checkString(v)) ||
      Object.values(req.query || {}).some(v => typeof v === 'string' && checkString(v)) ||
      Object.values(req.params || {}).some(v => typeof v === 'string' && checkString(v)) ||
      checkString(req.headers['user-agent'] || '');

    if (isSuspicious) {
      logger.warn(`Suspicious activity detected from IP: ${ip}`, {
        url: req.originalUrl,
        userAgent: req.headers['user-agent']
      });
      return errorResponse(res, 'FORBIDDEN', 'Suspicious activity detected', 403);
    }

    next();
  },

  /**
   * Check if IP is flagged or blocked
   */
  checkFlaggedIP: async (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const flaggedKey = `suspicious_ip:${ip}`;
    const blockedKey = `ip_blocklist:${ip}`;
    
    try {
      if (redisClient.isReady()) {
        const [flaggedCount, blockData] = await Promise.all([
          redisClient.getClient().get(flaggedKey),
          redisClient.getClient().get(blockedKey)
        ]);

        if (blockData) {
          const { reason } = JSON.parse(blockData);
          logger.warn(`Rejected blocked IP: ${ip}`, { reason });
          return res.status(403).json({
            success: false,
            error: {
              code: 'IP_BLOCKED',
              message: 'Your access has been blocked due to security violations.',
              reason
            }
          });
        }

        if (flaggedCount && parseInt(flaggedCount) > 10) {
          return res.status(429).json({
            success: false,
            message: 'Access denied due to suspicious activity history.'
          });
        }
      }
    } catch (error) {
      logger.error('Redis error checking flagged IP:', error);
    }
    next();
  }

};
