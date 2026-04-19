'use client';

import Link from "next/link";
import { ArrowRight, PlayCircle, CheckCircle2, Webhook, Cpu, Mail, HardDrive, MessageSquare, Shield, Activity, Share2, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TypeAnimation } from 'react-type-animation';
import { motion } from "framer-motion";

export function Hero() {
  return (
    <div className="relative min-h-[100vh] flex items-center justify-center pt-32 pb-24 overflow-hidden bg-[#05050A]">
      
      {/* Dynamic Grid Background with Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('/mesh-bg.png')] opacity-10 mix-blend-screen" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        
        {/* Animated Orbs */}
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-brand-500/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] animate-float" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-20%] left-[30%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[130px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col xl:flex-row items-center gap-20">
        
        {/* Left Typography & CTA */}
        <div className="flex-1 text-center xl:text-left pt-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs sm:text-sm font-semibold mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
            </span>
            <span className="uppercase tracking-widest text-[#a5b4fc]">AutoFlow Engine v3.0 Live</span>
            <span className="mx-2 w-1 h-1 bg-brand-500 rounded-full" />
            <span className="text-white/80">Support for GPT-4o & Claude 3.5</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-8 leading-[1.05]"
          >
            Workflows that
            <br className="hidden sm:block" />
            <span className="text-brand-500 glow-text italic"> reason</span>
            <br className="hidden sm:block" />
            <span className="text-white/40">for themselves.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 mb-12 max-w-2xl mx-auto xl:mx-0 font-medium leading-relaxed"
          >
            Ditch rigid logic builders. AutoFlow AI merges explicit step-by-step triggers with autonomous cognitive agents to execute complex, multi-stage business tasks.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-4 mb-12"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-16 rounded-[2rem] px-10 bg-white hover:bg-slate-100 text-[#05050A] font-black text-lg tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all group overflow-hidden relative">
                <span className="relative z-10 flex items-center">
                   Deploy Workflow <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-brand-500 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 -z-0" />
              </Button>
            </Link>
            <Link href="#demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-16 rounded-[2rem] px-10 glass border-white/10 hover:bg-white/5 text-white font-bold text-lg tracking-wide group">
                <PlayCircle className="mr-2 w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform" />
                Interactive Demo
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-6 text-xs sm:text-sm font-semibold uppercase tracking-widest text-slate-500"
          >
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> SOC2 Compliant</div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-700" />
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Zero Data Retention</div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-700" />
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Free 50k Tokens</div>
          </motion.div>
        </div>

        {/* Right Complex Isometric Dashboard Visual */}
        <div className="flex-1 w-full max-w-2xl xl:max-w-none relative animate-fade-in hidden lg:block">
           <div className="relative w-full aspect-square max-h-[700px]">
             
             {/* Center Cognitive Core */}
             <motion.div 
               animate={{ y: [0, -15, 0] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-72 h-80 bg-surface-card/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.2)] p-6 flex flex-col"
             >
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                   <div className="flex items-center gap-3">
                      <div className="bg-brand-500/20 p-2 rounded-xl border border-brand-500/30">
                         <Cpu className="w-6 h-6 text-brand-400" />
                      </div>
                      <div>
                         <h3 className="font-black tracking-tight text-white">Logic Core</h3>
                         <p className="text-[10px] text-brand-400 font-mono uppercase tracking-widest">Awaiting Prompt</p>
                      </div>
                   </div>
                   <Activity className="w-5 h-5 text-green-500 animate-pulse" />
                </div>
                <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-4 font-mono text-xs text-slate-400 space-y-2 overflow-hidden shadow-inner">
                   <TypeAnimation
                      sequence={[
                        '> INITIATE: Invoice parsing',
                        1000,
                        '> Extracting tabular data...',
                        1000,
                        '> Analyzing cross-references',
                        1000,
                        '> Validating amounts against PO #8892',
                        1500,
                        '> Verification [SUCCESS]',
                        2000,
                        '> Sending to CRM...',
                        1000,
                      ]}
                      wrapper="div"
                      speed={70}
                      className="text-brand-300"
                      repeat={Infinity}
                   />
                </div>
             </motion.div>

             {/* Webhook Input Module */}
             <motion.div 
               animate={{ y: [0, 10, 0] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute top-[10%] left-[0%] z-20 w-56 bg-surface-muted/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
             >
                <div className="flex items-center gap-3 mb-2">
                   <Webhook className="w-5 h-5 text-blue-400" />
                   <h4 className="text-sm font-bold text-white tracking-tight">Stripe Webhook</h4>
                </div>
                <div className="text-[10px] bg-black/30 rounded p-2 text-blue-300 font-mono">
                   POST /hooks/invoice.paid
                </div>
                {/* Connecting Line Fake */}
                <CornerDownRight className="absolute -bottom-8 right-8 w-8 h-8 text-blue-500/50" />
             </motion.div>

             {/* Output Module 1: CRM */}
             <motion.div 
               animate={{ x: [0, 10, 0] }}
               transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
               className="absolute top-[20%] right-[-5%] z-40 w-48 bg-surface-muted/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
             >
                <div className="flex items-center gap-3">
                   <HardDrive className="w-5 h-5 text-orange-400" />
                   <div>
                     <h4 className="text-sm font-bold text-white tracking-tight">Salesforce</h4>
                     <Badge variant="outline" className="text-[8px] h-4 mt-1 bg-green-500/10 text-green-500 border-green-500/20">SYNCED</Badge>
                   </div>
                </div>
             </motion.div>

             {/* Output Module 2: Slack */}
             <motion.div 
               animate={{ x: [0, -10, 0] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
               className="absolute bottom-[20%] right-[5%] z-40 w-56 bg-surface-muted/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
             >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                     <MessageSquare className="w-4 h-4 text-purple-400" />
                     <h4 className="text-xs font-bold text-white tracking-tight">#finance-alerts</h4>
                  </div>
                  <Share2 className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="text-[10px] bg-white/5 border border-white/5 rounded-lg p-2 text-purple-200">
                   &quot;New invoice $4,200 processed. Matched with PO successfully.&quot;
                </div>
             </motion.div>

           </div>
        </div>
      </div>
    </div>
  );
}
