import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import { cleanupDb } from '../helpers/db.helper.js';

describe('Complete Workflow E2E journey', () => {
  let tokens, user, org, workflow;

  beforeAll(async () => {
    await cleanupDb();
  });

  afterAll(async () => {
    await cleanupDb();
    await prisma.$disconnect();
  });

  it('Step 1: Register a new organization and user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'E2E User',
        email: 'e2e@autoflow.ai',
        password: 'Password123!',
        orgName: 'E2E Testing Corp'
      });

    expect(res.status).toBe(201);
    tokens = res.body.data.tokens;
    user = res.body.data.user;
    org = res.body.data.organization;
  });

  it('Step 2: Create a manual trigger workflow with agent instruction', async () => {
    const res = await request(app)
      .post('/api/v1/workflows')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({
        name: 'Weather Assistant',
        triggerType: 'manual',
        description: 'Check weather and summarize',
        agentInstruction: 'Check the weather for the given city and provide a summary.'
      });

    expect(res.status).toBe(201);
    workflow = res.body.data.workflow;
  });

  it('Step 3: Activate the workflow', async () => {
    const res = await request(app)
      .post(`/api/v1/workflows/${workflow.id}/activate`)
      .set('Authorization', `Bearer ${tokens.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('active');
  });

  it('Step 4: Run the workflow', async () => {
    const res = await request(app)
      .post(`/api/v1/workflows/${workflow.id}/run`)
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({
        input: { city: 'San Francisco' }
      });

    expect(res.status).toBe(200);
    expect(res.body.data.executionId).toBeDefined();
    expect(res.body.data.status).toBe('queued');
  });

  it('Step 5: Verify organization usage stats', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.org.plan).toBe('free');
  });
});
