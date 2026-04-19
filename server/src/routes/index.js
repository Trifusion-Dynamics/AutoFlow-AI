import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { userRoutes } from '../routes/users.routes.js';
import { workflowRoutes } from '../modules/workflows/workflows.routes.js';
import executionRoutes from '../modules/executions/executions.routes.js';
import webhookRoutes from '../modules/webhooks/webhooks.routes.js';
import { apiKeyRoutes } from '../modules/api-keys/api-keys.routes.js';
import { orgRoutes } from '../modules/orgs/orgs.routes.js';
import { auditRoutes } from '../modules/audit/audit.routes.js';
import { outboundWebhookRoutes } from '../modules/outbound-webhooks/outbound-webhooks.routes.js';
import { usageRoutes } from '../modules/usage/usage.routes.js';
import { billingRoutes } from '../modules/billing/billing.routes.js';
import { teamRoutes } from '../modules/team/team.routes.js';
import { notificationRoutes } from '../modules/notifications/notifications.routes.js';
import { adminRoutes } from '../modules/admin/admin.routes.js';
import { monitoringRoutes } from '../modules/monitoring/monitoring.routes.js';
import { templatesRoutes } from '../modules/templates/templates.routes.js';
import { onboardingRoutes } from '../modules/onboarding/onboarding.routes.js';
import { streamRoutes } from '../modules/stream/stream.routes.js';
import { filesRoutes } from '../modules/files/files.routes.js';
import workflowVersionRoutes from '../modules/workflow-versions/workflow-versions.routes.js';
import integrationsRoutes from '../modules/integrations/integrations.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';
import dataExportRoutes from '../modules/data-export/data-export.routes.js';
import complianceRoutes from '../modules/compliance/compliance.routes.js';
import marketplaceRoutes from '../modules/marketplace/marketplace.routes.js';

import { tenantIsolation } from '../middlewares/tenantIsolation.middleware.js';

const router = Router();

// API routes
router.use('/auth', authRoutes);

// Monitoring (Public/Admin)
router.use('/monitoring', monitoringRoutes);

// Templates (Public/Authenticated)
router.use('/templates', templatesRoutes);

// Marketplace (Public/Authenticated)
router.use('/marketplace', marketplaceRoutes);

// Apply tenant isolation to all remaining routes
router.use(tenantIsolation);

router.use('/users', userRoutes);
router.use('/workflows', workflowRoutes);
router.use('/executions', executionRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/orgs', orgRoutes);
router.use('/audit', auditRoutes);
router.use('/outbound-webhooks', outboundWebhookRoutes);
router.use('/usage', usageRoutes);
router.use('/billing', billingRoutes);
router.use('/team', teamRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/stream', streamRoutes);
router.use('/files', filesRoutes);
router.use('/workflow-versions', workflowVersionRoutes);
router.use('/integrations', integrationsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/data-export', dataExportRoutes);
router.use('/compliance', complianceRoutes);

export { router as routes };

