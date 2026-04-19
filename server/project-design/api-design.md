# API Design

## Authentication Endpoints

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "orgName": "Acme Corp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "owner",
      "orgId": "uuid"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "owner",
      "orgId": "uuid"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "newPassword": "newSecurePassword123"
}
```

## Workflow Endpoints

### List Workflows
```http
GET /api/workflows?page=1&limit=10&status=active
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "id": "uuid",
        "name": "Lead Follow-up",
        "description": "Auto follow-up on new leads",
        "status": "active",
        "triggerType": "webhook",
        "runCount": 45,
        "successCount": 42,
        "failCount": 3,
        "lastRunAt": "2025-01-15T10:30:00Z",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

### Create Workflow
```http
POST /api/workflows
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Lead Follow-up",
  "description": "Auto follow-up on new leads",
  "trigger": {
    "type": "webhook",
    "config": {}
  },
  "steps": [
    {
      "id": "step_1",
      "name": "Send Welcome Email",
      "tool": "send_email",
      "config": {
        "to": "{{trigger.data.email}}",
        "subject": "Welcome!",
        "body": "AI generate karega"
      }
    }
  ],
  "agentInstruction": "New lead aaya hai. Unhe warm welcome email bhejo aur CRM mein entry karo."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Lead Follow-up",
    "description": "Auto follow-up on new leads",
    "status": "draft",
    "triggerType": "webhook",
    "triggerConfig": {},
    "steps": [...],
    "agentInstruction": "...",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### Get Workflow
```http
GET /api/workflows/:id
Authorization: Bearer <access_token>
```

### Update Workflow
```http
PUT /api/workflows/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Workflow Name",
  "description": "Updated description",
  "status": "active"
}
```

### Delete Workflow
```http
DELETE /api/workflows/:id
Authorization: Bearer <access_token>
```

### Run Workflow (Manual Trigger)
```http
POST /api/workflows/:id/run
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "input": {
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "status": "queued",
    "message": "Workflow execution queued successfully"
  }
}
```

### Get Workflow Executions
```http
GET /api/workflows/:id/executions?page=1&limit=10
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executions": [
      {
        "id": "uuid",
        "status": "success",
        "triggeredBy": "manual",
        "startedAt": "2025-01-15T10:30:00Z",
        "completedAt": "2025-01-15T10:32:15Z",
        "durationMs": 135000,
        "tokensUsed": 1250,
        "output": {
          "emailSent": true,
          "crmEntry": "success"
        }
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

### Get Execution Details
```http
GET /api/workflows/:id/executions/:execId
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workflowId": "uuid",
    "status": "success",
    "triggeredBy": "manual",
    "triggerData": {...},
    "startedAt": "2025-01-15T10:30:00Z",
    "completedAt": "2025-01-15T10:32:15Z",
    "durationMs": 135000,
    "tokensUsed": 1250,
    "output": {...},
    "steps": [
      {
        "id": "step_1",
        "name": "Send Welcome Email",
        "tool": "send_email",
        "status": "success",
        "input": {...},
        "output": {...},
        "durationMs": 5000
      }
    ],
    "messages": [
      {
        "role": "system",
        "content": "You are an automation agent...",
        "tokensIn": 0,
        "tokensOut": 0
      },
      {
        "role": "user",
        "content": "New lead received...",
        "tokensIn": 150,
        "tokensOut": 0
      }
    ]
  }
}
```

## Webhook Endpoint (Public)

### Trigger Workflow via Webhook
```http
POST /api/webhooks/:workflowId
X-Webhook-Secret: <webhook_secret>
Content-Type: application/json

{
  "email": "newlead@example.com",
  "name": "Sarah Johnson",
  "company": "Tech Corp",
  "plan": "pro"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "status": "queued",
    "message": "Webhook received and workflow queued"
  }
}
```

## User Management Endpoints

### Get Current User
```http
GET /api/users/me
Authorization: Bearer <access_token>
```

### Update User Profile
```http
PUT /api/users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Name"
}
```

### Change Password
```http
PUT /api/users/me/password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword123"
}
```

## Organization Management

### Get Organization
```http
GET /api/organizations
Authorization: Bearer <access_token>
```

### Update Organization
```http
PUT /api/organizations
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Org Name",
  "settings": {
    "timezone": "Asia/Kolkata",
    "defaultTimeout": 300
  }
}
```

### List Organization Members
```http
GET /api/organizations/members
Authorization: Bearer <access_token>
```

### Invite Member
```http
POST /api/organizations/members
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "newmember@example.com",
  "role": "admin"
}
```

### Update Member Role
```http
PUT /api/organizations/members/:userId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role": "member"
}
```

### Remove Member
```http
DELETE /api/organizations/members/:userId
Authorization: Bearer <access_token>
```

## API Key Management

### List API Keys
```http
GET /api/api-keys
Authorization: Bearer <access_token>
```

### Create API Key
```http
POST /api/api-keys
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Production API Key",
  "permissions": ["read", "write"],
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Production API Key",
    "keyPrefix": "ak_live_abc12345",
    "permissions": ["read", "write"],
    "expiresAt": "2025-12-31T23:59:59Z",
    "createdAt": "2025-01-15T10:30:00Z",
    "key": "ak_live_abc12345..." // Only shown once
  }
}
```

### Revoke API Key
```http
DELETE /api/api-keys/:id
Authorization: Bearer <access_token>
```

## Tool Configuration

### List Tool Configurations
```http
GET /api/tools/configs
Authorization: Bearer <access_token>
```

### Update Tool Configuration
```http
PUT /api/tools/configs/:toolName
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "config": {
    "apiKey": "encrypted_api_key",
    "webhookUrl": "https://hooks.slack.com/...",
    "channel": "#general"
  },
  "isActive": true
}
```

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      {
        "field": "email",
        "message": "Email field is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/*` | 10 req/min | Per IP |
| `/api/webhooks/*` | 100 req/min | Per IP |
| `/api/*` | 200 req/min | Per user |

## API Authentication

### Bearer Token
```http
Authorization: Bearer <access_token>
```

### API Key
```http
Authorization: Bearer <api_key>
```

### Webhook Secret
```http
X-Webhook-Secret: <webhook_secret>
```

## Request/Response Headers

### Standard Headers
```http
Content-Type: application/json
X-Request-ID: req_abc123
X-API-Version: v1
```

### CORS Headers
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Webhook-Secret
```

## Pagination

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field
- `order`: Sort order (asc|desc, default: desc)

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```
