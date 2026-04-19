import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Billing Plans
  const plans = [
    {
      name: 'free',
      displayName: 'Free Plan',
      price: 0,
      tokenQuota: 100000,
      workflowLimit: 3,
      executionLimit: 100,
      apiCallLimit: 1000,
      teamMembersLimit: 1,
      features: ['basic_nodes', 'community_support'],
    },
    {
      name: 'starter',
      displayName: 'Starter Plan',
      price: 29,
      tokenQuota: 1000000,
      workflowLimit: 10,
      executionLimit: 1000,
      apiCallLimit: 10000,
      teamMembersLimit: 3,
      features: ['all_nodes', 'email_support', 'webhooks'],
    },
    {
      name: 'pro',
      displayName: 'Pro Plan',
      price: 99,
      tokenQuota: 5000000,
      workflowLimit: 50,
      executionLimit: 10000,
      apiCallLimit: 100000,
      teamMembersLimit: 10,
      features: ['all_nodes', 'priority_support', 'webhooks', 'custom_ai_models', 'api_access'],
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise Plan',
      price: 499,
      tokenQuota: 20000000,
      workflowLimit: 999,
      executionLimit: 100000,
      apiCallLimit: 1000000,
      teamMembersLimit: 100,
      features: ['all_nodes', 'dedicated_support', 'webhooks', 'all_ai_models', 'api_access', 'audit_logs', 'sso'],
    },
  ];

  for (const plan of plans) {
    await prisma.billingPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }
  console.log('✅ Billing plans seeded');

  // 2. Demo Organization & User
  const adminPasswordHash = await bcrypt.hash('Demo@1234', 10);
  
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Org',
      slug: 'demo-org',
      plan: 'pro',
      tokenQuota: 5000000,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'demo@autoflow.ai' },
    update: { passwordHash: adminPasswordHash },
    create: {
      orgId: org.id,
      name: 'Demo Admin',
      email: 'demo@autoflow.ai',
      passwordHash: adminPasswordHash,
      role: 'owner',
      isVerified: true,
    },
  });
  console.log('✅ Demo organization and user seeded');

  // 3. System Workflow Templates
  const templates = [
    {
      name: 'Lead Enrichment from Webhook',
      description: 'Automatically enrich lead data from a webhook payload using AI scraping.',
      category: 'lead-management',
      triggerType: 'webhook',
      steps: [
        { id: 'scrape', tool: 'scrape_webpage', input: { url: '{{trigger.website}}' } },
        { id: 'enrich', tool: 'transform_data', input: { data: '{{steps.scrape.output}}', format: 'JSON' } }
      ],
      agentInstruction: 'Extract the company name, size, and industry from the scraped text.',
    },
    {
      name: 'Daily Social Media Summary',
      description: 'Scheduled task to summarize industry news.',
      category: 'reporting',
      triggerType: 'cron',
      steps: [
        { id: 'fetch', tool: 'http_request', input: { url: 'https://newsapi.org/v2/everything?q=ai' } }
      ],
      agentInstruction: 'Summarize the top 5 AI news items from the articles provided.',
    }
  ];

  for (const template of templates) {
    await prisma.workflowTemplate.upsert({
      where: { id: template.id || undefined, name: template.name }, // Hack because we don't have UUIDs upfront
      update: template,
      create: template,
    });
  }
  console.log('✅ Workflow templates seeded');

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
