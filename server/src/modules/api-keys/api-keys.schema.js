import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(3, 'API key name must be at least 3 characters').max(100, 'API key name must be at most 100 characters'),
  permissions: z.array(z.enum(['read', 'write', 'webhook'])).default(['read']),
  expiresAt: z.string().datetime().optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(3, 'API key name must be at least 3 characters').max(100, 'API key name must be at most 100 characters').optional(),
  permissions: z.array(z.enum(['read', 'write', 'webhook'])).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const listApiKeysSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)).default('20'),
  status: z.enum(['active', 'revoked']).optional(),
  permission: z.enum(['read', 'write', 'webhook']).optional(),
});
