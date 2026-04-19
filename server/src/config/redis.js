import { Redis } from '@upstash/redis';
import { env } from './env.js';
import { logger } from '../utils/logger.util.js';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.client && this.isConnected) {
      return this.client;
    }

    try {
      // Handle Upstash HTTPS URLs
      if (env.REDIS_URL.startsWith('https://')) {
        // For Upstash, use the REST API
        logger.info('Using Upstash Redis (HTTPS) configuration');
        this.client = new Redis({
          url: env.REDIS_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        });
      } else {
        // For regular Redis, use ioredis
        logger.info('Using regular Redis configuration');
        const Redis = await import('ioredis');
        this.client = new Redis.default(env.REDIS_URL, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            logger.info(`Redis retry attempt ${times}, delay: ${delay}ms`);
            return delay;
          },
          connectTimeout: 10000,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 5,
          lazyConnect: true,
        });
      }

      // Set up event handlers for both types
      if (this.client.on) {
        this.client.on('connect', () => {
          this.isConnected = true;
          logger.info('Redis connected successfully');
        });

        this.client.on('error', (error) => {
          this.isConnected = false;
          logger.error('Redis connection error:', error);
        });

        this.client.on('close', () => {
          this.isConnected = false;
          logger.warn('Redis connection closed');
        });

        this.client.on('reconnecting', () => {
          logger.info('Redis reconnecting...');
        });
      }

      // For Upstash Redis, we don't need to connect
      if (!env.REDIS_URL.startsWith('https://')) {
        await this.client.connect();
      }

      this.isConnected = true;
      return this.client;
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to Redis:', error.message);
      // Don't throw error, just log it and continue without Redis
      logger.warn('Continuing without Redis connection');
      return null;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  async ping() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis not connected');
    }
    return await this.client.ping();
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis not connected. Call connect() first.');
    }
    return this.client;
  }

  isReady() {
    return this.isConnected && this.client;
  }
}

// Create singleton instance
export const redisClient = new RedisClient();

// Export the Redis client instance for direct use
export const redis = redisClient.getClient.bind(redisClient);

// Helper functions for common Redis operations
export const redisHelpers = {
  async get(key) {
    try {
      const client = redisClient.getClient();
      if (!client) return null;
      return await client.get(key);
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  },

  async set(key, value, ttlSeconds) {
    try {
      const client = redisClient.getClient();
      if (!client) return false;
      if (ttlSeconds) {
        return await client.setex(key, ttlSeconds, value);
      }
      return await client.set(key, value);
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return null;
    }
  },

  async del(key) {
    try {
      const client = redisClient.getClient();
      if (!client) return 0;
      return await client.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return 0;
    }
  },

  async exists(key) {
    try {
      const client = redisClient.getClient();
      if (!client) return 0;
      return await client.exists(key);
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return 0;
    }
  },

  async incr(key) {
    try {
      const client = redisClient.getClient();
      if (!client) return 0;
      return await client.incr(key);
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}:`, error);
      return 0;
    }
  },

  async expire(key, seconds) {
    try {
      const client = redisClient.getClient();
      if (!client) return 0;
      return await client.expire(key, seconds);
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      return 0;
    }
  },

  async expireat(key, timestamp) {
    try {
      const client = redisClient.getClient();
      if (!client) return 0;
      return await client.expireat(key, timestamp);
    } catch (error) {
      logger.error(`Redis EXPIREAT error for key ${key}:`, error);
      return 0;
    }
  },
};

export const isRedisEnabled = true;
