import { executionRepository } from './executions.repository.js';
import { successResponse } from '../../utils/response.util.js';
import { AppError } from '../../utils/errors.js';
import { cacheUtil } from '../../utils/cache.util.js';
import { REDIS_KEYS } from '../../config/constants.js';
import { eventBus } from '../../utils/eventBus.util.js';
import { logger } from '../../utils/logger.util.js';
import { maskSecrets } from '../../utils/security.util.js';
import { responseTransformer } from '../../utils/responseTransformer.util.js';

export class ExecutionController {
  async getExecutions(req, res) {
    try {
      const { page, limit, status, workflowId, from, to } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (workflowId) filters.workflowId = workflowId;
      if (from) filters.from = from;
      if (to) filters.to = to;

      const pagination = { 
        page: parseInt(page) || 1, 
        limit: parseInt(limit) || 20 
      };

      const { executions, total } = await executionRepository.findByOrgId(
        req.user.orgId, 
        filters, 
        pagination
      );

      // Mask secrets in results
      const maskedExecutions = executions.map(exec => ({
        ...exec,
        output: maskSecrets(exec.output)
      }));

      return successResponse(res, {
        executions: maskedExecutions.map(e => responseTransformer.execution(e)),
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          pages: Math.ceil(total / pagination.limit)
        }
      }, 'Executions retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async getExecution(req, res) {
    try {
      const executionId = req.params.id;
      const orgId = req.user.orgId;

      // First try to get real-time status from Redis
      const realtimeStatus = await cacheUtil.getExecutionStatusCached(executionId);

      if (realtimeStatus) {
        // Return real-time status with basic execution info
        return successResponse(res, {
          id: executionId,
          status: realtimeStatus.status,
          startedAt: realtimeStatus.startedAt,
          completedAt: realtimeStatus.completedAt,
          durationMs: realtimeStatus.durationMs,
          tokensUsed: realtimeStatus.tokensUsed,
          workflowId: realtimeStatus.workflowId,
          realtime: true,
        }, 'Execution status retrieved successfully (real-time)');
      }

      // Fallback to database if not in Redis cache
      const execution = await executionRepository.findById(executionId, orgId);

      if (!execution) {
        throw new AppError('Execution not found', 'EXECUTION_NOT_FOUND', 404);
      }

      // Mask secrets
      const maskedExecution = {
        ...execution,
        output: maskSecrets(execution.output),
        steps: execution.steps ? execution.steps.map(step => ({
          ...step,
          input: maskSecrets(step.input),
          output: maskSecrets(step.output)
        })) : []
      };

      return successResponse(res, {
        ...responseTransformer.execution(maskedExecution),
        realtime: false,
      }, 'Execution retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async getExecutionsByWorkflow(req, res) {
    try {
      const { page, limit } = req.query;
      
      const pagination = { 
        page: parseInt(page) || 1, 
        limit: parseInt(limit) || 20 
      };

      const { executions, total } = await executionRepository.findByWorkflowId(
        req.params.workflowId,
        req.user.orgId,
        pagination
      );

      return successResponse(res, {
        executions,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          pages: Math.ceil(total / pagination.limit)
        }
      }, 'Workflow executions retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async getStats(req, res) {
    try {
      const stats = await executionRepository.getStats(req.user.orgId);

      return successResponse(res, stats, 'Execution statistics retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async streamExecution(req, res) {
    const executionId = req.params.id;
    const orgId = req.user?.orgId || req.apiKeyAuth?.orgId;

    // 1. Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering (Nginx)
    });

    // 2. Verify execution belongs to org
    const execution = await executionRepository.findById(executionId, orgId);
    if (!execution) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Execution not found or access denied' })}\n\n`);
      return res.end();
    }

    logger.info(`SSE stream opened for execution: ${executionId}`);

    // Initial state
    res.write(`event: metadata\ndata: ${JSON.stringify({ executionId, status: execution.status })}\n\n`);

    // 3. Subscription logic
    const onUpdate = (data) => {
      res.write(`event: update\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const onStep = (data) => {
      res.write(`event: step\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Attach listeners
    eventBus.on(`execution:${executionId}`, onUpdate);
    eventBus.on(`execution:${executionId}:step`, onStep);

    // Keep-alive heartbeat (every 15s)
    const keepAlive = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    // 4. Cleanup on disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
      eventBus.removeListener(`execution:${executionId}`, onUpdate);
      eventBus.removeListener(`execution:${executionId}:step`, onStep);
      logger.info(`SSE stream closed for execution: ${executionId}`);
    });
  }
}

export const executionController = new ExecutionController();
