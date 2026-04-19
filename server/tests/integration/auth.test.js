import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { testUtils } from '../helpers/api.helper.js';

describe('Auth API Integration Tests', () => {
  const testEmail = `auth-test-${Date.now()}@autoflow.ai`;
  const testPassword = 'Password@123';

  afterAll(async () => {
    await testUtils.cleanup('auth-integration-test-');
  });

  it('should register a new user and organization', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Auth Test User',
        email: testEmail,
        password: testPassword,
        orgName: 'Auth Test Org'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.role).toBe('owner');
  });

  it('should login and return tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  it('should fail with incorrect password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'wrong-password'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should get current user profile', async () => {
    const { token } = await testUtils.getAuthToken();
    
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('orgId');
  });
});
