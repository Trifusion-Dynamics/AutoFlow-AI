import { z } from 'zod';

export const createWorkflowSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  triggerType: z.enum(['webhook', 'cron', 'manual']),
  triggerConfig: z.object({
    schedule: z.string().optional(), // cron: "0 9 * * *"
    webhookSecret: z.string().optional()
  }).optional().default({}),
  steps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    tool: z.enum([
      'send_email',
      'http_request', 
      'db_insert',
      'send_slack_message',
      'generate_pdf',
      'log_message'
    ]),
    config: z.record(z.any()),
    condition: z.string().optional(),
    onError: z.enum(['stop', 'continue']).default('stop')
  })).min(1),
  agentInstruction: z.string().min(10),
  variables: z.record(z.any()).optional().default({}),
  timeoutSeconds: z.number().min(30).max(3600).default(300),
  maxRetries: z.number().min(0).max(5).default(3)
});

export const updateWorkflowSchema = createWorkflowSchema.partial();

export const runWorkflowSchema = z.object({
  input: z.record(z.any()).optional().default({})
});

export const getWorkflowsQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  triggerType: z.enum(['webhook', 'cron', 'manual']).optional(),
  search: z.string().optional()
});

export const getExecutionsQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z.enum(['pending', 'running', 'success', 'failed']).optional(),
  workflowId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});
