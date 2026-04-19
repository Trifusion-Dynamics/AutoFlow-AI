# AI-Powered Business Automation Platform
## Complete System Design & Prototype Document

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Prototype Plan (MVP)](#2-prototype-plan-mvp)
3. [System Architecture](#3-system-architecture)
4. [API Design](#4-api-design)
5. [Database Design](#5-database-design)
6. [AI Agent Engine Design](#6-ai-agent-engine-design)
7. [Queue & Job System](#7-queue--job-system)
8. [Security Design](#8-security-design)
9. [Folder Structure](#9-folder-structure)
10. [Tech Stack](#10-tech-stack)
11. [Environment Variables](#11-environment-variables)
12. [Development Roadmap](#12-development-roadmap)

---

## 1. Project Overview

**Product Name:** AutoFlow AI  
**Type:** SaaS Backend Platform  
**Purpose:** Clients apne business workflows ko AI agents se automate kar sakein — bina code likhe.

### Core Value Proposition

- Business processes (emails, CRM, documents) automatically handle ho
- AI agents khud decide karein kaunsa tool use karna hai
- Multi-tenant architecture — ek platform, multiple clients
- Full audit trail — har agent action logged aur traceable

### Real-World Use Cases

| Use Case | Trigger | Action |
|---|---|---|
| Lead Management | Form submission webhook | CRM entry + follow-up email schedule |
| Email Automation | New email received | Categorize + draft reply + assign to agent |
| Document Processing | File upload | AI extract + summarize + save to DB |
| Report Generation | Cron (daily/weekly) | Pull data + generate PDF + send email |
| Customer Support | Support ticket created | AI reply draft + priority assign + Slack notify |

---

## 2. Prototype Plan (MVP)

### MVP Scope (Week 1–3)

Prototype mein sirf yeh features honge — baaki baad mein:

```
MVP Features:
├── Auth System (JWT + Refresh Token)
├── User & Organization management
├── Workflow CRUD (create, read, update, delete)
├── 3 Trigger Types (webhook, cron, manual)
├── 3 Agent Tools (email send, HTTP call, DB write)
├── Agent Execution Engine (basic loop)
├── Job Queue (BullMQ)
├── Execution Logs
└── Basic API documentation
```

### MVP Flow Diagram

```
Client Request
     │
     ▼
[API Gateway] ──── Auth Middleware ──── Rate Limiter
     │
     ▼
[Workflow Controller]
     │
     ├── GET /workflows        → List all workflows
     ├── POST /workflows       → Create workflow
     ├── POST /workflows/:id/run → Manual trigger
     │
     ▼
[Workflow Service]
     │
     ├── Validate workflow config
     ├── Push job to BullMQ
     │
     ▼
[BullMQ Queue: agent-jobs]
     │
     ▼
[Agent Processor]
     │
     ├── Load workflow steps
     ├── Call Claude API with tools
     ├── Execute tool calls
     ├── Loop until task done
     │
     ▼
[Execution Log] → Save to DB → Return result
```

### Prototype API Endpoints (MVP)

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/workflows
POST   /api/workflows
GET    /api/workflows/:id
PUT    /api/workflows/:id
DELETE /api/workflows/:id
POST   /api/workflows/:id/run
GET    /api/workflows/:id/logs

POST   /api/webhooks/:workflowId   (public, no auth)
```

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS / USERS                          │
│              (Web App, Mobile App, External Systems)            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│         Express.js  |  Helmet  |  CORS  |  Rate Limiter         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌──────────────┐
        │  Auth    │ │Workflow  │ │  Webhook     │
        │ Service  │ │ Service  │ │  Receiver    │
        └──────────┘ └────┬─────┘ └──────┬───────┘
                          │              │
                          ▼              ▼
              ┌─────────────────────────────────┐
              │       BullMQ Job Queue          │
              │  (Redis-backed, persistent)     │
              └──────────────┬──────────────────┘
                             │
                             ▼
              ┌─────────────────────────────────┐
              │      Agent Execution Engine     │
              │                                 │
              │  ┌──────────────────────────┐   │
              │  │    Claude API (AI Core)  │   │
              │  │   Tool Calling Loop      │   │
              │  └──────────────────────────┘   │
              │                                 │
              │  Tools Available:               │
              │  • send_email                   │
              │  • http_request                 │
              │  • db_query                     │
              │  • send_slack_message           │
              │  • generate_pdf                 │
              │  • scrape_webpage               │
              └──────────────┬──────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │PostgreSQL│  │  Redis   │  │   S3     │
        │(Main DB) │  │(Cache +  │  │(Files +  │
        │          │  │ Queue)   │  │ Outputs) │
        └──────────┘  └──────────┘  └──────────┘
```

### Request Lifecycle

```
1. Request aata hai
      ↓
2. Helmet (security headers set)
      ↓
3. CORS check
      ↓
4. Rate Limiter check (Redis se count)
      ↓
5. JWT Auth Middleware (token verify)
      ↓
6. RBAC Middleware (permission check)
      ↓
7. Request Validation (Zod schema)
      ↓
8. Controller → Service → Repository
      ↓
9. Response (standard format)
```

### Standard API Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}

// Error format
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [ ... ]
  }
}
```

---

## 4. API Design

### Authentication Endpoints

```
POST /api/auth/register
Body: { name, email, password, orgName }
Response: { user, tokens }

POST /api/auth/login
Body: { email, password }
Response: { user, accessToken, refreshToken }

POST /api/auth/refresh
Body: { refreshToken }
Response: { accessToken, refreshToken }

POST /api/auth/logout
Header: Authorization: Bearer <token>
Body: { refreshToken }
Response: { message: "Logged out" }

POST /api/auth/forgot-password
Body: { email }
Response: { message: "Reset email sent" }

POST /api/auth/reset-password
Body: { token, newPassword }
Response: { message: "Password updated" }
```

### Workflow Endpoints

```
GET    /api/workflows
Query: ?page=1&limit=10&status=active
Response: { workflows: [...], pagination: { total, page, limit } }

POST   /api/workflows
Body: {
  name: "Lead Follow-up",
  description: "Auto follow-up on new leads",
  trigger: {
    type: "webhook",         // webhook | cron | manual
    config: {}               // cron: { schedule: "0 9 * * *" }
  },
  steps: [
    {
      id: "step_1",
      name: "Send Welcome Email",
      tool: "send_email",
      config: {
        to: "{{trigger.data.email}}",
        subject: "Welcome!",
        body: "AI generate karega"
      }
    }
  ],
  agentInstruction: "New lead aaya hai. Unhe warm welcome email bhejo aur CRM mein entry karo."
}

GET    /api/workflows/:id
PUT    /api/workflows/:id
DELETE /api/workflows/:id

POST   /api/workflows/:id/run
Body: { input: { ... } }           // manual trigger ke liye input data
Response: { executionId, status: "queued" }

GET    /api/workflows/:id/executions
GET    /api/workflows/:id/executions/:execId
```

### Webhook Endpoint (Public)

```
POST   /api/webhooks/:workflowId
Header: X-Webhook-Secret: <secret>
Body: { ...any data... }

// Ye endpoint public hai, workflow trigger karta hai
// Secret verify karke workflow queue mein push karta hai
```

---

## 5. Database Design

### PostgreSQL Schema

---

#### Table: `organizations`

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

---

#### Table: `users`

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

---

#### Table: `refresh_tokens`

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

---

#### Table: `workflows`

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

---

#### Table: `executions`

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

---

#### Table: `execution_steps`

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

---

#### Table: `agent_messages`

```sql
-- Agent ke saare AI messages — full conversation history
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

---

#### Table: `api_keys`

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

---

#### Table: `audit_logs`

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

---

#### Table: `tool_configs`

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

---

### Redis Data Structures

```
# Rate Limiting
rate_limit:{userId}:{endpoint}     → Counter (TTL: 60s)
rate_limit:ip:{ip}                 → Counter (TTL: 60s)

# Session / Token Blacklist
token_blacklist:{jti}              → "1" (TTL: token expiry)

# Cron Job State
cron:workflow:{workflowId}:last_run → timestamp

# Execution Cache (real-time status)
execution:{executionId}:status     → "running" (TTL: 1hr)
execution:{executionId}:progress   → JSON (TTL: 1hr)

# Org Token Usage (fast counter)
org:{orgId}:tokens:{month}         → Integer

# BullMQ Queues
bull:agent-jobs:{...}
bull:email-jobs:{...}
bull:cron-jobs:{...}
```

---

## 6. AI Agent Engine Design

### Agent Loop Flow

```
Agent Engine Start
      │
      ▼
1. Load workflow config + agent instruction
      │
      ▼
2. Build messages array:
   [system_prompt, user_message_with_trigger_data]
      │
      ▼
3. Call Claude API with tools defined
      │
      ▼
4. Response check:
   ├── stop_reason = "end_turn"  → DONE, save output
   └── stop_reason = "tool_use" → Execute tools
            │
            ▼
      5. Execute each tool call:
         ├── Validate tool inputs
         ├── Call actual tool function
         ├── Capture output / error
         │
         ▼
      6. Add tool results to messages
         │
         ▼
      7. Loop back to step 3
            │
      (Max 10 iterations ya timeout pe force stop)
```

### Agent System Prompt Template

```
You are an automation agent for {orgName}.

Your task: {agentInstruction}

Trigger data: {JSON.stringify(triggerData)}

Available tools: {toolDescriptions}

Rules:
- Use tools to complete the task
- If unsure, do the safest action
- Log important decisions
- Stop when task is complete
- Never expose sensitive credentials
```

### Tool Definitions (Claude API Format)

```javascript
const tools = [
  {
    name: "send_email",
    description: "Send an email to a recipient",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body (HTML supported)" },
        cc: { type: "array", items: { type: "string" } }
      },
      required: ["to", "subject", "body"]
    }
  },
  {
    name: "http_request",
    description: "Make an HTTP request to an external API",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string" },
        method: { type: "string", enum: ["GET","POST","PUT","DELETE","PATCH"] },
        headers: { type: "object" },
        body: { type: "object" }
      },
      required: ["url", "method"]
    }
  },
  {
    name: "db_insert",
    description: "Insert data into a workflow's output table",
    input_schema: {
      type: "object",
      properties: {
        table: { type: "string" },
        data: { type: "object" }
      },
      required: ["table", "data"]
    }
  },
  {
    name: "send_slack_message",
    description: "Send a message to a Slack channel",
    input_schema: {
      type: "object",
      properties: {
        channel: { type: "string" },
        message: { type: "string" }
      },
      required: ["channel", "message"]
    }
  }
]
```

---

## 7. Queue & Job System

### BullMQ Queues

```
Queues:
├── agent-jobs          → Workflow executions (heavy, AI calls)
├── email-jobs          → Email sending (fast)
├── cron-scheduler      → Cron workflow triggers
└── cleanup-jobs        → Old log cleanup, token reset

Queue Config:
- agent-jobs:
  concurrency: 5
  attempts: 3
  backoff: { type: 'exponential', delay: 5000 }
  timeout: 300000 (5 min)

- email-jobs:
  concurrency: 20
  attempts: 5
  backoff: { type: 'fixed', delay: 2000 }
```

### Job Data Structure

```javascript
// agent-jobs payload
{
  executionId: "uuid",
  workflowId: "uuid",
  orgId: "uuid",
  triggerData: { ...input data... },
  agentInstruction: "...",
  steps: [...],
  timeout: 300
}
```

---

## 8. Security Design

### Auth Flow

```
Register:
  1. Validate input (Zod)
  2. Check email unique
  3. Hash password (bcrypt, rounds: 12)
  4. Create user + org
  5. Send verification email
  6. Return tokens

Login:
  1. Find user by email
  2. Compare password hash
  3. Generate accessToken (JWT, 15min)
  4. Generate refreshToken (JWT, 7days)
  5. Store refresh token hash in DB
  6. Return both tokens

Refresh:
  1. Verify refresh token JWT
  2. Check hash in DB (not revoked)
  3. Rotate — revoke old, issue new pair
  4. Return new tokens

Protected Route:
  1. Extract Bearer token
  2. Verify JWT signature
  3. Check token not blacklisted (Redis)
  4. Load user from DB
  5. Check RBAC permission
  6. Attach user to req.user
```

### RBAC Permission Matrix

| Permission | Owner | Admin | Member | Viewer |
|---|---|---|---|---|
| Create workflow | ✅ | ✅ | ✅ | ❌ |
| Edit workflow | ✅ | ✅ | ✅ (own) | ❌ |
| Delete workflow | ✅ | ✅ | ❌ | ❌ |
| Run workflow | ✅ | ✅ | ✅ | ❌ |
| View executions | ✅ | ✅ | ✅ | ✅ |
| Manage members | ✅ | ✅ | ❌ | ❌ |
| Manage API keys | ✅ | ✅ | ❌ | ❌ |
| View billing | ✅ | ✅ | ❌ | ❌ |

### Security Middlewares

```javascript
// Rate limits
/api/auth/*           → 10 req/min per IP
/api/webhooks/*       → 100 req/min per IP
/api/*                → 200 req/min per user

// Headers (Helmet)
Content-Security-Policy
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security
X-XSS-Protection

// Input Sanitization
- Zod schema validation on all inputs
- SQL injection: Parameterized queries only (Prisma/pg)
- XSS: sanitize-html on any user HTML input
- File upload: type + size validation, virus scan
```

---

## 9. Folder Structure

```
autoflow-ai/
├── src/
│   ├── config/
│   │   ├── db.js                  # PostgreSQL connection
│   │   ├── redis.js               # Redis connection
│   │   ├── env.js                 # Zod-validated env vars
│   │   └── constants.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.schema.js     # Zod schemas
│   │   │
│   │   ├── users/
│   │   │   ├── users.routes.js
│   │   │   ├── users.controller.js
│   │   │   ├── users.service.js
│   │   │   └── users.repository.js
│   │   │
│   │   ├── workflows/
│   │   │   ├── workflows.routes.js
│   │   │   ├── workflows.controller.js
│   │   │   ├── workflows.service.js
│   │   │   ├── workflows.repository.js
│   │   │   └── workflows.schema.js
│   │   │
│   │   ├── executions/
│   │   │   ├── executions.routes.js
│   │   │   ├── executions.controller.js
│   │   │   └── executions.repository.js
│   │   │
│   │   └── webhooks/
│   │       ├── webhooks.routes.js
│   │       └── webhooks.controller.js
│   │
│   ├── agents/
│   │   ├── engine.js              # Core agent loop
│   │   ├── agent.service.js       # Agent orchestration
│   │   ├── tools/
│   │   │   ├── index.js           # Tool registry
│   │   │   ├── email.tool.js
│   │   │   ├── http.tool.js
│   │   │   ├── database.tool.js
│   │   │   ├── slack.tool.js
│   │   │   └── pdf.tool.js
│   │   └── prompts/
│   │       └── agent.prompt.js
│   │
│   ├── queues/
│   │   ├── agent.queue.js
│   │   ├── email.queue.js
│   │   ├── cron.queue.js
│   │   └── processors/
│   │       ├── agent.processor.js
│   │       └── email.processor.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT verify
│   │   ├── rbac.middleware.js      # Permission check
│   │   ├── rateLimiter.middleware.js
│   │   ├── validate.middleware.js  # Zod validation
│   │   ├── errorHandler.middleware.js
│   │   └── requestLogger.middleware.js
│   │
│   ├── utils/
│   │   ├── jwt.util.js
│   │   ├── crypto.util.js
│   │   ├── response.util.js       # Standard API response
│   │   ├── logger.util.js         # Winston logger
│   │   └── pagination.util.js
│   │
│   └── app.js                     # Express app setup
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   └── api.md
│
├── .env.example
├── .env
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 10. Tech Stack

| Category | Technology | Reason |
|---|---|---|
| Runtime | Node.js 20 LTS | Stable, async-friendly |
| Framework | Express.js | Lightweight, flexible |
| Language | JavaScript (ES2022+) | Fast dev, no compile step |
| Database | PostgreSQL 16 | Relational, JSONB support, reliable |
| Cache + Queue | Redis 7 | Fast, BullMQ backed, rate limiting |
| ORM | Prisma | Type-safe queries, migrations |
| AI | Anthropic Claude API | Best tool use / agent capability |
| Queue | BullMQ | Redis-backed, retries, monitoring |
| Auth | JWT (jose library) | Stateless, secure |
| Validation | Zod | Runtime type safety |
| Email | Nodemailer + SMTP / Resend | Simple, reliable |
| File Storage | AWS S3 / Cloudinary | Scalable |
| Logging | Winston + Morgan | Structured logs |
| Security | Helmet, express-rate-limit | Headers, rate limiting |
| Testing | Vitest + Supertest | Fast unit + integration |
| Container | Docker + Docker Compose | Easy dev + deploy |

---

## 11. Environment Variables

```env
# App
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/autoflow

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=app-password
EMAIL_FROM="AutoFlow AI <noreply@autoflow.ai>"

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
AWS_S3_BUCKET=autoflow-files

# Security
ENCRYPTION_KEY=32-char-key-for-encrypting-tool-credentials
WEBHOOK_TIMEOUT=30000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=200
```

---

## 12. Development Roadmap

### Phase 1 — Foundation (Week 1–2)
- [ ] Project setup, Docker, DB
- [ ] Auth system (register, login, refresh, logout)
- [ ] User + Organization CRUD
- [ ] Basic middleware (auth, error handler, logger)
- [ ] Workflow CRUD API

### Phase 2 — Agent Engine (Week 3–4)
- [ ] BullMQ queue setup
- [ ] Basic agent loop with Claude API
- [ ] Tool implementations (email, HTTP, DB)
- [ ] Execution logging
- [ ] Webhook trigger

### Phase 3 — Advanced Features (Week 5–6)
- [ ] Cron trigger (node-cron)
- [ ] RBAC system
- [ ] API keys
- [ ] Rate limiting per org
- [ ] Token usage tracking

### Phase 4 — Production Ready (Week 7–8)
- [ ] Unit + integration tests
- [ ] API documentation
- [ ] Docker production config
- [ ] Error monitoring (Sentry)
- [ ] Performance optimization
- [ ] Security audit

---

*Document version: 1.0 | Last updated: 2025*