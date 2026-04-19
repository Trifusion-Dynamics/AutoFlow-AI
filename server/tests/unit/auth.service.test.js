import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../src/modules/auth/auth.service.js';
import { prisma } from '../../src/config/db.js';
import * as cryptoUtils from '../../src/utils/crypto.util.js';
import * as jwtUtils from '../../src/utils/jwt.util.js';
import { AppError } from '../../src/utils/errors.js';

vi.mock('../../src/config/db.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    workflow: {
      count: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock('../../src/utils/crypto.util.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
  comparePassword: vi.fn(),
  generateHash: vi.fn().mockReturnValue('hashed_token'),
}));

vi.mock('../../src/utils/jwt.util.js', () => ({
  generateAccessToken: vi.fn().mockResolvedValue('access_token'),
  generateRefreshToken: vi.fn().mockResolvedValue('refresh_token'),
  verifyRefreshToken: vi.fn(),
  decodeToken: vi.fn(),
}));

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register()', () => {
    it('should register a new user and organization successfully', async () => {
      const registerData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        orgName: 'John Corp',
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue(null);
      
      prisma.organization.create.mockResolvedValue({ id: 'org-1', name: 'John Corp', slug: 'john-corp' });
      prisma.user.create.mockResolvedValue({ 
        id: 'user-1', 
        name: 'John Doe', 
        email: 'john@example.com', 
        orgId: 'org-1', 
        role: 'owner' 
      });

      const result = await authService.register(registerData, '127.0.0.1', 'test-agent');

      expect(result.user.email).toBe(registerData.email);
      expect(result.tokens.accessToken).toBe('access_token');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.organization.create).toHaveBeenCalled();
    });

    it('should throw 409 if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(authService.register({ email: 'john@example.com' }))
        .rejects.toThrow(AppError);
    });
  });

  describe('login()', () => {
    it('should return tokens on valid credentials', async () => {
      const user = {
        id: 'user-1',
        email: 'john@example.com',
        passwordHash: 'hashed',
        isActive: true,
        orgId: 'org-1',
        org: { id: 'org-1', name: 'John Corp', plan: 'free' }
      };

      prisma.user.findUnique.mockResolvedValue(user);
      cryptoUtils.comparePassword.mockResolvedValue(true);
      prisma.workflow.count.mockResolvedValue(0);

      const result = await authService.login('john@example.com', 'Password123!');

      expect(result.accessToken).toBe('access_token');
      expect(result.user.id).toBe('user-1');
    });

    it('should throw 401 on invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue({ passwordHash: 'hashed' });
      cryptoUtils.comparePassword.mockResolvedValue(false);

      await expect(authService.login('john@example.com', 'wrong'))
        .rejects.toThrow(AppError);
    });
  });

  describe('refreshTokens()', () => {
    it('should generate new tokens with valid refresh token', async () => {
      jwtUtils.verifyRefreshToken.mockResolvedValue({ userId: 'user-1' });
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 10000)
      });

      const result = await authService.refreshTokens('old_refresh_token');

      expect(result.accessToken).toBe('access_token');
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { isRevoked: true }
      }));
    });
  });
});
