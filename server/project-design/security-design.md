# Security Design

## Authentication & Authorization Architecture

### Authentication Flow

```text
Registration Flow:
1. Client sends registration request
2. Input validation (Zod schema)
3. Check email uniqueness
4. Hash password (bcrypt, rounds: 12)
5. Create organization and user
6. Send verification email
7. Generate JWT tokens
8. Return user data + tokens

Login Flow:
1. Client sends credentials
2. Find user by email
3. Compare password hash
4. Check account status (active, verified)
5. Generate access token (JWT, 15min expiry)
6. Generate refresh token (JWT, 7days expiry)
7. Store refresh token hash in database
8. Update last login timestamp
9. Return tokens + user data

Token Refresh Flow:
1. Client sends refresh token
2. Verify JWT signature and expiry
3. Check token hash in database (not revoked)
4. Verify user is still active
5. Rotate tokens - revoke old, issue new pair
6. Store new refresh token hash
7. Return new tokens

Protected Route Flow:
1. Extract Bearer token from header
2. Verify JWT signature
3. Check token not blacklisted (Redis)
4. Validate token expiry
5. Load user from database
6. Check RBAC permissions
7. Attach user to request object
```

### JWT Token Structure

#### Access Token
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_uuid",
    "orgId": "org_uuid",
    "email": "user@example.com",
    "role": "admin",
    "permissions": ["read", "write", "admin"],
    "type": "access",
    "iat": 1642234567,
    "exp": 1642235467,
    "iss": "autoflow-ai",
    "aud": "autoflow-users"
  }
}
```

#### Refresh Token
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_uuid",
    "orgId": "org_uuid",
    "type": "refresh",
    "tokenId": "token_uuid",
    "iat": 1642234567,
    "exp": 1642839367,
    "iss": "autoflow-ai",
    "aud": "autoflow-users"
  }
}
```

## Role-Based Access Control (RBAC)

### Permission Matrix

| Resource/Action | Owner | Admin | Member | Viewer |
|-----------------|-------|-------|--------|--------|
| **Workflows** | | | | |
| Create | `workflow.create` | `workflow.create` | `workflow.create` | - |
| Read (own) | `workflow.read.own` | `workflow.read.all` | `workflow.read.own` | `workflow.read.own` |
| Update (own) | `workflow.update.own` | `workflow.update.all` | `workflow.update.own` | - |
| Delete (own) | `workflow.delete.own` | `workflow.delete.all` | - | - |
| Execute | `workflow.execute` | `workflow.execute` | `workflow.execute` | - |
| **Executions** | | | | |
| Read (own) | `execution.read.own` | `execution.read.all` | `execution.read.own` | `execution.read.own` |
| Read logs | `execution.logs.own` | `execution.logs.all` | `execution.logs.own` | `execution.logs.own` |
| **Users** | | | | |
| Invite | `user.invite` | `user.invite` | - | - |
| Update role | `user.role.update` | `user.role.update` | - | - |
| Remove | `user.remove` | `user.remove` | - | - |
| **Organization** | | | | |
| Update settings | `org.update` | `org.update` | - | - |
| View billing | `org.billing.read` | `org.billing.read` | - | - |
| Manage API keys | `apikey.manage` | `apikey.manage` | - | - |
| **System** | | | | |
| View audit logs | `audit.read` | `audit.read` | - | - |
| System stats | `system.stats` | `system.stats` | - | - |

### Permission Implementation

```javascript
// rbac.middleware.js
class RBACMiddleware {
  static requirePermission(permission) {
    return async (req, res, next) => {
      try {
        const user = req.user;
        const resource = req.params.id || req.body.orgId;
        
        if (!user) {
          return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
          });
        }

        const hasPermission = await this.checkPermission(user, permission, resource);
        
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static async checkPermission(user, permission, resourceId = null) {
    // Check if user has the required permission
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Check resource-specific permissions
    if (resourceId && permission.includes('.own')) {
      const basePermission = permission.replace('.own', '.all');
      if (user.permissions.includes(basePermission)) {
        return true;
      }
    }

    // Check ownership
    if (resourceId && permission.includes('.own')) {
      const isOwner = await this.checkOwnership(user.id, resourceId);
      return isOwner;
    }

    return false;
  }

  static async checkOwnership(userId, resourceId) {
    // Implementation varies by resource type
    // Example: Check if user owns the workflow
    const workflow = await WorkflowRepository.findById(resourceId);
    return workflow && workflow.createdBy === userId;
  }
}
```

## Security Middleware Stack

### 1. Rate Limiting

```javascript
// rateLimiter.middleware.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

const rateLimitConfigs = {
  // Auth endpoints - very strict
  auth: {
    windowMs: 60 * 1000,        // 1 minute
    max: 10,                    // 10 requests per minute
    message: 'Too many auth attempts',
    store: new RedisStore({
      client: redis,
      prefix: 'rl:auth:'
    })
  },

  // Webhook endpoints - higher limit
  webhook: {
    windowMs: 60 * 1000,        // 1 minute
    max: 100,                   // 100 requests per minute
    store: new RedisStore({
      client: redis,
      prefix: 'rl:webhook:'
    })
  },

  // General API - per user
  api: {
    windowMs: 60 * 1000,        // 1 minute
    max: 200,                   // 200 requests per minute
    keyGenerator: (req) => req.user?.id || req.ip,
    store: new RedisStore({
      client: redis,
      prefix: 'rl:api:'
    })
  }
};

module.exports = {
  auth: rateLimit(rateLimitConfigs.auth),
  webhook: rateLimit(rateLimitConfigs.webhook),
  api: rateLimit(rateLimitConfigs.api)
};
```

### 2. Security Headers (Helmet)

```javascript
// security.middleware.js
const helmet = require('helmet');

const securityConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },

  // Prevent clickjacking
  frameguard: { action: 'deny' },

  // Prevent MIME type sniffing
  noSniff: true,

  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // HSTS (HTTPS only)
  hsts: {
    maxAge: 31536000,           // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // X-XSS Protection
  xssFilter: true,

  // Expect-CT header
  expectCt: {
    maxAge: 86400,
    enforce: true
  }
});

module.exports = securityConfig;
```

### 3. Input Validation & Sanitization

```javascript
// validate.middleware.js
const z = require('zod');
const DOMPurify = require('isomorphic-dompurify');

const schemas = {
  // Auth schemas
  register: z.object({
    name: z.string().min(2).max(255),
    email: z.string().email(),
    password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    orgName: z.string().min(2).max(255)
  }),

  login: z.object({
    email: z.string().email(),
    password: z.string()
  }),

  // Workflow schemas
  createWorkflow: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    trigger: z.object({
      type: z.enum(['webhook', 'cron', 'manual']),
      config: z.record(z.any())
    }),
    steps: z.array(z.object({
      id: z.string(),
      name: z.string(),
      tool: z.string(),
      config: z.record(z.any())
    })),
    agentInstruction: z.string().max(2000)
  }),

  // Email schemas
  sendEmail: z.object({
    to: z.string().email(),
    subject: z.string().min(1).max(255),
    body: z.string().transform(val => DOMPurify.sanitize(val)),
    cc: z.array(z.string().email()).optional()
  })
};

class ValidationMiddleware {
  static validate(schemaName) {
    return (req, res, next) => {
      try {
        const schema = schemas[schemaName];
        const validatedData = schema.parse(req.body);
        req.body = validatedData;
        next();
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        });
      }
    };
  }
}

module.exports = { ValidationMiddleware, schemas };
```

## Data Protection & Encryption

### Password Hashing

```javascript
// crypto.util.js
const bcrypt = require('bcrypt');

class CryptoUtils {
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static generateSecureToken(length = 32) {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }

  static encryptData(data, key) {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('autoflow-ai'));
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  static decryptData(encryptedData, key) {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('autoflow-ai'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}
```

### Token Management

```javascript
// token.util.js
const jwt = require('jose');
const crypto = require('crypto');

class TokenManager {
  static async generateTokens(user) {
    const accessPayload = {
      sub: user.id,
      orgId: user.orgId,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      type: 'access'
    };

    const refreshPayload = {
      sub: user.id,
      orgId: user.orgId,
      type: 'refresh',
      tokenId: crypto.randomUUID()
    };

    const accessToken = await this.signToken(accessPayload, '15m');
    const refreshToken = await this.signToken(refreshPayload, '7d');

    // Store refresh token hash
    await this.storeRefreshToken(refreshPayload.tokenId, user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  static async signToken(payload, expiresIn) {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const alg = 'HS256';

    return await new jwt.SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setIssuer('autoflow-ai')
      .setAudience('autoflow-users')
      .setExpirationTime(expiresIn)
      .sign(secret);
  }

  static async verifyToken(token, type = 'access') {
    const secret = new TextEncoder().encode(
      type === 'access' ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET
    );

    const { payload } = await jwt.jwtVerify(token, secret, {
      issuer: 'autoflow-ai',
      audience: 'autoflow-users'
    });

    if (payload.type !== type) {
      throw new Error('Invalid token type');
    }

    return payload;
  }

  static async revokeToken(jti) {
    // Add to Redis blacklist
    const redis = require('../config/redis');
    await redis.setex(`token_blacklist:${jti}`, 604800, '1'); // 7 days
  }

  static async isTokenRevoked(jti) {
    const redis = require('../config/redis');
    const result = await redis.get(`token_blacklist:${jti}`);
    return result === '1';
  }
}
```

## API Security

### Webhook Security

```javascript
// webhook.security.js
const crypto = require('crypto');

class WebhookSecurity {
  static generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  static verifySignature(payload, signature, secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  static middleware() {
    return (req, res, next) => {
      const signature = req.headers['x-webhook-signature'];
      const workflowId = req.params.workflowId;

      if (!signature) {
        return res.status(401).json({
          success: false,
          error: { code: 'MISSING_SIGNATURE', message: 'Webhook signature required' }
        });
      }

      // Get workflow secret from database
      WorkflowRepository.findById(workflowId)
        .then(workflow => {
          if (!workflow || !workflow.webhookSecret) {
            throw new Error('Workflow not found or no webhook secret');
          }

          const isValid = this.verifySignature(req.body, signature, workflow.webhookSecret);
          
          if (!isValid) {
            return res.status(401).json({
              success: false,
              error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' }
            });
          }

          req.workflow = workflow;
          next();
        })
        .catch(error => {
          res.status(500).json({
            success: false,
            error: { code: 'WEBHOOK_ERROR', message: 'Webhook verification failed' }
          });
        });
    };
  }
}
```

### API Key Security

```javascript
// apikey.util.js
const crypto = require('crypto');

class APIKeyUtils {
  static generateKey() {
    const prefix = 'ak_live_';
    const key = crypto.randomBytes(32).toString('hex');
    return prefix + key;
  }

  static hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  static extractPrefix(key) {
    return key.substring(0, 20); // First 20 characters
  }

  static middleware() {
    return async (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // Let JWT auth handle it
      }

      const token = authHeader.substring(7);
      
      // Check if it's an API key (starts with 'ak_')
      if (token.startsWith('ak_')) {
        try {
          const hashedKey = this.hashKey(token);
          const apiKey = await APIKeyRepository.findByHash(hashedKey);
          
          if (!apiKey || !apiKey.isActive) {
            return res.status(401).json({
              success: false,
              error: { code: 'INVALID_API_KEY', message: 'Invalid or inactive API key' }
            });
          }

          // Check permissions
          const hasPermission = this.checkAPIKeyPermissions(apiKey, req);
          if (!hasPermission) {
            return res.status(403).json({
              success: false,
              error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'API key lacks required permissions' }
            });
          }

          // Update last used timestamp
          await APIKeyRepository.updateLastUsed(apiKey.id);

          req.apiKey = apiKey;
          req.user = { id: apiKey.createdBy, orgId: apiKey.orgId };
          req.isAPIKey = true;
          
        } catch (error) {
          return res.status(401).json({
            success: false,
            error: { code: 'API_KEY_ERROR', message: 'API key verification failed' }
          });
        }
      }
      
      next();
    };
  }

  static checkAPIKeyPermissions(apiKey, req) {
    const requiredPermissions = this.getRequiredPermissions(req);
    return requiredPermissions.every(perm => apiKey.permissions.includes(perm));
  }

  static getRequiredPermissions(req) {
    const method = req.method;
    const path = req.path;

    if (path.startsWith('/api/workflows')) {
      if (method === 'GET') return ['read'];
      if (method === 'POST') return ['write'];
      if (method === 'PUT' || method === 'DELETE') return ['write'];
    }

    if (path.startsWith('/api/executions')) {
      if (method === 'GET') return ['read'];
    }

    return ['read']; // Default permission
  }
}
```

## Audit & Logging

### Audit Trail

```javascript
// audit.service.js
class AuditService {
  static async logAction(data) {
    const auditLog = {
      id: crypto.randomUUID(),
      orgId: data.orgId,
      userId: data.userId,
      action: data.action,              // e.g., 'workflow.created', 'user.login'
      resourceType: data.resourceType,    // e.g., 'workflow', 'user', 'execution'
      resourceId: data.resourceId,
      oldValue: data.oldValue,
      newValue: data.newValue,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: new Date()
    };

    await AuditLogRepository.create(auditLog);
    
    // Send to external logging service
    this.sendToLogService(auditLog);
  }

  static async logAuthEvent(event, user, req) {
    await this.logAction({
      orgId: user.orgId,
      userId: user.id,
      action: `auth.${event}`,  // e.g., 'auth.login', 'auth.logout'
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  static async logWorkflowAction(action, workflow, user, req) {
    await this.logAction({
      orgId: workflow.orgId,
      userId: user.id,
      action: `workflow.${action}`,
      resourceType: 'workflow',
      resourceId: workflow.id,
      oldValue: action === 'updated' ? workflow._previous : null,
      newValue: action === 'updated' ? workflow._current : null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
}
```

### Security Event Monitoring

```javascript
// security.monitor.js
class SecurityMonitor {
  static async detectSuspiciousActivity(req, user) {
    const events = await this.getRecentEvents(user.id, req.ip);
    
    // Check for multiple failed logins
    const failedLogins = events.filter(e => e.action === 'auth.login_failed');
    if (failedLogins.length >= 5) {
      await this.triggerSecurityAlert('MULTIPLE_LOGIN_FAILURES', user.id, req.ip);
    }

    // Check for unusual IP
    const knownIPs = await this.getKnownIPs(user.id);
    if (!knownIPs.includes(req.ip)) {
      await this.triggerSecurityAlert('NEW_IP_LOGIN', user.id, req.ip);
    }

    // Check for rapid API usage
    const recentAPI = events.filter(e => e.action.startsWith('api.'));
    if (recentAPI.length >= 100) {
      await this.triggerSecurityAlert('HIGH_API_USAGE', user.id, req.ip);
    }
  }

  static async triggerSecurityAlert(type, userId, ipAddress) {
    const alert = {
      type,
      userId,
      ipAddress,
      timestamp: new Date(),
      severity: this.getSeverity(type)
    };

    await SecurityAlertRepository.create(alert);
    
    // Send notification
    await NotificationService.sendSecurityAlert(alert);
    
    // Take automatic action if needed
    await this.takeAutomaticAction(alert);
  }

  static async takeAutomaticAction(alert) {
    switch (alert.type) {
      case 'MULTIPLE_LOGIN_FAILURES':
        // Temporarily lock account
        await UserService.lockAccount(alert.userId, 15 * 60 * 1000); // 15 minutes
        break;
      
      case 'HIGH_API_USAGE':
        // Reduce rate limit
        await RateLimitService.reduceLimit(alert.userId, 0.5); // 50% reduction
        break;
    }
  }
}
```

## Infrastructure Security

### Environment Variables

```bash
# .env.example - Security settings
NODE_ENV=production
PORT=3000

# JWT Secrets (minimum 32 characters)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Encryption key for sensitive data
ENCRYPTION_KEY=32-char-key-for-encrypting-tool-credentials

# Database (use SSL)
DATABASE_URL=postgresql://user:pass@localhost:5432/autoflow?sslmode=require

# Redis (use TLS)
REDIS_URL=redis://user:pass@localhost:6379?tls=true

# External API keys (rotate regularly)
ANTHROPIC_API_KEY=sk-ant-...
SMTP_PASS=app-password

# CORS settings
CORS_ORIGIN=https://yourdomain.com

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=200

# Webhook security
WEBHOOK_TIMEOUT=30000
WEBHOOK_MAX_SIZE=1048576  # 1MB
```

### Database Security

```sql
-- Row Level Security (RLS) policies
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_org_policy ON workflows
  FOR ALL TO authenticated_users
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Audit triggers
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (org_id, user_id, action, resource_type, resource_id, old_value, new_value)
  VALUES (
    COALESCE(NEW.org_id, OLD.org_id),
    current_setting('app.current_user_id')::uuid,
    TG_OP || '.' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER workflows_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON workflows
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

## Compliance & Data Privacy

### GDPR Compliance

```javascript
// gdpr.service.js
class GDPRService {
  static async exportUserData(userId) {
    const user = await UserRepository.findById(userId);
    const workflows = await WorkflowRepository.findByUserId(userId);
    const executions = await ExecutionRepository.findByUserId(userId);
    const auditLogs = await AuditLogRepository.findByUserId(userId);

    return {
      personalData: {
        user: this.sanitizeUser(user),
        createdAt: user.createdAt
      },
      activities: {
        workflows: workflows.map(w => this.sanitizeWorkflow(w)),
        executions: executions.map(e => this.sanitizeExecution(e))
      },
      auditTrail: auditLogs.map(log => this.sanitizeAuditLog(log))
    };
  }

  static async deleteUserData(userId) {
    // Soft delete user
    await UserRepository.softDelete(userId);
    
    // Anonymize workflows
    await WorkflowRepository.anonymizeByUserId(userId);
    
    // Delete executions after retention period
    await ExecutionRepository.scheduleDeletion(userId, new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
    
    // Keep audit logs for compliance
    await AuditLogRepository.markAsDeleted(userId);
  }

  static sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
```

### Data Retention Policy

```javascript
// retention.service.js
class DataRetentionService {
  static async cleanupExpiredData() {
    const now = new Date();
    
    // Delete executions older than 90 days
    await ExecutionRepository.deleteOlderThan(
      new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    );
    
    // Delete agent messages older than 30 days
    await AgentMessageRepository.deleteOlderThan(
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    );
    
    // Delete refresh tokens older than 7 days
    await RefreshTokenRepository.deleteExpired();
    
    // Archive audit logs older than 1 year
    await AuditLogRepository.archiveOlderThan(
      new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    );
  }
}
```
