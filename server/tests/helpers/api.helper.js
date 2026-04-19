import request from 'supertest';
import crypto from 'crypto';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/db.js';

/**
 * Test Utilities for API Integration Tests
 */
export const testUtils = {
  /**
   * Register and login a test user to get an auth token
   */
  async getAuthToken(emailPrefix = 'test', password = 'Password@123') {
    const uniqueId = crypto.randomUUID(); // Use full UUID
    const email = `${emailPrefix}-${uniqueId}@autoflow.ai`.toLowerCase();
    
    // 1. Register
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email,
        password,
        orgName: `Test Org ${uniqueId}`
      });

    if (registerRes.statusCode !== 201) {
      console.error('Registration Failed:', registerRes.body);
      throw new Error(`Failed to register test user (${email}): ${JSON.stringify(registerRes.body)}`);
    }

    // 2. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    if (loginRes.statusCode !== 200 || !loginRes.body.data) {
      throw new Error(`Failed to login test user (${email}): ${JSON.stringify(loginRes.body)}`);
    }

    return {
      token: loginRes.body.data.accessToken,
      user: loginRes.body.data.user,
      orgId: loginRes.body.data.user.orgId
    };
  },

  /**
   * Create a secondary test user in the same organization for team testing
   */
  async createOrgMember(orgId, role = 'member') {
    const email = `member-${Date.now()}@autoflow.ai`;
    const user = await prisma.user.create({
      data: {
        name: 'Member User',
        email,
        passwordHash: '$2a$12$7wvBnFsuKhgO2PFSNbiW/./Y/OWQlSdQquE0tssd19tsPXTMZkkoy', // Hash for 'Password@123'
        orgId,
        role
      }
    });
    return user;
  },

  /**
   * Cleanup specific test data by email prefix
   */
  async cleanup(emailPrefix = 'test-') {
    // Note: Due to foreign keys, we need to be careful with deletion order
    const testUsers = await prisma.user.findMany({
      where: { email: { startsWith: emailPrefix } }
    });

    const orgIds = testUsers.map(u => u.orgId);

    // 1. Delete dependent relations (simplified for this test suite)
    await prisma.workflow.deleteMany({ where: { orgId: { in: orgIds } } });
    await prisma.execution.deleteMany({ where: { orgId: { in: orgIds } } });
    await prisma.notification.deleteMany({ where: { orgId: { in: orgIds } } });
    await prisma.teamInvitation.deleteMany({ where: { orgId: { in: orgIds } } });
    await prisma.aPIKey.deleteMany({ where: { orgId: { in: orgIds } } });

    // 2. Delete Users
    await prisma.user.deleteMany({ where: { orgId: { in: orgIds } } });

    // 3. Delete Orgs
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  }
};
