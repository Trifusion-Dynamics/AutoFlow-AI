import { monitoringService } from './monitoring.service.js';
import { successResponse, errorResponse } from '../../utils/response.util.js';

/**
 * Monitoring Controller
 */
export class MonitoringController {
  /**
   * GET /health
   */
  async getHealth(req, res) {
    try {
      const health = await monitoringService.getDetailedHealth();
      const statusCode = health.status === 'unhealthy' ? 503 : 200;
      return res.status(statusCode).json(health);
    } catch (error) {
      return errorResponse(res, 'MONITORING_ERROR', error.message, 500);
    }
  }

  /**
   * GET /health/ready
   */
  async getReadiness(req, res) {
    try {
      const readiness = await monitoringService.getReadinessProbe();
      if (readiness.ready) {
        return res.status(200).json({ status: 'ready' });
      }
      return res.status(503).json({ status: 'not_ready', ...readiness });
    } catch (error) {
      return res.status(503).json({ status: 'not_ready', error: error.message });
    }
  }

  /**
   * GET /health/live
   */
  async getLiveness(req, res) {
    const liveness = monitoringService.getLivenessProbe();
    return res.status(200).json(liveness);
  }

  /**
   * GET /metrics
   */
  async getMetrics(req, res) {
    try {
      const metrics = monitoringService.getMetrics();
      res.set('Content-Type', 'text/plain; version=0.0.4');
      return res.status(200).send(metrics);
    } catch (error) {
      return errorResponse(res, 'METRICS_ERROR', error.message, 500);
    }
  }
}

export const monitoringController = new MonitoringController();
