import { redisHelpers } from '../config/redis.js';
import { logger } from './logger.util.js';
import { LRUCache } from 'lru-cache';

/**
 * Multi-level Caching Utility
 * L1: In-memory LRU cache (fast, low TTL)
 * L2: Redis cache (shared, medium TTL)
 */
export class CacheUtil {
  constructor() {
    this.l1 = new LRUCache({
      max: 500, // Maximum items in cache
      ttl: 1000 * 60, // 1 minute default TTL for L1
      updateAgeOnGet: true,
    });
  }

  /**
   * Get cached value from L1 then L2
   */
  async getCached(key, ttl, fetchFn) {
    // 1. Check L1 (In-Memory)
    const l1Value = this.l1.get(key);
    if (l1Value !== undefined) {
      return l1Value;
    }

    // 2. Check L2 (Redis)
    try {
      const redisValue = await redisHelpers.get(key);
      if (redisValue !== null) {
        const parsed = JSON.parse(redisValue);
        // Populate L1 for future fast access
        this.l1.set(key, parsed);
        return parsed;
      }
    } catch (error) {
      logger.error(`L2 Cache GET error for key ${key}:`, error);
    }

    // 3. Cache Miss - Fetch fresh data
    const freshData = await fetchFn();
    
    // 4. Store in both L1 and L2
    if (freshData !== null && freshData !== undefined) {
      this.l1.set(key, freshData);
      try {
        await redisHelpers.set(key, JSON.stringify(freshData), ttl);
      } catch (error) {
        logger.error(`L2 Cache SET error for key ${key}:`, error);
      }
    }

    return freshData;
  }

  /**
   * Delete specific key from both L1 and L2
   */
  async invalidate(key) {
    this.l1.delete(key);
    try {
      await redisHelpers.del(key);
    } catch (error) {
      logger.error(`L2 Cache DEL error for key ${key}:`, error);
    }
  }

  /**
   * Invalidate multiple keys by pattern
   */
  async invalidateAll(pattern) {
    // Clear L1 keys matching pattern
    for (const key of this.l1.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.l1.delete(key);
      }
    }

    // Clear Redis keys matching pattern
    try {
      const client = redisHelpers.getClient();
      if (redisHelpers.isReady()) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(...keys);
        }
        logger.info(`Invalidated ${keys.length} L2 keys with pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error(`L2 Cache pattern invalidation error:`, error);
    }
  }

  // Helper methods for common caches

  async getOrgCached(orgId) {
    const key = `org:${orgId}`;
    return await this.getCached(key, 300, async () => {
      const { prisma } = await import('../config/db.js');
      return await prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          tokenQuota: true,
          tokenUsed: true,
          isActive: true,
          settings: true,
        },
      });
    });
  }

  async getTierLimitsCached(plan) {
    const key = `limits:${plan}`;
    return await this.getCached(key, 600, async () => {
      // Plan limits usually don't change often
      const { prisma } = await import('../config/db.js');
      return await prisma.billingPlan.findUnique({
        where: { name: plan }
      });
    });
  }

  async getUserCached(userId) {
    const key = `user:${userId}`;
    return await this.getCached(key, 120, async () => {
      const { prisma } = await import('../config/db.js');
      return await prisma.user.findUnique({
        where: { id: userId },
        include: {
          org: {
            select: { id: true, plan: true }
          }
        }
      });
    });
  }
}

export const cacheUtil = new CacheUtil();
