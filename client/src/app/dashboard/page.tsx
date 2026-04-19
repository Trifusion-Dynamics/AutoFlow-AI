"use client";

import { useState } from "react";
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
  ArrowRight
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

export default function DashboardOverview() {
  const { user, org } = useAuthStore();

  return (
    <div className="space-y-10 pb-10">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden p-10 rounded-[3rem] bg-foreground text-background shadow-2xl group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -z-10 group-hover:scale-150 transition-transform duration-1000" />
         <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/10 blur-[80px] -z-10" />
         
         <div className="max-w-2xl space-y-6 relative">
            <Badge className="bg-primary text-white border-none font-black italic tracking-widest px-4 py-1">
               WORKSPACE v2.4
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none italic">
               WELCOME BACK, <br />
               <span className="text-primary uppercase">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-zinc-400 font-medium leading-relaxed">
               Your autonomous AI engine is running in <span className="text-white">DYNAMIC_BURST</span> mode. 24 active nodes are currently processing live telemetry.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
               <Link href="/dashboard/workflows/new">
                  <Button className="h-14 px-10 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black italic tracking-widest shadow-xl shadow-primary/20">
                     INITIALIZE WORKFLOW
                  </Button>
               </Link>
               <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold gap-3">
                  <Zap className="w-5 h-5" />
                  View Quickstart
               </Button>
            </div>
         </div>

         {/* Stats overlay */}
         <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 gap-8">
            <div className="text-center group">
               <div className="text-5xl font-black text-primary italic tracking-tighter">98.2<span className="text-xs uppercase ml-1">%</span></div>
               <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">Uptime</div>
            </div>
            <div className="text-center">
               <div className="text-5xl font-black text-white italic tracking-tighter">12<span className="text-xs uppercase ml-1">ms</span></div>
               <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">Latency</div>
            </div>
         </div>
      </div>

      {/* Getting Started Guide */}
      <div className="grid md:grid-cols-3 gap-8">
         <Card className="glass border-none rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all group overflow-hidden">
            <CardContent className="p-8 space-y-4">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <GitBranch className="w-6 h-6" />
               </div>
               <div className="space-y-1">
                  <h3 className="font-black text-lg">Create Logic</h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed italic">Design your first autonomous flow using our drag-and-drop canvas or SDK.</p>
               </div>
               <Button variant="link" className="p-0 h-auto text-primary font-black uppercase text-[10px] tracking-widest items-center">
                  Get Started <ArrowRight className="ml-2 w-3 h-3" />
               </Button>
            </CardContent>
         </Card>

         <Card className="glass border-none rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all group overflow-hidden border-b-4 border-primary/20">
            <CardContent className="p-8 space-y-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
               </div>
               <div className="space-y-1">
                  <h3 className="font-black text-lg">Establish Sockets</h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed italic">Connect your production environment to receive real-time execution streams.</p>
               </div>
               <Button variant="link" className="p-0 h-auto text-blue-500 font-black uppercase text-[10px] tracking-widest items-center">
                  Configure SDK <ArrowRight className="ml-2 w-3 h-3" />
               </Button>
            </CardContent>
         </Card>

         <Card className="glass border-none rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all group overflow-hidden">
            <CardContent className="p-8 space-y-4">
               <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
               </div>
               <div className="space-y-1">
                  <h3 className="font-black text-lg">Scale Globally</h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed italic">Distribute your workflows across multiple cloud providers with zero latency.</p>
               </div>
               <Button variant="link" className="p-0 h-auto text-orange-500 font-black uppercase text-[10px] tracking-widest items-center">
                  Upgrade Plan <ArrowRight className="ml-2 w-3 h-3" />
               </Button>
            </CardContent>
         </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         {/* Recent Activity */}
         <Card className="lg:col-span-2 glass border-none rounded-[2.5rem] shadow-xl overflow-hidden">
            <CardHeader className="p-10 pb-6 border-b border-white/5">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-black italic">Recent Executions</CardTitle>
                  <Link href="/dashboard/executions">
                     <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">View All</Button>
                  </Link>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-white/5">
                  {[
                     { id: 'ex_124', name: 'Lead Extraction Agent', status: 'Success', time: '2m ago', duration: '1.2s' },
                     { id: 'ex_123', name: 'Slack Summary Cycle', status: 'Success', time: '15m ago', duration: '0.8s' },
                     { id: 'ex_122', name: 'Zendesk Routing Agent', status: 'In-Progress', time: 'Just now', duration: '-' },
                     { id: 'ex_121', name: 'Github PR Auditor', status: 'Failed', time: '1h ago', duration: '4.5s' },
                  ].map((ex) => (
                     <div key={ex.id} className="p-6 px-10 flex items-center justify-between hover:bg-white/2 transition-colors group">
                        <div className="flex items-center gap-6">
                           <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              ex.status === 'Success' ? "bg-green-500/10 text-green-500" :
                              ex.status === 'In-Progress' ? "bg-primary/10 text-primary animate-pulse" :
                              "bg-red-500/10 text-red-500"
                           )}>
                              {ex.status === 'Success' ? <CheckCircle2 className="w-5 h-5" /> :
                               ex.status === 'In-Progress' ? <Play className="w-5 h-5" /> :
                               <AlertCircle className="w-5 h-5" />
                              }
                           </div>
                           <div>
                              <div className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{ex.name}</div>
                              <div className="text-[10px] font-black uppercase tracking-widest opacity-30">{ex.id} • {ex.time}</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="font-mono text-xs font-bold opacity-60">{ex.duration}</div>
                           <Badge variant="outline" className={cn(
                              "h-5 text-[8px] font-black border-none px-2",
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

         {/* Usage Pulse */}
         <Card className="glass border-none rounded-[2.5rem] shadow-xl overflow-hidden">
             <CardHeader className="p-10">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] opacity-30">Consumption</CardTitle>
             </CardHeader>
             <CardContent className="px-10 pb-10 space-y-8">
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <div className="text-4xl font-black italic tracking-tighter">64.2%</div>
                      <div className="text-[10px] font-black uppercase opacity-30">Monthly Quota</div>
                   </div>
                   <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all duration-1000" style={{ width: '64.2%' }} />
                   </div>
                </div>

                <div className="space-y-6 pt-6 divide-y divide-white/5">
                   <div className="flex justify-between py-2">
                      <span className="text-[10px] font-black uppercase opacity-30 tracking-widest">Active Flows</span>
                      <span className="text-xs font-black italic">14 / 20</span>
                   </div>
                   <div className="flex justify-between py-2">
                      <span className="text-[10px] font-black uppercase opacity-30 tracking-widest">API Calls</span>
                      <span className="text-xs font-black italic">24,582</span>
                   </div>
                   <div className="flex justify-between py-2">
                      <span className="text-[10px] font-black uppercase opacity-30 tracking-widest">Execution Hours</span>
                      <span className="text-xs font-black italic">12.4h</span>
                   </div>
                </div>

                <Link href="/dashboard/billing">
                  <Button variant="ghost" className="w-full h-12 rounded-2xl border border-white/5 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest">
                     Manage Subscription
                  </Button>
                </Link>
             </CardContent>
         </Card>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
