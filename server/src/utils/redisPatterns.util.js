import { redisClient, redisHelpers } from '../config/redis.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.util.js';

/**
 * Advanced Redis Patterns: Distributed Locks, Idempotency, etc.
 */

/**
 * Acquire a distributed lock using SET NX EX pattern
 * @param {string} key Lock key
 * @param {number} ttlSeconds Time to live for the lock
 * @returns {Promise<{acquired: boolean, lockId: string|null}>}
 */
export async function acquireLock(key, ttlSeconds = 30) {
  const lockId = uuidv4();
  const lockKey = `lock:${key}`;
  
  try {
    const client = redisClient.getClient();
    // Use SET key value NX EX ttl
    const result = await client.set(lockKey, lockId, 'NX', 'EX', ttlSeconds);
    
    if (result === 'OK') {
      return { acquired: true, lockId };
    }
    
    return { acquired: false, lockId: null };
  } catch (error) {
    logger.error(`Error acquiring Redis lock for ${key}:`, error);
    return { acquired: false, lockId: null };
  }
}

/**
 * Release a distributed lock using an atomic Lua script
 * Ensures only the owner of the lock can release it
 * @param {string} key Lock key
 * @param {string} lockId Unique ID of the lock holder
 */
export async function releaseLock(key, lockId) {
  const lockKey = `lock:${key}`;
  const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  try {
    const client = redisClient.getClient();
    const result = await client.eval(luaScript, 1, lockKey, lockId);
    return result === 1;
  } catch (error) {
    logger.error(`Error releasing Redis lock for ${key}:`, error);
    return false;
  }
}

/**
 * Simple Redis-based idempotency check
 * @param {string} key Idempotency key
 * @param {number} ttlSeconds Window of idempotency
 */
export async function checkIdempotency(key, ttlSeconds = 3600) {
  const fullKey = `idempotency:${key}`;
  const result = await redisHelpers.set(fullKey, '1', 'NX', 'EX', ttlSeconds);
  return result === 'OK';
}
