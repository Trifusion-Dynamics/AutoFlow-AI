export interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  triggerType: 'webhook' | 'cron' | 'manual';
  triggerConfig: Record<string, any>;
  steps: WorkflowStep[];
  agentInstruction: string;
  aiModel: 'claude' | 'gpt-4o' | 'gemini';
  runCount: number;
  successCount: number;
  failCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}
