import { prisma } from '../../config/db.js';
import { redisClient } from '../../config/redis.js';
import { logger } from '../../utils/logger.util.js';
import { env } from '../../config/env.js';
import os from 'os';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Monitoring Service
 * Handles health checks and metrics collection
 */
export class MonitoringService {
  constructor() {
    this.metrics = {
      httpRequestsTotal: new Map(),
      activeExecutions: 0,
      queuedExecutions: 0,
      tokensConsumedTotal: 0,
      agentIterationsTotal: 0,
      errorsTotal: new Map(),
      redisOpsTotal: 0,
    };
  }

  /**
   * Detailed health check of all dependencies
   */
  async getDetailedHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
      system: {
        memory: this._getMemoryUsage(),
        uptime: Math.floor(process.uptime()),
        loadAvg: os.loadavg(),
      }
    };

    // 1. Database Check
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = {
        status: 'connected',
        responseTime: `${Date.now() - start}ms`
      };
    } catch (error) {
      health.status = 'degraded';
      health.services.database = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // 2. Redis Check
    try {
      const start = Date.now();
      if (redisClient.isReady()) {
        await redisClient.getClient().ping();
        health.services.redis = {
          status: 'connected',
          responseTime: `${Date.now() - start}ms`
        };
      } else {
        throw new Error('Redis client not ready');
      }
    } catch (error) {
      health.status = 'degraded';
      health.services.redis = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // 3. Anthropic Reachability (DNS only as per spec)
    try {
      const start = Date.now();
      const dns = await import('dns/promises');
      await dns.resolve('api.anthropic.com');
      health.services.anthropic = {
        status: 'reachable',
        responseTimeMs: Date.now() - start
      };
    } catch (error) {
      health.services.anthropic = {
        status: 'unreachable',
        error: error.message
      };
    }

    // 4. Disk Space (Logs folder)
    try {
      const logsDir = join(process.cwd(), 'logs');
      const stats = await this._getDirSize(logsDir);
      health.services.storage = {
        logsDirSizeMb: (stats / (1024 * 1024)).toFixed(2),
        status: stats > 500 * 1024 * 1024 ? 'warning' : 'healthy' // Warn if > 500MB
      };
    } catch (error) {
      health.services.storage = { status: 'unknown', error: error.message };
    }

    // Final status logic
    const criticalServices = [health.services.database?.status, health.services.redis?.status];
    if (criticalServices.includes('unhealthy')) {
      health.status = 'unhealthy';
    }

    return health;
  }

  /**
   * Readiness probe for Kubernetes/Load Balancers
   */
  async getReadinessProbe() {
    try {
      const dbConnected = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
      const redisConnected = redisClient.isReady();
      
      if (dbConnected && redisConnected) {
        return { ready: true };
      }
      return { ready: false, db: dbConnected, redis: redisConnected };
    } catch (error) {
      return { ready: false, error: error.message };
    }
  }

  /**
   * Liveness probe
   */
  getLivenessProbe() {
    return { alive: true, timestamp: new Date().toISOString() };
  }

  /**
   * Prometheus-style plain text metrics
   */
  getMetrics() {
    let output = '# HELP http_requests_total Total number of HTTP requests\n# TYPE http_requests_total counter\n';
    
    for (const [key, value] of this.metrics.httpRequestsTotal) {
      const [method, route, status] = key.split('|');
      output += `http_requests_total{method="${method}",route="${route}",status="${status}"} ${value}\n`;
    }

    output += `\n# HELP active_executions_count Current active workflow executions\n# TYPE active_executions_count gauge\nactive_executions_count ${this.metrics.activeExecutions}\n`;
    
    output += `\n# HELP tokens_consumed_total Total tokens consumed across all AI calls\n# TYPE tokens_consumed_total counter\ntokens_consumed_total ${this.metrics.tokensConsumedTotal}\n`;

    output += `\n# HELP agent_iterations_total Total agent iterations performed\n# TYPE agent_iterations_total counter\nagent_iterations_total ${this.metrics.agentIterationsTotal}\n`;

    output += `\n# HELP errors_total Total errors by code\n# TYPE errors_total counter\n`;
    for (const [code, count] of this.metrics.errorsTotal) {
      output += `errors_total{code="${code}"} ${count}\n`;
    }

    return output;
  }

  /**
   * Utility to update metrics (called from middleware/other services)
   */
  incrementCounter(name, labels = {}) {
    if (name === 'http_requests_total') {
      const key = `${labels.method}|${labels.route}|${labels.status}`;
      this.metrics.httpRequestsTotal.set(key, (this.metrics.httpRequestsTotal.get(key) || 0) + 1);
    } else if (name === 'tokens_consumed') {
      this.metrics.tokensConsumedTotal += labels.amount || 0;
    } else if (name === 'agent_iterations') {
      this.metrics.agentIterationsTotal++;
    } else if (name === 'errors') {
      const key = labels.code || 'UNKNOWN';
      this.metrics.errorsTotal.set(key, (this.metrics.errorsTotal.get(key) || 0) + 1);
    }
  }

  updateGauge(name, value) {
    if (name === 'active_executions') {
      this.metrics.activeExecutions = value;
    }
  }

  _getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapTotal: (usage.heapTotal / (1024 * 1024)).toFixed(2) + 'MB',
      heapUsed: (usage.heapUsed / (1024 * 1024)).toFixed(2) + 'MB',
      rss: (usage.rss / (1024 * 1024)).toFixed(2) + 'MB',
      external: (usage.external / (1024 * 1024)).toFixed(2) + 'MB',
      warning: usage.heapUsed > usage.heapTotal * 0.8
    };
  }

  async _getDirSize(dir) {
    let totalSize = 0;
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = join(dir, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        } else if (stats.isDirectory()) {
          totalSize += await this._getDirSize(filePath);
        }
      }
    } catch (e) {
      // Directory might not exist yet
    }
    return totalSize;
  }
}

export const monitoringService = new MonitoringService();
