import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { testUtils } from '../helpers/api.helper.js';

describe('Multi-Tenancy Isolation Tests', () => {
  afterAll(async () => {
    await testUtils.cleanup('tenancy-test-');
  });

  it('should prevent User A from accessing Org B data', async () => {
    const { token: token1, orgId: orgId1 } = await testUtils.getAuthToken('tenancy-test-a');
    const { token: token2, orgId: orgId2 } = await testUtils.getAuthToken('tenancy-test-b');

    // 1. User A creates a workflow
    const createRes = await request(app)
      .post('/api/v1/workflows')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'User A Workflow',
        triggerType: 'webhook',
        agentInstruction: 'Test instruction',
        steps: [{ id: '1', type: 'agent', name: 'Agent Step' }]
      });

    expect(createRes.statusCode).toBe(201);
    const workflowId = createRes.body.data.id;

    // 2. User B tries to access User A's workflow
    const getRes = await request(app)
      .get(`/api/v1/workflows/${workflowId}`)
      .set('Authorization', `Bearer ${token2}`);

    // Should return 404 because of tenant isolation (the record exists but not for Org B)
    expect(getRes.statusCode).toBe(404);
  });

  it('should strictly isolate data between organizations', async () => {
    const { token: token1 } = await testUtils.getAuthToken('tenancy-test-a');
    const { token: token2, orgId: orgId2 } = await testUtils.getAuthToken('tenancy-test-b');

    // User B creates a workflow
    await request(app)
      .post('/api/v1/workflows')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        name: 'User B Workflow',
        triggerType: 'webhook',
        agentInstruction: 'Test instruction',
        steps: [{ id: '1', type: 'agent', name: 'Agent Step' }]
      });

    // User A lists workflows - should be empty
    const listRes = await request(app)
      .get('/api/v1/workflows')
      .set('Authorization', `Bearer ${token1}`);

    expect(listRes.statusCode).toBe(200);
    const workflowsForA = listRes.body.data.filter(w => w.orgId === orgId2);
    expect(workflowsForA.length).toBe(0);
  });
});
