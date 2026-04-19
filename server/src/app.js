import express from 'express';
import { createServer } from 'http';
import { initSocket } from './realtime/socket.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.util.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { requestLogger } from './middlewares/requestLogger.middleware.js';
import { sanitizeInput } from './middlewares/sanitize.middleware.js';
import { createAdvancedCors } from './middlewares/corsAdvanced.middleware.js';
import { requestSizeLimit } from './middlewares/requestSize.middleware.js';
import { routes } from './routes/index.js';
import { redisClient } from './config/redis.js';
import { cronScheduler } from './cron/cronScheduler.js';
import { jobScheduler } from './jobs/jobScheduler.js';
import { prisma, connectDB, disconnectDB } from './config/db.js';
import { API_VERSION } from './config/constants.js';
import { buildOpenAPISpec, getDocsHTML } from './docs/openapi.js';
import { securityMiddleware } from './middlewares/security.middleware.js';
import { compressionMiddleware } from './middlewares/compression.middleware.js';
import { dynamicRateLimiter } from './middlewares/dynamicRateLimiter.middleware.js';
import yaml from 'js-yaml';

// Create Express app
const app = express();

/**
 * ═══════════════════════════════════════════════════════
 * MIDDLEWARE PIPELINE (Order is critical)
 * ═══════════════════════════════════════════════════════
 */

// 1. Foundation: Logging & Tracing
app.use(requestLogger);

// 1.1 Error Monitoring & Stability
import { monitorErrorRate, handleErrorAggregation } from './middlewares/errorRate.middleware.js';
app.use(monitorErrorRate);

// 2. Security: Helmet & Honeypots
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.honeypot);
app.use(securityMiddleware.detectAttacks);
app.use(securityMiddleware.checkFlaggedIP);


// 3. Performance: Compression
if (env.COMPRESSION_ENABLED) {
  app.use(compressionMiddleware);
}

// 4. Request Handling
app.use(createAdvancedCors());
app.use(express.json({ limit: env.MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true, limit: env.MAX_REQUEST_SIZE }));
app.use(sanitizeInput);

// 5. Rate Limiting (Dynamic per-tier)
app.use('/api', dynamicRateLimiter);

/**
 * ═══════════════════════════════════════════════════════
 * GLOBAL MONITORING & HEALTH
 * ═══════════════════════════════════════════════════════
 */
import { monitoringController } from './modules/monitoring/monitoring.controller.js';
import { authenticate, authorize } from './middlewares/auth.middleware.js';

app.get('/health', (req, res) => monitoringController.getHealth(req, res));
app.get('/health/ready', (req, res) => monitoringController.getReadiness(req, res));
app.get('/health/live', (req, res) => monitoringController.getLiveness(req, res));
app.get('/metrics', authenticate, authorize(['admin']), (req, res) => monitoringController.getMetrics(req, res));

/**
 * ═══════════════════════════════════════════════════════
 * DEVELOPMENT ONLY ROUTES
 * ═══════════════════════════════════════════════════════
 */
if (env.NODE_ENV === 'development') {
  const { securityTestRoutes } = await import('./modules/security-test/securityTest.routes.js');
  app.use('/api/v1/dev/security', securityTestRoutes);
  logger.info('🛠️ Security Test routes mounted at /api/v1/dev/security');
}


/**
 * ═══════════════════════════════════════════════════════
 * API v1 ROUTES
 * ═══════════════════════════════════════════════════════
 */

// Documentation
app.get('/api/v1/docs', (req, res) => res.send(getDocsHTML()));
app.get('/api/v1/docs/json', (req, res) => res.json(buildOpenAPISpec()));
app.get('/api/v1/docs/yaml', (req, res) => {
  const spec = buildOpenAPISpec();
  res.set('Content-Type', 'text/yaml');
  res.send(yaml.dump(spec, { lineWidth: -1 }));
});

// Main API Routes
app.use('/api/v1', routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Path ${req.originalUrl} not found`
    }
  });
});

// Global error handler (aggregator first)
app.use(handleErrorAggregation);
app.use(errorHandler);

/**
 * ═══════════════════════════════════════════════════════
 * SERVER LIFECYCLE (Startup / Shutdown)
 * ═══════════════════════════════════════════════════════
 */

async function startServer() {
  logger.info(`Starting AutoFlow AI in ${env.NODE_ENV} mode...`);

  try {
    // 0. Security Audit
    const { runSecurityAudit } = await import('./utils/configAudit.js');
    await runSecurityAudit();

    // 1. Database
    await connectDB();

    // 2. Redis
    try {
      await redisClient.connect();
      logger.info('Redis connected');
    } catch (error) {
      logger.warn('Redis connection failed, continuing in degraded mode');
    }

    // 3. Background Services
    jobScheduler.registerDefaultJobs();
    jobScheduler.startAll();
    await cronScheduler.loadAllCronWorkflows();
    
    // 4. Server Initialization
    const server = createServer(app);
    initSocket(server);

    server.listen(env.PORT, () => {
      logger.info('═══════════════════════════════════════════════════════');
      logger.info(`🚀 AutoFlow AI Engine v1.0.0 Started`);
      logger.info(`📍 Environment: ${env.NODE_ENV}`);
      logger.info(`🔌 Port: ${env.PORT}`);
      logger.info(`📡 API v1: /api/v1`);
      logger.info(`📅 Cron Jobs Status: ${cronScheduler.getActiveJobsCount()} active`);
      logger.info('═══════════════════════════════════════════════════════');
    });

    /**
     * Graceful Shutdown Sequence
     */
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Preparing for graceful shutdown...`);
      
      // 1. Stop accepting new connections
      server.close(() => {
        logger.info('HTTP server stopped.');
      });

      // 2. Stop jobs & cron
      jobScheduler.stopAll();
      cronScheduler.stopAll();

      // 3. Wait for active executions (Max 30s)
      let waitSeconds = 0;
      while (waitSeconds < 30) {
        const activeCount = await prisma.execution.count({ where: { status: 'running' } });
        if (activeCount === 0) break;
        logger.info(`Waiting for ${activeCount} active executions to finish...`);
        await new Promise(r => setTimeout(r, 2000));
        waitSeconds += 2;
      }

      // 4. Disconnect storage
      await disconnectDB();
      try { await redisClient.disconnect(); } catch (e) {}

      logger.info('Graceful shutdown complete. Goodbye.');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('CRITICAL: Server failed to start:', error);
    process.exit(1);
  }
}

// Start if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('app.js')) {
  startServer();
}

export { app, startServer };
