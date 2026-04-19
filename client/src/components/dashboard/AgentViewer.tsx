'use client';

import { useEffect, useState } from 'react';
import { Terminal, CheckCircle2, AlertCircle, Loader2, Play } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';
import { cn } from '@/lib/utils';

// Assuming we have an SSE endpoint: /api/v1/executions/:id/stream

interface AgentEvent {
  id: string;
  type: 'log' | 'tool_call' | 'tool_result' | 'status_change' | 'error';
  message: string;
  timestamp: string;
  metadata?: any;
}

export function AgentViewer({ executionId }: { executionId: string }) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<'pending' | 'running' | 'success' | 'failed'>('pending');
  const [connected, setConnected] = useState(false);

  // Mocking the SSE connection for frontend demo if actual endpoint isn't wired yet.
  useEffect(() => {
    if (!executionId) return;

    setConnected(true);
    setStatus('running');

    const demoEvents: AgentEvent[] = [
      { id: '1', type: 'log', message: 'Starting execution...', timestamp: new Date().toISOString() },
      { id: '2', type: 'log', message: 'Initializing Claude 3.5 Sonnet...', timestamp: new Date(Date.now() + 500).toISOString() },
      { id: '3', type: 'tool_call', message: 'extract_info_from_pdf', timestamp: new Date(Date.now() + 1000).toISOString(), metadata: { tool: 'extract_info_from_pdf', args: { fileId: 'doc_123' } } },
      { id: '4', type: 'tool_result', message: 'Extracted 3 fields', timestamp: new Date(Date.now() + 2500).toISOString(), metadata: { result: { total: 4200, vendor: 'Acme' } } },
      { id: '5', type: 'log', message: 'Evaluating next steps...', timestamp: new Date(Date.now() + 3000).toISOString() },
      { id: '6', type: 'tool_call', message: 'save_to_crm', timestamp: new Date(Date.now() + 3500).toISOString(), metadata: { tool: 'save_to_crm', args: { amount: 4200, vendor: 'Acme' } } },
      { id: '7', type: 'tool_result', message: 'Saved successfully', timestamp: new Date(Date.now() + 4000).toISOString(), metadata: { success: true, id: 'crm_992' } },
      { id: '8', type: 'status_change', message: 'Execution completed successfully', timestamp: new Date(Date.now() + 4500).toISOString() },
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < demoEvents.length) {
        const event = demoEvents[currentIndex];
        setEvents(prev => [...prev, event]);
        if (event.type === 'status_change') {
          setStatus('success');
        }
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);

  }, [executionId]);

  return (
    <div className="flex flex-col h-full bg-[#0A0A12] rounded-xl border border-surface-border overflow-hidden shadow-2xl font-mono text-sm max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-surface-card border-b border-surface-border">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-brand-400" />
          <span className="font-semibold text-white">Execution Trace</span>
          <span className="text-muted-foreground text-xs">{executionId}</span>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface-muted px-2 py-1 rounded border border-surface-border">
             <div className={cn("h-2 w-2 rounded-full", connected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
             {connected ? 'Live' : 'Disconnected'}
           </div>
           <StatusBadge status={status} />
        </div>
      </div>

      {/* Log View */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {events.map((event) => (
          <div key={event.id} className="animate-fade-in group">
            <div className="flex items-start gap-4">
              <div className="text-slate-500 text-xs mt-0.5 w-20 shrink-0">
                {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 2 })}
              </div>
              
              <div className="flex-1">
                {event.type === 'log' && (
                  <div className="text-slate-300">
                    <span className="text-brand-400 mr-2">&gt;</span>{event.message}
                  </div>
                )}

                {event.type === 'tool_call' && (
                  <div className="bg-surface-card/50 border border-surface-border/50 rounded shadow-sm p-3 text-blue-300 my-2">
                    <div className="flex items-center gap-2 mb-2 font-semibold">
                      <Play className="h-3 w-3 text-blue-400" /> Tool Called: {event.metadata?.tool}
                    </div>
                    {event.metadata?.args && (
                      <div className="text-xs bg-[#05050A] p-3 rounded text-blue-200/70 border border-surface-border/30 overflow-x-auto">
                        <pre>{JSON.stringify(event.metadata.args, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}

                {event.type === 'tool_result' && (
                  <div className="text-green-400 flex items-center gap-2 mt-1 mb-2 bg-green-500/10 w-fit px-3 py-1.5 rounded border border-green-500/20">
                    <CheckCircle2 className="h-3 w-3" /> {event.message}
                  </div>
                )}

                {event.type === 'status_change' && (
                  <div className="text-brand-400 font-bold mt-6 pt-4 border-t border-surface-border/30 text-base">
                    {event.message}
                  </div>
                )}

                {event.type === 'error' && (
                  <div className="text-destructive flex flex-col gap-1 mt-2 bg-destructive/10 p-3 rounded border border-destructive/20">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="h-4 w-4" /> Error during execution
                    </div>
                    <div className="text-xs">{event.message}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {status === 'running' && (
          <div className="flex items-center gap-3 text-slate-500 pt-4 pl-[96px]">
            <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
            <span className="animate-pulse">Agent is thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
}
