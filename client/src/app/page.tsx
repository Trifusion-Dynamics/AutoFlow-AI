"use client";

import Link from "next/link";
import { 
  Zap, 
  Bot, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  Play, 
  CheckCircle2,
  Globe,
  Terminal,
  Activity,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModernBackground } from "@/components/ui/modern-background";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-primary selection:text-white overflow-x-hidden">
      <ModernBackground />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5 h-20 px-6 md:px-12 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
             <Zap className="w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-black tracking-tighter italic glow-text">AutoFlow AI</span>
        </motion.div>
        
        <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
           {["Technology", "Solutions", "Documentation", "Pricing"].map((item) => (
             <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-primary transition-colors hover:tracking-[0.4em] duration-300">
               {item}
             </a>
           ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
           <Link href="/login">
             <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest hover:bg-white/5 px-6">Sign In</Button>
           </Link>
           <Link href="/register">
             <Button className="bg-primary text-white hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest px-8 rounded-full h-12 shadow-2xl shadow-primary/30 border border-white/10">
                INITIALIZE KEY
             </Button>
           </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-56 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-[10px] font-black uppercase tracking-[0.2em]"
          >
             <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
             <span className="text-primary-foreground/60">System Status:</span>
             <span className="text-primary">All Engines Operational</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-[9rem] font-black tracking-tighter leading-[0.8] italic"
          >
            BEYOND <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient-x px-4">
              AUTOMATION
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="max-w-3xl mx-auto text-xl md:text-2xl text-white/40 font-medium leading-relaxed"
          >
            The world's most advanced engine for autonomous AI agents. <br className="hidden md:block" />
            Build, scale, and orchestrate complex cognitive workflows with sub-50ms latency.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8"
          >
             <Link href="/register">
                <Button className="h-20 px-12 rounded-[2.5rem] bg-primary text-white hover:bg-primary/80 text-sm font-black italic tracking-[0.2em] group shadow-[0_0_50px_-12px_rgba(var(--primary),0.5)]">
                  START BUILDING
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-3 transition-transform" />
                </Button>
             </Link>
             <Button variant="outline" className="h-20 px-12 rounded-[2.5rem] border-white/10 bg-white/5 hover:bg-white/10 text-sm font-black italic tracking-[0.2em] gap-4 backdrop-blur-md">
                <Play className="w-6 h-6 fill-current text-primary" />
                WATCH DEMO
             </Button>
          </motion.div>
        </div>

        {/* Hero Visual - Dynamic Code Terminal */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="max-w-6xl mx-auto mt-32 relative group"
        >
           <div className="absolute inset-0 bg-primary/20 blur-[120px] -z-10 group-hover:bg-primary/30 transition-colors duration-1000" />
           <div className="glass border border-white/10 rounded-[3rem] p-1 shadow-2xl overflow-hidden aspect-video md:aspect-[21/9]">
              <div className="w-full h-full bg-black/60 rounded-[2.8rem] flex border border-white/5 overflow-hidden backdrop-blur-3xl">
                 <div className="w-16 border-r border-white/5 hidden md:flex flex-col items-center py-8 text-white/10 font-mono text-xs gap-6">
                    {Array.from({ length: 12 }).map((_, i) => <span key={i}>{i + 1}</span>)}
                 </div>
                 <div className="flex-1 p-10 font-mono text-sm md:text-md leading-relaxed">
                    <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
                       <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40" />
                       </div>
                       <span className="text-[10px] text-white/20 uppercase tracking-widest ml-4 font-black">main.ts — autoflow-core-v2</span>
                    </div>
                    <p className="text-white/60">
                       <span className="text-primary italic">const</span> engine = <span className="text-primary italic">new</span> AutoFlow(<span className="text-zinc-600">process.env.API_KEY</span>);<br /><br />
                       <span className="text-zinc-500">// Initialize autonomous reasoning chain</span><br />
                       <span className="text-primary italic">await</span> engine.spawn(<span className="text-orange-400">"research-analyst"</span>, {"{"}<br />
                       &nbsp;&nbsp;<span className="text-zinc-400">model:</span> <span className="text-green-400">"gpt-4-turbo"</span>,<br />
                       &nbsp;&nbsp;<span className="text-zinc-400">tools:</span> [<span className="text-green-400">"web-search"</span>, <span className="text-green-400">"code-interpreter"</span>],<br />
                       &nbsp;&nbsp;<span className="text-zinc-400">strategy:</span> <span className="text-green-400">"recursive_reflection"</span><br />
                       {"}"});<br /><br />
                       <span className="text-primary font-black">&gt; EXECUTION STARTED: <span className="text-green-400">AGENT_ONLINE</span></span>
                    </p>
                 </div>
              </div>
           </div>
        </motion.div>
      </section>

      {/* Metrics Section */}
      <section className="py-32 border-y border-white/5 bg-white/[0.01] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
             {[
               { val: "2.4M", label: "Workflows/Day" },
               { val: "<42ms", label: "AVG Latency" },
               { val: "99.99%", label: "Uptime SLA" },
               { val: "2k+", label: "Integrations" }
             ].map((stat, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className="space-y-2"
               >
                  <div className="text-4xl md:text-6xl font-black italic tracking-tighter text-primary">{stat.val}</div>
                  <div className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30">{stat.label}</div>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="technology" className="py-56 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto space-y-32">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
             <h2 className="text-4xl md:text-7xl font-black italic tracking-tighter">ENGINEERED FOR <br/> <span className="text-primary">INFINITE</span> SCALE.</h2>
             <p className="text-white/40 font-medium text-lg leading-relaxed">
               Built on a distributed reactive foundation, AutoFlow handles the complexity of state management, error recovery, and tool integration so you can focus on building intelligence.
             </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <FeatureCard 
              icon={Bot} 
              title="Reactive Agents" 
              desc="Not a simple linear pipeline. Our agents continuously monitor their environment, reflect on results, and self-correct logic in real-time." 
            />
            <FeatureCard 
              icon={Layers} 
              title="Global State Sync" 
              desc="Atomic state consistency across thousands of parallel agent nodes. Native support for complex nested data structures and real-time syncing." 
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Enterprise Security" 
              desc="End-to-end encryption for all AI inferences. SOC2 compliant infrastructure with granular RBAC and audit logs for every cognitive step." 
            />
          </div>
        </div>
      </section>

      {/* CTA Footer Wrapper */}
      <section className="py-56 px-6 text-center relative overflow-hidden border-t border-white/5">
         <div className="max-w-3xl mx-auto space-y-12 relative z-10">
            <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter">READY TO <br/> DEPLOY?</h2>
            <p className="text-white/40 text-lg font-medium">Join the next generation of AI-native engineering today.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Link href="/register">
                 <Button className="h-20 px-12 rounded-full bg-white text-black hover:bg-zinc-200 text-sm font-black italic tracking-widest shadow-2xl">
                    CREATE ACCOUNT
                 </Button>
               </Link>
               <Button variant="ghost" className="h-20 px-12 rounded-full text-white hover:bg-white/5 text-sm font-black italic tracking-widest flex items-center gap-3">
                  <Terminal className="w-6 h-6" />
                  READ DOCS
               </Button>
            </div>
         </div>
      </section>

      <footer className="py-20 px-6 border-t border-white/5 bg-black">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center translate-z-0 group-hover:rotate-[20deg] transition-transform">
                 <Zap className="w-7 h-7 fill-current" />
              </div>
              <span className="text-3xl font-black tracking-tighter italic glow-text">AutoFlow AI</span>
            </div>
            
            <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
               <Link href="#" className="hover:text-primary">Twitter</Link>
               <Link href="#" className="hover:text-primary">Github</Link>
               <Link href="#" className="hover:text-primary">Discord</Link>
            </div>

            <p className="text-white/10 text-[10px] font-black uppercase tracking-[0.5em] italic">
               © 2026 COGNITIVE SYSTEMS INC.
            </p>
         </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <motion.div 
      whileHover={{ y: -10, transition: { duration: 0.2 } }}
      className="p-12 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-primary/30 transition-all duration-500 group relative overflow-hidden"
    >
       <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-colors" />
       <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mb-10 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
          <Icon className="w-10 h-10" />
       </div>
       <h3 className="text-2xl font-black italic mb-6 tracking-tight">{title}</h3>
       <p className="text-md text-white/30 leading-relaxed font-medium group-hover:text-white/50 transition-colors">
          {desc}
       </p>
    </motion.div>
  );
}
