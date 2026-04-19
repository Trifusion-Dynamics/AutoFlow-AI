import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { testUtils } from '../helpers/api.helper.js';

describe('Billing API Integration Tests', () => {
  afterAll(async () => {
    await testUtils.cleanup('billing-test-');
  });

  it('should retrieve current plan details', async () => {
    const { token } = await testUtils.getAuthToken('billing-user');
    
    const res = await request(app)
      .get('/api/v1/billing/plan')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tier).toBe('Free');
    expect(res.body.data.limits).toHaveProperty('maxWorkflows');
  });

  it('should list invoices (even if empty)', async () => {
    const { token } = await testUtils.getAuthToken('billing-user2');
    
    const res = await request(app)
      .get('/api/v1/billing/invoices')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
