import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyAccessToken } from '../utils/jwt.util.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.util.js';
import { redisClient } from '../config/redis.js';

let io;

/**
 * Initialize Socket.IO server
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS === '*' ? '*' : env.CORS_ORIGINS.split(','),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // 1. Redis Adapter for Scaling
  const pubClient = redisClient.getClient().duplicate();
  const subClient = redisClient.getClient().duplicate();
  
  // Note: For ioredis/upstash clients, we might need to await connect() 
  // depending on initialization. redisClient.getClient() usually handles this.
  io.adapter(createAdapter(pubClient, subClient));

  // 2. Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error: No token provided'));

      // Use unified JWT verification
      const payload = await verifyAccessToken(token);

      socket.userId = payload.userId;
      socket.orgId = payload.orgId;
      next();
    } catch (error) {
      logger.error('Socket.IO authentication failed:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, orgId } = socket;
    logger.info(`User connected to socket: ${userId} (Org: ${orgId})`);

    // Join organization and user specific rooms
    socket.join(`org:${orgId}`);
    socket.join(`user:${userId}`);

    // Join specific execution rooms if requested
    socket.on('join_execution', (executionId) => {
      socket.join(`execution:${executionId}`);
      logger.debug(`User ${userId} joined execution room: ${executionId}`);
    });

    socket.on('leave_execution', (executionId) => {
      socket.leave(`execution:${executionId}`);
      logger.debug(`User ${userId} left execution room: ${executionId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected from socket: ${userId}`);
    });
  });

  return io;
};

/**
 * Get the Socket.IO instance
 */
export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

