import { z } from 'zod';

export const updateOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(255, 'Organization name must be at most 255 characters').optional(),
  settings: z.object({
    timezone: z.string().optional(),
    webhookRetries: z.number().min(0, 'Webhook retries must be at least 0').max(5, 'Webhook retries must be at most 5').optional(),
    defaultTimeout: z.number().min(30, 'Default timeout must be at least 30 seconds').max(3600, 'Default timeout must be at most 3600 seconds').optional(),
    emailNotifications: z.boolean().optional(),
  }).optional(),
});

export const getOrgStatsSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
});

export const getOrgUsageSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
});
