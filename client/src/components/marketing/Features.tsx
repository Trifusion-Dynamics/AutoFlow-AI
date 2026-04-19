'use client';

import { useInView } from "react-intersection-observer";
import { Zap, Activity, Link as LinkIcon, Shield, Globe, Clock, Workflow, Command, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Features() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div id="features" className="py-32 bg-[#05050A] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
      
      {/* Background glow for the section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[600px] bg-brand-600/10 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-sm font-black text-brand-500 uppercase tracking-[0.3em] mb-4">Enterprise Infrastructure</h2>
          <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-6">
            A complete cognitive OS.
          </h3>
          <p className="text-xl text-slate-400">
            Everything you need to orchestrate autonomous AI agents at scale. Built for reliability, security, and raw speed.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Feature Bento 1 - Large Span */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 glass p-8 md:p-12 rounded-[2.5rem] border border-white/5 hover:border-brand-500/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 blur-[100px] group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-8">
                <Workflow className="h-7 w-7 text-brand-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4">Universal Agent Orchestration</h3>
              <p className="text-slate-400 text-lg max-w-lg mb-8 leading-relaxed">
                Connect any LLM to your internal APIs seamlessly. Our orchestration engine handles execution contexts, infinite loops, tool mapping, and prompt routing automatically.
              </p>
              {/* Fake UI Element inside Bento */}
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center gap-4 max-w-sm font-mono text-sm shadow-2xl">
                 <div className="w-10 h-10 rounded-full border border-dashed border-slate-600 flex items-center justify-center animate-spin-slow">
                   <Command className="w-4 h-4 text-slate-400" />
                 </div>
                 <div className="flex-1">
                   <div className="flex justify-between text-xs mb-2">
                     <span className="text-white">Execution Sync</span>
                     <span className="text-brand-400">99.9%</span>
                   </div>
                   <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                     <div className="w-[99.9%] h-full bg-brand-500 rounded-full glow-brand" />
                   </div>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Feature Bento 2 - Single */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass p-8 md:p-12 rounded-[2.5rem] border border-white/5 hover:border-purple-500/30 transition-all group relative overflow-hidden bg-gradient-to-b from-transparent to-purple-900/10"
          >
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-8">
                <Shield className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Zero-Trust Security</h3>
              <p className="text-slate-400 leading-relaxed mb-8 flex-1">
                Your credentials are encrypted at rest with AES-256. Private VPC deployments available for enterprise tenants.
              </p>
              
              <div className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl">
                 <div className="flex items-center gap-2"><Key className="w-4 h-4 text-purple-400" /> <span className="text-xs font-semibold text-white">API_KEY_ENCRYPT</span></div>
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </motion.div>

          {/* Feature Bento 3 - Single */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass p-8 md:p-12 rounded-[2.5rem] border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8">
                <Globe className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Multi-Model Substrate</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Switch LLMs dynamically based on task complexity without changing your codebase.
              </p>
              <div className="flex flex-wrap gap-2">
                 <span className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-300">GPT-4o</span>
                 <span className="text-xs px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300">Claude 3.5</span>
                 <span className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-300">Gemini Pro</span>
              </div>
            </div>
          </motion.div>

          {/* Feature Bento 4 - Large Span */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 glass p-8 md:p-12 rounded-[2.5rem] border border-white/5 hover:border-orange-500/30 transition-all group relative overflow-hidden flex flex-col md:flex-row items-center gap-10"
          >
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 blur-[100px] group-hover:scale-110 transition-transform" />
            <div className="relative z-10 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-8">
                <Activity className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4">Real-time Telemetry</h3>
              <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
                Stream execution traces directly to your dashboard via SSE. Debug AI thought processes and tool payloads as they happen.
              </p>
            </div>
            <div className="relative z-10 flex-1 w-full flex flex-col gap-3">
               {/* Telemetry Mock UI */}
               {[
                 { log: "> Tool Called: extract_pdf", time: "12ms", c: "text-blue-400" },
                 { log: "> Extracting variables...", time: "80ms", c: "text-slate-400" },
                 { log: "✓ Variable extracted", time: "115ms", c: "text-green-400" }
               ].map((item, i) => (
                 <div key={i} className="flex justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-xs font-mono">
                   <span className={item.c}>{item.log}</span>
                   <span className="text-slate-600">{item.time}</span>
                 </div>
               ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
