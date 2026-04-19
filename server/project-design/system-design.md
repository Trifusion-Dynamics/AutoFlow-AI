# System Architecture Design

## High-Level Architecture

```text
Client Layer
    (Web App, Mobile App, External Systems)
                    |
                    | HTTPS
                    v
              API Gateway Layer
         Express.js  |  Helmet  |  CORS  |  Rate Limiter
                    |
        -------------------------------
        |             |             |
        v             v             v
   Auth Service  Workflow Service  Webhook Receiver
        |             |             |
        v             v             v
        -------------------------------
                    |
                    v
              BullMQ Job Queue
          (Redis-backed, persistent)
                    |
                    v
            Agent Execution Engine
                    |
    -------------------------------
    |               |               |
    v               v               v
 PostgreSQL        Redis            S3
 (Main DB)      (Cache + Queue)  (Files + Outputs)
```

## Request Lifecycle

1. Request arrives
2. Helmet (security headers set)
3. CORS check
4. Rate Limiter check (Redis count)
5. JWT Auth Middleware (token verify)
6. RBAC Middleware (permission check)
7. Request Validation (Zod schema)
8. Controller -> Service -> Repository
9. Response (standard format)

## Standard API Response Format

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

## MVP Flow Diagram

```text
Client Request
     |
     v
[API Gateway] --- Auth Middleware --- Rate Limiter
     |
     v
[Workflow Controller]
     |
     |-- GET /workflows        -> List all workflows
     |-- POST /workflows       -> Create workflow
     |-- POST /workflows/:id/run -> Manual trigger
     |
     v
[Workflow Service]
     |
     |-- Validate workflow config
     |-- Push job to BullMQ
     |
     v
[BullMQ Queue: agent-jobs]
     |
     v
[Agent Processor]
     |
     |-- Load workflow steps
     |-- Call Claude API with tools
     |-- Execute tool calls
     |-- Loop until task done
     |
     v
[Execution Log] -> Save to DB -> Return result
```

## Core Components

### API Gateway Layer
- **Express.js**: Web framework
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiter**: Request throttling

### Authentication Service
- JWT token management
- User authentication
- Role-based access control

### Workflow Service
- Workflow CRUD operations
- Trigger management
- Execution orchestration

### Agent Execution Engine
- Claude API integration
- Tool calling loop
- AI decision making

### Queue System
- BullMQ for job processing
- Redis for persistence
- Retry mechanisms

## Security Architecture

### Authentication Flow
1. **Register**: Validate input -> Hash password -> Create user + org -> Send verification
2. **Login**: Find user -> Compare password -> Generate tokens -> Store refresh token
3. **Refresh**: Verify token -> Check hash -> Rotate tokens -> Return new pair
4. **Protected Route**: Extract token -> Verify JWT -> Check blacklist -> Load user -> Check RBAC

### Security Layers
- **Input Validation**: Zod schemas on all inputs
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: HTML sanitization
- **Rate Limiting**: Per IP and per user limits
- **Security Headers**: Helmet middleware
- **Token Blacklisting**: Redis-based token revocation

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- Redis shared cache/queue
- Database connection pooling
- Load balancer ready

### Performance Optimization
- Redis caching for frequent data
- Database indexing strategy
- Queue job prioritization
- Connection pooling

## Monitoring & Observability

### Logging
- Winston structured logging
- Request/response logging
- Error tracking
- Performance metrics

### Monitoring
- Queue health monitoring
- Database performance
- API response times
- Error rates

## Deployment Architecture

### Container Strategy
- Docker containers
- Docker Compose for development
- Kubernetes ready for production
- Environment-specific configs

### Infrastructure Components
- Application servers
- PostgreSQL database
- Redis cache/queue
- File storage (S3)
- Load balancer
