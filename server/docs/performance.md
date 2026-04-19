# Performance & Benchmarking

Quality of service (QoS) targets and optimization strategies.

## 1. Performance Targets
| Flow | Concurrency | p95 Latency Target |
|------|-------------|--------------------|
| Auth (Register/Login) | 100 | < 200ms |
| Workflow Management | 50 | < 500ms |
| Agent Executions | 20 | Queue lat < 100ms |

## 2. Optimizations Implemented
- **Database Indexing**: Composite indexes on `orgId`, `status`, and `createdAt` for fast filtering and sorting.
- **Single-Query Counting**: Use of `COUNT(*) OVER()` in raw SQL for paginated results to avoid double database round-trips.
- **Caching**: 
    - ETag support for all GET requests.
    - Global Redis cache for frequently accessed resources.
    - Public CDN headers for static templates.
- **Resource Management**: 
    - Gzip/Brotli compression for responses.
    - Request size limits (1MB default).

## 3. Load Testing
To run load tests (Development environment):
```bash
# Auth Test
node tests/load/load-test-auth.js

# Workflows Test
node tests/load/load-test-workflows.js

# Executions Test
node tests/load/load-test-executions.js
```
Note: Ensure `APP_URL` is set to your local dev server.
