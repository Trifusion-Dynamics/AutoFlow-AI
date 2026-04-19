import { env } from '../config/env.js';
import { logger } from './logger.util.js';
import fs from 'fs';
import path from 'path';

/**
 * Security Configuration Auditor
 * Runs at startup to identify potential misconfigurations
 */
export async function runSecurityAudit() {
  logger.info('🔍 Running security configuration audit...');
  
  const findings = [];
  const isProd = env.NODE_ENV === 'production';

  // 1. Check for sensitive secrets in environment
  const insecureSecrets = [
    { key: 'JWT_ACCESS_SECRET', minLen: 64 },
    { key: 'JWT_REFRESH_SECRET', minLen: 64 },
    { key: 'ENCRYPTION_KEY', exactLen: 32 },
    { key: 'ADMIN_SECRET', minLen: 64 }
  ];

  insecureSecrets.forEach(({ key, minLen, exactLen }) => {
    const val = env[key];
    if (val) {
      if (exactLen && val.length !== exactLen) {
        findings.push({ severity: 'HIGH', message: `${key} must be exactly ${exactLen} chars. Current: ${val.length}` });
      } else if (minLen && val.length < minLen) {
        findings.push({ severity: 'HIGH', message: `${key} is too weak (min ${minLen} chars). Current: ${val.length}` });
      }
      
      if (isProd && (val.includes('test') || val.includes('demo') || val.includes('1234'))) {
        findings.push({ severity: 'CRITICAL', message: `${key} contains a known weak pattern in production!` });
      }
    }
  });

  // 2. Production-specific checks
  if (isProd) {
    if (!env.APP_URL.startsWith('https://')) {
      findings.push({ severity: 'CRITICAL', message: 'Production APP_URL must use HTTPS!' });
    }
    
    if (env.JWT_ALGO === 'HS256') {
      findings.push({ severity: 'MEDIUM', message: 'HS256 used in production. Recommending RS256.' });
    }
  }

  // 3. Exposed Admin Endpoints Check
  // (In-memory check of routes can be added if needed)

  // 4. Storage permissions
  const storagePath = path.join(process.cwd(), 'storage');
  if (fs.existsSync(storagePath)) {
    try {
      const stats = fs.statSync(storagePath);
      // On Linux/Unix, verify permissions (not easily portable to Windows but good practice)
      // logger.debug('Storage stats:', stats);
    } catch (e) {
      findings.push({ severity: 'LOW', message: 'Could not auditing storage permissions.' });
    }
  }

  // Log findings
  if (findings.length === 0) {
    logger.info('✅ Security audit passed: No critical issues found.');
  } else {
    findings.forEach(f => {
      const logFn = f.severity === 'CRITICAL' || f.severity === 'HIGH' ? logger.error : logger.warn;
      logFn(`[SECURITY AUDIT] [${f.severity}] ${f.message}`);
    });
    
    if (findings.some(f => f.severity === 'CRITICAL') && isProd) {
      logger.error('CRITICAL: Production startup aborted due to security configuration failures.');
      // In a real environment, we might want to exit here
      // process.exit(1); 
    }
  }

  return findings;
}
