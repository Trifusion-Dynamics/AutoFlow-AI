import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import { cleanupDb, createTestOrg, createTestUser, createTestWorkflow } from '../helpers/db.helper.js';
import { getAuthHeader } from '../helpers/auth.helper.js';

describe('Workflow Integration Tests', () => {
  let org, user, authHeader;

  beforeAll(async () => {
    await cleanupDb();
    org = await createTestOrg();
    user = await createTestUser(org.id);
    authHeader = await getAuthHeader(user);
  });

  afterAll(async () => {
    await cleanupDb();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/workflows', () => {
    it('should create a new workflow', async () => {
      const res = await request(app)
        .post('/api/v1/workflows')
        .set(authHeader)
        .send({
          name: 'Integration WF',
          triggerType: 'manual',
          description: 'Created during test'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.workflow.name).toBe('Integration WF');
      expect(res.body.data.workflow.status).toBe('draft');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/v1/workflows')
        .send({ name: 'Fail WF', triggerType: 'manual' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/workflows', () => {
    beforeEach(async () => {
      await prisma.workflow.deleteMany();
      await createTestWorkflow(org.id, user.id);
      await createTestWorkflow(org.id, user.id);
    });

    it('should list workflows for the organization', async () => {
      const res = await request(app)
        .get('/api/v1/workflows')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.workflows).toHaveLength(2);
    });

    it('should not show workflows from another organization', async () => {
      const otherOrg = await createTestOrg({ name: 'Other Org', slug: 'other-org' });
      const otherUser = await createTestUser(otherOrg.id, { email: 'other@example.com' });
      await createTestWorkflow(otherOrg.id, otherUser.id);

      const res = await request(app)
        .get('/api/v1/workflows')
        .set(authHeader);

      expect(res.body.data.workflows).toHaveLength(2); // Only this org's workflows
    });
  });

  describe('POST /api/v1/workflows/:id/run', () => {
    it('should trigger execution for active workflow', async () => {
      const wf = await createTestWorkflow(org.id, user.id, { status: 'active' });

      const res = await request(app)
        .post(`/api/v1/workflows/${wf.id}/run`)
        .set(authHeader)
        .send({ data: { test: true } });

      expect(res.status).toBe(200);
      expect(res.body.data.executionId).toBeDefined();
    });

    it('should return 400 for draft workflow', async () => {
      const wf = await createTestWorkflow(org.id, user.id, { status: 'draft' });

      const res = await request(app)
        .post(`/api/v1/workflows/${wf.id}/run`)
        .set(authHeader);

      expect(res.status).toBe(400);
    });
  });
});
