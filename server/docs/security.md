# Security Architecture

AutoFlow AI implements a multi-layered security strategy based on OWASP Top 10 guidelines.

## 1. Authentication & Session Management (A07)
- **JWT Standard**: Upgraded to **RS256** (RSA Signature with SHA-256) for production, using a private/public key pair.
- **Account Lockout**: Automated lockout after 5 failed login attempts (15-minute cooldown).
- **Concurrent Sessions**: Limited to 5 active sessions per user to prevent account sharing and credential leakage.
- **Password Hashing**: BCrypt with salt rounds = 12.

## 2. Access Control (A01)
- **Tenant Isolation**: Mandatory `orgId` filtering on all database queries.
- **Resource Ownership**: Middleware verifies that the authenticated user belongs to the organization owning the resource.
- **RBAC**: Role-Based Access Control (Admin, Member, Viewer) enforced at the route level.

## 3. Injection Prevention (A03)
- **Input Sanitization**: Global middleware scans and blocks NoSQL injection, Command injection, and Path Traversal patterns.
- **Type Safety**: Zod schema validation for all request bodies and parameters.

## 4. Cryptography (A02)
- **Encryption**: Upgraded to **AES-256-GCM** for authenticated encryption of sensitive data (Provider API Keys, etc.).
- **Key Management**: Keys are generated and stored securely in the `storage/keys` directory (should be mounted as a volume).

## 5. Proactive Defense (A09)
- **Honeypots**: Hidden paths flagged to catch automated scanners.
- **IP Blocklist**: Automated 24-hour IP blocking via Redis for high-severity security violations.
- **Security Audit**: Automatic configuration validator runs at server startup to ensure production-safe settings.

## 6. Audit Logging
- All security-sensitive actions (logins, password changes, key deletions) are recorded in the `audit_logs` table.
