# Database Design

## PostgreSQL Schema

### Table: `organizations`

```sql
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,    -- URL-friendly name
  plan          VARCHAR(50) DEFAULT 'free',      -- free | starter | pro | enterprise
  token_quota   INTEGER DEFAULT 100000,          -- Monthly AI token limit
  token_used    INTEGER DEFAULT 0,
  settings      JSONB DEFAULT '{}',              -- Org-level settings
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `users`

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(50) DEFAULT 'member',   -- owner | admin | member | viewer
  is_verified     BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
```

### Table: `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(255) UNIQUE NOT NULL,    -- Hashed token (never store plain)
  expires_at    TIMESTAMPTZ NOT NULL,
  is_revoked    BOOLEAN DEFAULT false,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

### Table: `workflows`

```sql
CREATE TABLE workflows (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by       UUID NOT NULL REFERENCES users(id),
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  status           VARCHAR(50) DEFAULT 'draft',   -- draft | active | paused | archived
  trigger_type     VARCHAR(50) NOT NULL,           -- webhook | cron | manual
  trigger_config   JSONB DEFAULT '{}',            -- cron schedule, webhook secret, etc.
  steps            JSONB NOT NULL DEFAULT '[]',   -- Array of step definitions
  agent_instruction TEXT,                          -- System prompt for AI agent
  variables        JSONB DEFAULT '{}',            -- User-defined variables
  timeout_seconds  INTEGER DEFAULT 300,           -- Max execution time
  max_retries      INTEGER DEFAULT 3,
  webhook_secret   VARCHAR(255),                  -- For webhook trigger auth
  last_run_at      TIMESTAMPTZ,
  run_count        INTEGER DEFAULT 0,
  success_count    INTEGER DEFAULT 0,
  fail_count       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflows_org_id ON workflows(org_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_trigger_type ON workflows(trigger_type);
```

**`steps` JSONB structure:**
```json
[
  {
    "id": "step_1",
    "name": "Send Email",
    "tool": "send_email",
    "config": {
      "to": "{{trigger.data.email}}",
      "subject": "Welcome {{trigger.data.name}}",
      "body": "{{ai.generated}}"
    },
    "condition": "{{trigger.data.plan}} === 'pro'",
    "on_error": "continue"
  }
]
```

### Table: `executions`

```sql
CREATE TABLE executions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id),
  triggered_by    VARCHAR(50) NOT NULL,           -- webhook | cron | manual | user
  trigger_data    JSONB DEFAULT '{}',             -- Input data that triggered this
  status          VARCHAR(50) DEFAULT 'pending',  -- pending | running | success | failed | timeout
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  duration_ms     INTEGER,
  tokens_used     INTEGER DEFAULT 0,              -- AI tokens consumed
  error_message   TEXT,
  output          JSONB DEFAULT '{}',             -- Final output of execution
  retry_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX idx_executions_org_id ON executions(org_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_created_at ON executions(created_at DESC);
```

### Table: `execution_steps`

```sql
CREATE TABLE execution_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id    UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  step_id         VARCHAR(100) NOT NULL,          -- Matches workflow step id
  step_name       VARCHAR(255),
  tool_name       VARCHAR(100),
  status          VARCHAR(50) DEFAULT 'pending',  -- pending | running | success | failed | skipped
  input           JSONB DEFAULT '{}',             -- Tool input
  output          JSONB DEFAULT '{}',             -- Tool output
  error           TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_execution_steps_execution_id ON execution_steps(execution_id);
```

### Table: `agent_messages`

```sql
-- Agent ke saare AI messages - full conversation history
CREATE TABLE agent_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id    UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  role            VARCHAR(50) NOT NULL,           -- system | user | assistant | tool
  content         TEXT NOT NULL,                  -- Message content
  tool_name       VARCHAR(100),                   -- Tool name (if role = tool)
  tool_input      JSONB,                          -- Tool call input
  tool_output     JSONB,                          -- Tool call output
  tokens_in       INTEGER DEFAULT 0,
  tokens_out      INTEGER DEFAULT 0,
  sequence        INTEGER NOT NULL,               -- Message order
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_messages_execution_id ON agent_messages(execution_id);
```

### Table: `api_keys`

```sql
CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES users(id),
  name          VARCHAR(255) NOT NULL,
  key_hash      VARCHAR(255) UNIQUE NOT NULL,    -- Hashed key
  key_prefix    VARCHAR(20) NOT NULL,            -- First 8 chars for display: "ak_live_..."
  permissions   JSONB DEFAULT '["read","write"]',
  last_used_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `audit_logs`

```sql
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id),
  user_id       UUID REFERENCES users(id),
  action        VARCHAR(100) NOT NULL,           -- workflow.created | user.login | etc.
  resource_type VARCHAR(100),                    -- workflow | user | execution
  resource_id   UUID,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### Table: `tool_configs`

```sql
-- Org ki tool integrations (API keys, credentials)
CREATE TABLE tool_configs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tool_name     VARCHAR(100) NOT NULL,           -- gmail | slack | notion | etc.
  config        JSONB NOT NULL,                  -- Encrypted credentials
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, tool_name)
);
```

## Redis Data Structures

```text
# Rate Limiting
rate_limit:{userId}:{endpoint}     -> Counter (TTL: 60s)
rate_limit:ip:{ip}                 -> Counter (TTL: 60s)

# Session / Token Blacklist
token_blacklist:{jti}              -> "1" (TTL: token expiry)

# Cron Job State
cron:workflow:{workflowId}:last_run -> timestamp

# Execution Cache (real-time status)
execution:{executionId}:status     -> "running" (TTL: 1hr)
execution:{executionId}:progress   -> JSON (TTL: 1hr)

# Org Token Usage (fast counter)
org:{orgId}:tokens:{month}         -> Integer

# BullMQ Queues
bull:agent-jobs:{...}
bull:email-jobs:{...}
bull:cron-jobs:{...}
```

## Database Optimization

### Indexing Strategy
- **Primary Keys**: UUID with default gen_random_uuid()
- **Foreign Keys**: All foreign keys indexed
- **Query Patterns**: 
  - Workflow lookups by org_id and status
  - Executions by workflow_id and created_at
  - Users by org_id and email
- **JSONB**: GIN indexes on frequently queried JSON fields

### Connection Pooling
- **Pool Size**: 20 connections (adjustable)
- **Timeout**: 30 seconds
- **Retry Logic**: Exponential backoff

### Data Retention
- **Executions**: Keep 90 days, then archive
- **Agent Messages**: Keep 30 days for active executions
- **Audit Logs**: Keep 1 year for compliance
- **Refresh Tokens**: Auto-expire, clean up revoked tokens

### Backup Strategy
- **Daily Backups**: Full database backup
- **Point-in-Time Recovery**: WAL logs
- **Cross-region Replication**: For disaster recovery
- **Testing**: Regular restore testing

## Security Considerations

### Data Encryption
- **At Rest**: PostgreSQL encryption
- **In Transit**: TLS 1.3
- **Sensitive Fields**: Tool configs encrypted with app key

### Access Control
- **Database Users**: Separate read/write users
- **Connection Security**: IP whitelisting
- **Audit Trail**: All DML operations logged

### Compliance
- **GDPR**: Right to deletion, data portability
- **SOC2**: Access controls, audit logging
- **Data Residency**: Region-specific storage
