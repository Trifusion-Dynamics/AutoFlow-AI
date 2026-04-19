import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { testUtils } from '../helpers/api.helper.js';

describe('Team Management API Tests', () => {
  const prefix = 'team-mgmt-test-';
  
  afterAll(async () => {
    await testUtils.cleanup(prefix);
  });

  it('should list team members for an organization', async () => {
    const { token } = await testUtils.getAuthToken(`${prefix}admin`);
    
    const res = await request(app)
      .get('/api/v1/team/members')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.members.length).toBeGreaterThanOrEqual(1); // At least the admin
  });

  it('should create a team invitation', async () => {
    const { token } = await testUtils.getAuthToken(`${prefix}inviter`);
    
    const res = await request(app)
      .post('/api/v1/team/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: `invited-${crypto.randomUUID()}@example.com`,
        role: 'member'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should only allow admins to invite members', async () => {
    // Note: getAuthToken creates an admin/owner by default because it registers a new org.
    // To test non-admin, we would need to create a member in an existing org.
    const { token, orgId } = await testUtils.getAuthToken(`${prefix}owner`);
    
    // Create a viewer in the same org
    const viewer = await testUtils.createOrgMember(orgId, 'viewer');
    
    // Login as the viewer (we'd need their password, but createOrgMember just puts them in DB)
    // For integration testing of RBAC, we'll manually login or use a helper
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: viewer.email, password: 'Password@123' });

    if (loginRes.statusCode !== 200) {
      throw new Error(`Failed to login viewer: ${JSON.stringify(loginRes.body)}`);
    }
    
    const viewerToken = loginRes.body.data.accessToken;

    const res = await request(app)
      .post('/api/v1/team/invite')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        email: 'attacker@example.com',
        role: 'admin'
      });

    // Viewers cannot invite members
    expect(res.statusCode).toBe(403);
  });
});
