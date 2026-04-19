import { z } from 'zod';
import { OUTBOUND_WEBHOOK_EVENTS } from '../../config/constants.js';

export const createWebhookSchema = z.object({
  name: z.string().min(3, 'Webhook name must be at least 3 characters'),
  url: z.string().url('Invalid webhook URL'),
  events: z.array(
    z.enum(OUTBOUND_WEBHOOK_EVENTS)
  ).min(1, 'At least one event must be subscribed'),
});

export const updateWebhookSchema = z.object({
  name: z.string().min(3).optional(),
  url: z.string().url().optional(),
  events: z.array(
    z.enum(OUTBOUND_WEBHOOK_EVENTS)
  ).min(1).optional(),
  isActive: z.boolean().optional(),
});

export const listDeliveriesQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional(),
  cursor: z.string().optional(),
  event: z.string().optional(),
  success: z.string().transform(val => val === 'true').optional(),
});
