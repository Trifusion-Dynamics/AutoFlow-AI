import { redisClient } from '../config/redis.js';
import { logger } from '../utils/logger.util.js';

/**
 * Standardized Redis Pub/Sub Helper
 */
class PubSub {
  constructor() {
    this.publisher = null;
    this.subscriber = null;
    this.handlers = new Map(); // channel -> Set of handlers
  }

  async init() {
    if (!this.publisher) {
      this.publisher = redisClient.getClient().duplicate();
      await this.publisher.connect().catch(() => {}); // ioredis/upstash handling
    }
    if (!this.subscriber) {
      this.subscriber = redisClient.getClient().duplicate();
      await this.subscriber.connect().catch(() => {});
      
      this.subscriber.on('message', (channel, message) => {
        const channelHandlers = this.handlers.get(channel);
        if (channelHandlers) {
          try {
            const data = JSON.parse(message);
            channelHandlers.forEach(handler => handler(data));
          } catch (error) {
            logger.error(`Error processing Pub/Sub message on channel ${channel}:`, error);
          }
        }
      });
    }
  }

  /**
   * Publish data to a channel
   */
  async publish(channel, data) {
    await this.init();
    const message = JSON.stringify(data);
    return await this.publisher.publish(channel, message);
  }

  /**
   * Subscribe to a channel with a handler
   */
  async subscribe(channel, handler) {
    await this.init();
    
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await this.subscriber.subscribe(channel);
    }
    
    this.handlers.get(channel).add(handler);
    logger.debug(`Subscribed to channel: ${channel}`);
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel, handler) {
    if (!this.subscriber) return;
    
    const channelHandlers = this.handlers.get(channel);
    if (channelHandlers) {
      if (handler) {
        channelHandlers.delete(handler);
        if (channelHandlers.size === 0) {
          await this.subscriber.unsubscribe(channel);
          this.handlers.delete(channel);
        }
      } else {
        await this.subscriber.unsubscribe(channel);
        this.handlers.delete(channel);
      }
    }
  }
}

export const pubsub = new PubSub();
