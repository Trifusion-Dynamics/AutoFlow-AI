export interface Execution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'timeout';
  triggeredBy: string;
  triggerData: Record<string, any>;
  output: Record<string, any>;
  tokensUsed: number;
  durationMs?: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface LogLine {
  id: string;
  type: 'system' | 'input' | 'thought' | 'tool_call' | 'tool_result' | 'success' | 'error';
  content: string | Record<string, any>;
  timestamp: string;
  durationMs?: number;
  tokensUsed?: number;
}
