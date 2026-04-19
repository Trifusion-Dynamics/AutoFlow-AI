import { redisClient } from '../../config/redis.js';
import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.util.js';

/**
 * SSE Controller for real-time streaming
 */
export class StreamController {
  /**
   * Stream execution events via SSE
   */
  async streamExecution(req, res) {
    const { id: executionId } = req.params;
    const { orgId } = req.user;

    // 1. Verify execution belongs to org
    const execution = await prisma.execution.findUnique({
      where: { id: executionId },
      select: { orgId: true, status: true }
    });

    if (!execution || execution.orgId !== orgId) {
      return res.status(404).json({ success: false, message: 'Execution not found' });
    }

    // 2. Set SSE Headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // 3. Send initial status
    res.write(`data: ${JSON.stringify({ event: 'execution:connected', data: { status: execution.status } })}\n\n`);

    // 4. Handle completed executions immediately
    if (['success', 'failed', 'timeout'].includes(execution.status)) {
      res.write(`data: ${JSON.stringify({ event: 'execution:completed', data: { status: execution.status } })}\n\n`);
      return res.end();
    }

    // 5. Subscribe to Redis for this execution
    const subscriber = redisClient.duplicate();
    await subscriber.connect();

    await subscriber.subscribe(`execution:${executionId}`, (message) => {
      res.write(`data: ${message}\n\n`);
      
      const payload = JSON.parse(message);
      if (['execution:completed', 'execution:failed'].includes(payload.event)) {
        res.end();
      }
    });

    // 6. Heartbeat every 15s to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(':\n\n');
    }, 15000);

    // 7. Cleanup on disconnect
    req.on('close', async () => {
      clearInterval(heartbeat);
      await subscriber.unsubscribe(`execution:${executionId}`);
      await subscriber.disconnect();
      logger.debug(`SSE Connection closed for execution: ${executionId}`);
    });
  }

  /**
   * Stream organization events via SSE
   */
  async streamOrgEvents(req, res) {
    const { orgId } = req.user;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const subscriber = redisClient.duplicate();
    await subscriber.connect();

    await subscriber.subscribe(`org:${orgId}`, (message) => {
      res.write(`data: ${message}\n\n`);
    });

    const heartbeat = setInterval(() => {
      res.write(':\n\n');
    }, 15000);

    req.on('close', async () => {
      clearInterval(heartbeat);
      await subscriber.unsubscribe(`org:${orgId}`);
      await subscriber.disconnect();
      logger.debug(`SSE Connection closed for org: ${orgId}`);
    });
  }
}

export const streamController = new StreamController();
