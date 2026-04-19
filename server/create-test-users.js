import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🔧 Creating additional test users...');

  const testUsers = [
    {
      orgName: 'Tech Startup Inc',
      name: 'John Developer',
      email: 'john@techstartup.com',
      password: 'John@1234',
      role: 'owner',
      plan: 'starter'
    },
    {
      orgName: 'Marketing Agency',
      name: 'Sarah Marketer',
      email: 'sarah@marketing.com',
      password: 'Sarah@1234',
      role: 'owner',
      plan: 'pro'
    },
    {
      orgName: 'Enterprise Corp',
      name: 'Mike Manager',
      email: 'mike@enterprise.com',
      password: 'Mike@1234',
      role: 'owner',
      plan: 'enterprise'
    }
  ];

  for (const userData of testUsers) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    // Generate unique slug
    let slug = userData.orgName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").trim();
    let finalSlug = slug;
    let suffix = 1;
    
    while (await prisma.organization.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${suffix}`;
      suffix++;
    }

    const org = await prisma.organization.create({
      data: {
        name: userData.orgName,
        slug: finalSlug,
        plan: userData.plan,
        tokenQuota: userData.plan === 'starter' ? 1000000 : userData.plan === 'pro' ? 5000000 : 20000000,
      },
    });

    const user = await prisma.user.create({
      data: {
        orgId: org.id,
        name: userData.name,
        email: userData.email,
        passwordHash,
        role: userData.role,
        isVerified: true,
      },
    });

    console.log(`✅ Created user: ${userData.email} with password: ${userData.password}`);
    console.log(`   Organization: ${org.name} (${org.plan})`);
    console.log('');
  }

  console.log('✨ All test users created successfully!');
  await prisma.$disconnect();
}

createTestUsers().catch(console.error);
