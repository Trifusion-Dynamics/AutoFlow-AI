import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { testUtils } from '../helpers/api.helper.js';

describe('Admin API Integration Tests', () => {
  const adminSecret = process.env.ADMIN_SECRET || 'test-admin-secret-at-least-32-chars-long';

  afterAll(async () => {
    await testUtils.cleanup('admin-test-');
  });

  it('should fail to access admin stats without secret or admin flag', async () => {
    const { token } = await testUtils.getAuthToken('admin-test-user');
    
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  it('should allow access to admin stats with secret', async () => {
    const { token } = await testUtils.getAuthToken('admin-test-auth');
    
    // Manually setting the secret in environment if not present
    if (!process.env.ADMIN_SECRET) process.env.ADMIN_SECRET = adminSecret;

    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Admin-Secret', adminSecret);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalUsers');
  });
});
