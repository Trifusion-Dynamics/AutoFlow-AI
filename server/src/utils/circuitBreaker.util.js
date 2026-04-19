import { logger } from './logger.util.js';
import { redisHelpers } from '../config/redis.js';

/**
 * Circuit Breaker Pattern Implementation (Multi-instance aware via Redis)
 */
export class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.cooldownPeriod = options.cooldownPeriod || 30; // seconds
    this.requestTimeout = options.requestTimeout || 10000; // ms
    
    this.keyPrefix = `cb:${name}`;
  }

  async getState() {
    const state = await redisHelpers.get(`${this.keyPrefix}:state`);
    return state || 'CLOSED'; // Default to CLOSED
  }

  async setOpen() {
    await redisHelpers.set(`${this.keyPrefix}:state`, 'OPEN', this.cooldownPeriod);
    logger.error(`🚨 CIRCUIT BREAKER OPEN: ${this.name}. Recovery in ${this.cooldownPeriod}s.`);
  }

  async setHalfOpen() {
    await redisHelpers.set(`${this.keyPrefix}:state`, 'HALF_OPEN');
    logger.warn(`⚠️ CIRCUIT BREAKER HALF-OPEN: ${this.name}. Testing...`);
  }

  async setClosed() {
    await redisHelpers.set(`${this.keyPrefix}:state`, 'CLOSED');
    await redisHelpers.del(`${this.keyPrefix}:failures`);
    logger.info(`✅ CIRCUIT BREAKER CLOSED: ${this.name}. Service restored.`);
  }

  async recordFailure() {
    const failures = await redisHelpers.incr(`${this.keyPrefix}:failures`);
    if (failures === 1) await redisHelpers.expire(`${this.keyPrefix}:failures`, 60);

    if (failures >= this.failureThreshold) {
      await this.setOpen();
    }
  }

  async recordSuccess() {
    const state = await this.getState();
    if (state === 'HALF_OPEN') {
      await this.setClosed();
    } else {
      await redisHelpers.del(`${this.keyPrefix}:failures`);
    }
  }

  /**
   * Execute a function protected by the circuit breaker
   */
  async execute(fn) {
    const state = await this.getState();

    if (state === 'OPEN') {
      throw new Error(`Circuit Breaker [${this.name}] is OPEN. Fast-rejecting request.`);
    }

    try {
      const result = await fn();
      await this.recordSuccess();
      return result;
    } catch (error) {
      await this.recordFailure();
      throw error;
    }
  }
}

// Default instances
export const aiCircuitBreaker = new CircuitBreaker('AI_SERVICE', { failureThreshold: 5, cooldownPeriod: 30 });
export const dbCircuitBreaker = new CircuitBreaker('DATABASE', { failureThreshold: 10, cooldownPeriod: 15 });
