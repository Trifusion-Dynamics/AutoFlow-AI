'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Terminal, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LiveDemo() {
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);

  const startDemo = () => {
    setRunning(true);
    setComplete(false);
    setTimeout(() => {
      setComplete(true);
    }, 6500);
  };

  return (
    <div id="demo" className="py-32 bg-[#05050A] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-brand-600/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-sm font-black text-brand-400 uppercase tracking-[0.3em] mb-4">Interactive Demo</h2>
          <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-6">
            Agent tracing in real-time
          </h3>
          <p className="text-lg text-slate-400">
            Click run to test our &quot;Invoice Processing&quot; agent live. See exactly how the AI breaks down tasks into discrete API calls.
          </p>
        </div>

        <div className="max-w-5xl mx-auto relative group">
          {/* Glass framing glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          
          <div className="relative glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl bg-black/60 backdrop-blur-2xl">
            {/* Window header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-black/50 rounded-full border border-white/5">
                <Terminal className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">agent_trace.log</span>
              </div>
              <Button 
                size="sm" 
                className="h-8 rounded-full px-4 border border-brand-500/30 bg-brand-500/20 hover:bg-brand-500 text-white font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                onClick={startDemo} 
                disabled={running && !complete}
              >
                <Play className="h-3 w-3 mr-2 fill-current" /> {running && !complete ? 'Executing...' : 'Run Simulation'}
              </Button>
            </div>
            
            {/* Terminal Body */}
            <div className="p-8 font-mono text-sm h-[400px] overflow-y-auto custom-scrollbar space-y-4">
              {!running ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                  <Zap className="w-12 h-12 text-slate-600 mb-2" />
                  <div className="uppercase tracking-[0.2em] font-black text-xs">Awaiting Execution Signal</div>
                  <div className="text-[10px]">Click [Run Simulation] to initialize the workflow engine.</div>
                </div>
              ) : (
                <AnimatePresence>
                  <div className="space-y-4">
                    <MockLog delay={0.1} c="text-brand-400 font-bold">&gt; SIGNAL RECEIVED: `invoice.uploaded`</MockLog>
                    <MockLog delay={0.5} c="text-slate-400">&gt; Booting isolated container environment...</MockLog>
                    <MockLog delay={1} c="text-green-400 bg-green-500/10 px-2 py-1 rounded inline-block text-[10px] font-black uppercase tracking-widest">✓ Environment ready (102ms)</MockLog>
                    <MockLog delay={1.5} c="text-slate-400 opacity-70">&gt; Allocating cognitive resources (Model: Claude 3.5 Sonnet)</MockLog>
                    
                    <MockLog delay={2.2} c="text-blue-400 border-l-2 border-blue-500/50 pl-3 ml-2 mt-4">
                      <div className="font-bold flex items-center gap-2 mb-1"><Zap className="w-3 h-3 fill-current animate-pulse" /> TOOL INVOCATION: `vision_extract`</div>
                      <div className="text-slate-400 text-xs mt-1 bg-black/40 p-2 rounded">Payload: &#123; file_id: "inv_992", fields: ["total", "vendor_name"] &#125;</div>
                    </MockLog>
                    
                    <MockLog delay={3.5} c="text-green-400 border-l-2 border-green-500/50 pl-3 ml-2">
                       <div className="font-bold text-xs uppercase tracking-widest">↳ Result:</div>
                       <div className="text-slate-300 text-xs mt-1 bg-green-500/5 p-2 rounded whitespace-pre-wrap">
                          &#123;
                            "vendor_name": "Acme Corp.",
                            "total": 4200.00
                          &#125;
                       </div>
                    </MockLog>

                    <MockLog delay={4.5} c="text-blue-400 border-l-2 border-blue-500/50 pl-3 ml-2 mt-4">
                      <div className="font-bold flex items-center gap-2 mb-1"><Zap className="w-3 h-3 fill-current animate-pulse" /> TOOL INVOCATION: `netsuite_post`</div>
                      <div className="text-slate-400 text-xs mt-1 bg-black/40 p-2 rounded">Payload: &#123; type: "bill", amount: 4200.00, vendor: "Acme Corp." &#125;</div>
                    </MockLog>

                    <MockLog delay={5.5} c="text-green-400 border-l-2 border-green-500/50 pl-3 ml-2">
                       <div className="font-bold text-xs uppercase tracking-widest">↳ Result:</div>
                       <div className="text-slate-300 text-xs mt-1 bg-green-500/5 p-2 rounded">Record created successfully (ID: #89212)</div>
                    </MockLog>

                    <MockLog delay={6} c="text-white font-black mt-6 p-4 bg-brand-500/10 border border-brand-500/30 rounded-xl flex items-center justify-between">
                       <span>&gt; WORKFLOW COMPLETED</span>
                       <span className="text-brand-400 font-normal">Total time: 1.2s</span>
                    </MockLog>
                  </div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockLog({ children, delay, c }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className={c}
    >
      {children}
    </motion.div>
  );
}
