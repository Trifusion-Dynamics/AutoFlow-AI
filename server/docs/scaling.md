# Horizontal Scaling Guide

AutoFlow AI is designed to be horizontally scalable and stateless.

## 1. Stateless Architecture
- **Sessions**: All session data is stored in Redis.
- **JWT**: Stateless authentication using RSA signatures.
- **File Storage**: In production, AWS S3 is mandatory. Local disk storage is only for development.

## 2. Multi-Instance Communication
- **WebSockets**: Integrated with `@socket.io/redis-adapter`. Messages emitted on one instance are broadcast across the entire cluster via Redis Pub/Sub.
- **Background Jobs**: Node-cron jobs use **Redis Distributed Locks** (SET NX) to ensure a job tick only runs on one instance at a time.
- **Real-time Events**: Redis Streams are used for durable execution logs, allowing clients to recover missed events after reconnection.

## 3. Database & Caching
- **Connection Pooling**: Prisma is configured for connection pooling (set `DATABASE_URL` with `?connection_limit=X`).
- **Read Replicas**: The repository layer is ready for read/write splitting (optional deployment configuration).
- **Caching**: Global Redis caching for templates, organization settings, and rate-limiting.

## 4. Deployment Requirements
- **Redis**: Required for scaling.
- **Shared Storage**: S3 for files.
- **Environment**: All instances must share the same `ENCRYPTION_KEY` and RSA Public/Private keys.
