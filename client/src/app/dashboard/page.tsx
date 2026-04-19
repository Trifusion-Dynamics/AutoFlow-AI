"use client";

import { useState, useEffect } from "react";
import { 
  Zap, 
  Play, 
  GitBranch, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ModernBackground } from "@/components/ui/modern-background";

export default function DashboardOverview() {
  const { user, org, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <div className="space-y-12 pb-20 relative">
      <div className="absolute inset-0 -z-10 opacity-10">
        <ModernBackground />
      </div>

      {/* Welcome Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden p-12 rounded-[3.5rem] bg-zinc-950 text-white shadow-2xl group border border-white/5"
      >
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] -z-10 group-hover:scale-125 transition-transform duration-1000" />
         <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 blur-[100px] -z-10" />
         
         <div className="max-w-3xl space-y-8 relative">
            <Badge className="bg-primary/10 text-primary border border-primary/20 font-black italic tracking-[0.3em] px-6 py-2 rounded-full text-[10px]">
               CORE_ENGINE v2.4_STABLE
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none italic">
               SESSION STATUS: <br />
               <span className="text-primary uppercase glow-text">{user?.name?.split(' ')[0] || 'ENGINEER'}</span>
            </h1>
            <p className="text-white/40 font-medium text-lg leading-relaxed max-w-xl">
               Your autonomous cognitive infrastructure is operating at <span className="text-white font-bold">100% Efficiency</span>. 
               All distributed nodes are synced with the global reactive state.
            </p>
            <div className="flex flex-wrap gap-6 pt-4">
               <Link href="/dashboard/workflows/new">
                  <Button className="h-16 px-10 rounded-[2rem] bg-primary text-white hover:bg-primary/90 font-black italic tracking-widest shadow-2xl shadow-primary/30 border border-white/10 group">
                     INITIALIZE WORKFLOW
                     <Plus className="ml-2 w-5 h-5 group-hover:rotate-90 transition-transform" />
                  </Button>
               </Link>
               <Button variant="outline" className="h-16 px-10 rounded-[2rem] border-white/10 bg-white/5 hover:bg-white/10 font-black italic tracking-widest gap-4 backdrop-blur-md">
                  <Zap className="w-5 h-5 text-primary" />
                  QUICKSTART_GUIDE
               </Button>
            </div>
         </div>

         {/* Real-time Metrics Overlay */}
         <div className="hidden xl:flex absolute right-16 top-1/2 -translate-y-1/2 gap-12">
            <MetricBox value="99.9" unit="%" label="Sync_Rate" color="text-primary" />
            <MetricBox value="12" unit="ms" label="Avg_Latency" color="text-white" />
         </div>
      </motion.div>

      {/* Action Grid */}
      <div className="grid md:grid-cols-3 gap-8">
         <GuideCard 
           icon={GitBranch} 
           title="Cognitive Logic" 
           desc="Deploy autonomous reasoning chains using our distributed agent protocol."
           color="primary"
         />
         <GuideCard 
           icon={Activity} 
           title="Real-time Telemetry" 
           desc="Monitor every cognitive step and tool interaction in our live execution stream."
           color="blue"
         />
         <GuideCard 
           icon={ShieldCheck} 
           title="Secure Sovereignty" 
           desc="All inferences are encrypted at the edge with zero-retention by default."
           color="orange"
         />
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
         {/* Execution Stream */}
         <Card className="lg:col-span-2 glass border-none rounded-[3rem] shadow-2xl overflow-hidden backdrop-blur-xl">
            <CardHeader className="p-12 pb-8 border-b border-white/5 flex flex-row items-center justify-between">
               <div className="space-y-2">
                  <CardTitle className="text-2xl font-black italic tracking-tight">EXECUTION_STREAM</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Live Cognitive Events</CardDescription>
               </div>
               <Link href="/dashboard/executions">
                  <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] tracking-widest text-primary hover:bg-primary/10">View Log Archive</Button>
               </Link>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-white/5">
                  {[
                     { id: 'ex_124', name: 'Neural_Extraction_Agent', status: 'Success', time: '2m ago', duration: '1.2s' },
                     { id: 'ex_123', name: 'Global_Sync_Cycle', status: 'Success', time: '15m ago', duration: '0.8s' },
                     { id: 'ex_122', name: 'Bilateral_Reasoning_Loop', status: 'In-Progress', time: 'Just now', duration: '-' },
                     { id: 'ex_121', name: 'Database_Audit_Bot', status: 'Failed', time: '1h ago', duration: '4.5s' },
                  ].map((ex) => (
                     <div key={ex.id} className="p-8 px-12 flex items-center justify-between hover:bg-white/[0.02] transition-all group cursor-pointer">
                        <div className="flex items-center gap-8">
                           <div className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center border",
                              ex.status === 'Success' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                              ex.status === 'In-Progress' ? "bg-primary/10 text-primary border-primary/20 animate-pulse" :
                              "bg-red-500/10 text-red-500 border-red-500/20"
                           )}>
                              {ex.status === 'Success' ? <CheckCircle2 className="w-6 h-6" /> :
                               ex.status === 'In-Progress' ? <Play className="w-6 h-6" /> :
                               <AlertCircle className="w-6 h-6" />
                              }
                           </div>
                           <div>
                              <div className="font-black text-lg tracking-tight group-hover:text-primary transition-colors italic">{ex.name}</div>
                              <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20">{ex.id} • {ex.time}</div>
                           </div>
                        </div>
                        <div className="text-right space-y-2">
                           <div className="font-mono text-xs font-black opacity-40 italic">{ex.duration}</div>
                           <Badge variant="outline" className={cn(
                              "h-6 text-[9px] font-black border-none px-4 rounded-full",
                              ex.status === 'Success' ? "bg-green-500/10 text-green-500" :
                              ex.status === 'In-Progress' ? "bg-primary/10 text-primary" :
                              "bg-red-500/10 text-red-500"
                           )}>{ex.status.toUpperCase()}</Badge>
                        </div>
                     </div>
                  ))}
               </div>
            </CardContent>
         </Card>

         {/* Quota Pulse */}
         <Card className="glass border-none rounded-[3rem] shadow-2xl overflow-hidden self-start sticky top-28">
             <CardHeader className="p-12 pb-6">
                <CardTitle className="text-sm font-black uppercase tracking-[0.4em] opacity-20">QUOTA_UTILIZATION</CardTitle>
             </CardHeader>
             <CardContent className="px-12 pb-12 space-y-12">
                <div className="space-y-6">
                   <div className="flex justify-between items-end">
                      <div className="text-5xl font-black italic tracking-tighter glow-text">64.2%</div>
                      <div className="text-[10px] font-black uppercase opacity-20 tracking-widest">Active_Tokens</div>
                   </div>
                   <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '64.2%' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary),0.5)]" 
                      />
                   </div>
                </div>

                <div className="space-y-8 pt-4">
                   <MetricRow label="Assigned Nodes" value="14 / 20" />
                   <MetricRow label="Cognitive Ops" value="24,582" />
                   <MetricRow label="Uptime Hours" value="156.4h" />
                </div>

                <Link href="/dashboard/billing">
                  <Button variant="ghost" className="w-full h-16 rounded-[2rem] border border-white/5 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest text-primary">
                     UPGRADE_INFRASTRUCTURE
                  </Button>
                </Link>
             </CardContent>
         </Card>
      </div>
    </div>
  );
}

function MetricBox({ value, unit, label, color }: any) {
  return (
    <div className="text-center group">
       <div className={cn("text-6xl font-black italic tracking-tighter", color)}>
         {value}<span className="text-sm uppercase ml-1 opacity-40">{unit}</span>
       </div>
       <div className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 mt-4">{label}</div>
    </div>
  );
}

function GuideCard({ icon: Icon, title, desc, color }: any) {
  return (
     <Card className="glass border-none rounded-[3rem] shadow-xl hover:shadow-primary/5 hover:-translate-y-2 transition-all group overflow-hidden border-b-4 border-transparent hover:border-primary/20">
        <CardContent className="p-10 space-y-6">
           <div className={cn(
             "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
             color === 'primary' ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white" :
             color === 'blue' ? "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white" :
             "bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white"
           )}>
              <Icon className="w-8 h-8" />
           </div>
           <div className="space-y-2">
              <h3 className="font-black text-xl italic tracking-tight">{title}</h3>
              <p className="text-xs text-white/30 font-medium leading-relaxed italic group-hover:text-white/50 transition-colors">{desc}</p>
           </div>
           <Button variant="link" className="p-0 h-auto text-primary font-black uppercase text-[10px] tracking-[0.3em] items-center hover:tracking-[0.4em] transition-all">
              INITIALIZE <ArrowRight className="ml-2 w-3 h-3" />
           </Button>
        </CardContent>
     </Card>
  );
}

function MetricRow({ label, value }: any) {
   return (
      <div className="flex justify-between items-center group">
         <span className="text-[10px] font-black uppercase opacity-20 tracking-widest group-hover:opacity-40 transition-opacity">{label}</span>
         <span className="text-xs font-black italic group-hover:text-primary transition-colors">{value}</span>
      </div>
   )
}
