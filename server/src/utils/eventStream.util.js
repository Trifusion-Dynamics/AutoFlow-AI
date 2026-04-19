import { redisClient } from '../config/redis.js';
import { logger } from './logger.util.js';

/**
 * Redis Streams Wrapper for Durable Event Logs
 */
export const eventStream = {
  /**
   * Append an event to a stream
   * @param {string} streamKey 
   * @param {object} event 
   * @param {number} maxLen Optional cap on stream length
   */
  async appendEvent(streamKey, event, maxLen = 1000) {
    try {
      const client = redisClient.getClient();
      // XADD key MAXLEN ~ maxLen * event_data
      const message = ['event', JSON.stringify(event)];
      return await client.xadd(streamKey, 'MAXLEN', '~', maxLen, '*', ...message);
    } catch (error) {
      logger.error(`Error appending to Redis stream ${streamKey}:`, error);
      return null;
    }
  },

  /**
   * Read events from a stream starting after a specific ID
   * @param {string} streamKey 
   * @param {string} lastId ID to start after (default '0' for everything)
   * @param {number} count Max events to return
   */
  async readEvents(streamKey, lastId = '0', count = 100) {
    try {
      const client = redisClient.getClient();
      // XREAD COUNT count STREAMS streamKey lastId
      const results = await client.xread('COUNT', count, 'STREAMS', streamKey, lastId);
      
      if (!results || results.length === 0) return [];
      
      const [_key, messages] = results[0];
      return messages.map(([id, fields]) => {
        // fields is [key1, val1, key2, val2...]
        const eventData = JSON.parse(fields[1]);
        return {
          id,
          ...eventData
        };
      });
    } catch (error) {
      logger.error(`Error reading from Redis stream ${streamKey}:`, error);
      return [];
    }
  },

  /**
   * Trim stream to a specific maximum length
   */
  async trimStream(streamKey, maxLen = 0) {
    try {
      const client = redisClient.getClient();
      return await client.xtrim(streamKey, 'MAXLEN', maxLen);
    } catch (error) {
      logger.error(`Error trimming Redis stream ${streamKey}:`, error);
      return 0;
    }
  }
};
