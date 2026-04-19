import { env } from '../../config/env.js';
import { redisHelpers } from '../../config/redis.js';

export const securityTestController = {
  getHeaders: (req, res) => {
    res.json({
      headers: req.headers,
      securityHeaders: {
        'X-Content-Type-Options': res.getHeader('X-Content-Type-Options'),
        'X-Frame-Options': res.getHeader('X-Frame-Options'),
        'Content-Security-Policy': res.getHeader('Content-Security-Policy'),
        'Strict-Transport-Security': res.getHeader('Strict-Transport-Security'),
        'Cache-Control': res.getHeader('Cache-Control'),
        'ETag': res.getHeader('ETag')
      }
    });
  },

  getRateLimitStatus: async (req, res) => {
    const ip = req.ip;
    const limitKey = `rate_limit:${ip}`; // Assuming standard rate limit keys
    const current = await redisHelpers.get(limitKey);
    
    res.json({
      ip,
      rateLimitKey: limitKey,
      currentUsage: current || 0,
      isFlagged: await redisHelpers.get(`flagged_ip:${ip}`) ? true : false
    });
  },

  getChecklist: async (req, res) => {
    const checklist = [
      { name: 'HTTPS Production', status: env.NODE_ENV === 'production' ? env.APP_URL.startsWith('https://') : 'N/A' },
      { name: 'JWT Algorithm', status: env.JWT_ALGO === 'RS256' ? 'SECURE (RS256)' : 'WEAK (HS256)' },
      { name: 'Security Audit Active', status: true },
      { name: 'CORS Configuration', status: env.CORS_ORIGINS === '*' ? 'INSECURE (Wildcard)' : 'CONFIGURED' },
      { name: 'Admin Secret Length', status: env.ADMIN_SECRET.length >= 64 ? 'SECURE' : 'WEAK' },
      { name: 'Logging Level', status: env.LOG_LEVEL }
    ];

    res.json({
      environment: env.NODE_ENV,
      checklist
    });
  },

  testInjection: (req, res) => {
    // This endpoint exists only to be hit with malicious payloads to verify detection
    res.json({ message: 'Payload accepted but sanitized/scanned', body: req.body });
  }
};
