import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import { cleanupDb, createTestOrg, createTestUser } from '../helpers/db.helper.js';

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    await cleanupDb();
  });

  afterAll(async () => {
    await cleanupDb();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and organization', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Integration User',
          email: 'integration@example.com',
          password: 'Password123!',
          orgName: 'Integration Corp'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('integration@example.com');
      expect(res.body.data.tokens).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      const org = await createTestOrg();
      await createTestUser(org.id, { email: 'duplicate@example.com' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Another User',
          email: 'duplicate@example.com',
          password: 'Password123!',
          orgName: 'Another Corp'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with correct credentials', async () => {
      const org = await createTestOrg();
      const user = await createTestUser(org.id, { email: 'login@example.com' }); // password is Password123! from helper

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const org = await createTestOrg();
      await createTestUser(org.id, { email: 'wrong@example.com' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'IncorrectPassword'
        });

      expect(res.status).toBe(401);
    });
  });
});
