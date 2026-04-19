import { getIO } from './socket.js';
import { redisClient } from '../config/redis.js';
import { logger } from '../utils/logger.util.js';

/**
 * Universal Event Emitter
 * Publishes events to Socket.IO rooms and Redis Channels (for SSE)
 */
export const realtimeEmitter = {
  /**
   * Emit to an entire organization
   */
  emitToOrg(orgId, event, data) {
    try {
      const io = getIO();
      io.to(`org:${orgId}`).emit(event, data);
      
      // Also publish to Redis for SSE fallback
      const payload = JSON.stringify({ event, data });
      redisClient.publish(`org:${orgId}`, payload);
      
      logger.debug(`Realtime event emitted to org:${orgId}`, { event });
    } catch (error) {
      logger.error('Error emitting to org:', error.message);
    }
  },

  /**
   * Emit to a specific execution
   */
  emitToExecution(executionId, orgId, event, data) {
    try {
      const io = getIO();
      // Emitting to execution room AND org room (in case they aren't in execution room)
      io.to(`execution:${executionId}`).to(`org:${orgId}`).emit(event, { ...data, executionId });
      
      // Publish to Redis for SSE
      const payload = JSON.stringify({ event, data: { ...data, executionId } });
      redisClient.publish(`execution:${executionId}`, payload);
      
      logger.debug(`Realtime event emitted to execution:${executionId}`, { event });
    } catch (error) {
      logger.error('Error emitting to execution:', error.message);
    }
  },

  /**
   * Emit to a specific user
   */
  emitToUser(userId, event, data) {
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit(event, data);
      logger.debug(`Realtime event emitted to user:${userId}`, { event });
    } catch (error) {
      logger.error('Error emitting to user:', error.message);
    }
  }
};
