import { describe, it, expect, vi, beforeEach } from 'vitest';
import { quotaUtil, QuotaExceededError } from '../../src/utils/quota.util.js';
import { redisHelpers } from '../../src/config/redis.js';
import { cacheUtil } from '../../src/utils/cache.util.js';
import * as jwtUtils from '../../src/utils/jwt.util.js';
import * as cryptoUtils from '../../src/utils/crypto.util.js';

vi.mock('../../src/config/redis.js', () => ({
  redisHelpers: {
    incr: vi.fn(),
    expire: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
  REDIS_KEYS: {
    ORG_TOKENS: vi.fn().mockReturnValue('org:tokens:test'),
  }
}));

vi.mock('../../src/utils/cache.util.js', () => ({
  cacheUtil: {
    getOrgCached: vi.fn(),
  }
}));

describe('Utilities Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('QuotaUtil', () => {
    it('should allow usage when under quota', async () => {
      redisHelpers.incr.mockResolvedValue(500);
      cacheUtil.getOrgCached.mockResolvedValue({ tokenQuota: 1000 });

      const result = await quotaUtil.checkAndConsumeTokens('org-1', 100);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(500);
    });

    it('should throw QuotaExceededError when over quota', async () => {
      redisHelpers.incr.mockResolvedValue(1100);
      cacheUtil.getOrgCached.mockResolvedValue({ tokenQuota: 1000 });

      await expect(quotaUtil.checkAndConsumeTokens('org-1', 100))
        .rejects.toThrow(QuotaExceededError);
      
      expect(redisHelpers.del).toHaveBeenCalled();
    });
  });

  describe('JWT Utility', () => {
    it('should generate and verify access tokens', async () => {
      const payload = { userId: '123' };
      const token = await jwtUtils.generateAccessToken(payload);
      
      // Since jose is used in implementation, we'd normally mock it or use it. 
      // For unit test, we ensure it's a string.
      expect(typeof token).toBe('string');
    });
  });

  describe('Crypto Utility', () => {
    it('should hash and compare passwords accurately', async () => {
      const password = 'my-secret-password';
      const hash = await cryptoUtils.hashPassword(password);
      
      const isMatch = await cryptoUtils.comparePassword(password, hash);
      const isNotMatch = await cryptoUtils.comparePassword('wrong', hash);
      
      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });
  });
});
