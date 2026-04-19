import { prisma } from '../../src/config/db.js';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

export const createTestOrg = async (overrides = {}) => {
  const name = faker.company.name();
  return await prisma.organization.create({
    data: {
      name,
      slug: faker.helpers.slugify(name).toLowerCase() + '-' + faker.string.alphanumeric(5),
      plan: 'free',
      ...overrides
    }
  });
};

export const createTestUser = async (orgId, overrides = {}) => {
  return await prisma.user.create({
    data: {
      orgId,
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: 'owner',
      isVerified: true,
      ...overrides
    }
  });
};

export const createTestWorkflow = async (orgId, userId, overrides = {}) => {
  return await prisma.workflow.create({
    data: {
      orgId,
      createdBy: userId,
      name: faker.commerce.productName(),
      triggerType: 'manual',
      status: 'active',
      ...overrides
    }
  });
};

export const cleanupDb = async () => {
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log({ error });
      }
    }
  }
};
