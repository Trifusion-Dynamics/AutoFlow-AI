"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, Loader2, ShieldCheck, Mail, Lock, Cpu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ModernBackground } from "@/components/ui/modern-background";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("MISSING_CREDENTIALS", {
        description: "Please enter your cognitive credentials to continue.",
      });
      return;
    }

    try {
      await login(email, password);
      toast.success("ACCESS_GRANTED", {
        description: "Decryption successful. Welcome back to the engine.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      // Use normalized error message from apiClient
      const errorMessage = error.message || "Invalid signature. Access denied.";
      
      toast.error("AUTHENTICATION_FAILED", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-black overflow-hidden relative selection:bg-primary/30">
      <ModernBackground />
      
      {/* Left: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-24 z-10 relative">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full mx-auto space-y-12"
        >
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-4 group mb-12">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.3)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <Zap className="text-white w-7 h-7 fill-current" />
              </div>
              <span className="text-3xl font-black tracking-tighter italic glow-text">AutoFlow AI</span>
            </Link>
            <h1 className="text-5xl font-black tracking-tighter italic leading-tight">INITIALIZE <br/> <span className="text-primary">SESSION</span></h1>
            <p className="text-white/40 font-medium">Connect to the distributed engine to manage your autonomous agents.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="relative group"
               >
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="email" 
                    placeholder="ENGINE_ID@ORGANIZATION.IO" 
                    className="h-16 pl-14 bg-white/[0.03] border-white/5 rounded-3xl focus:border-primary/50 focus:ring-primary/20 text-sm font-mono tracking-wider transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
               </motion.div>
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.3 }}
                 className="relative group"
               >
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="password" 
                    placeholder="ENCRYPTION_KEY" 
                    className="h-16 pl-14 bg-white/[0.03] border-white/5 rounded-3xl focus:border-primary/50 focus:ring-primary/20 text-sm font-mono tracking-wider transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
               </motion.div>
            </div>
            
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-5 h-5 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  <input type="checkbox" className="hidden" />
                  <div className="w-2 h-2 rounded-sm bg-primary opacity-0 group-hover:opacity-40 transition-opacity" />
                </div>
                <span className="text-white/40 group-hover:text-white/60 transition-colors">Persistent Node</span>
              </label>
              <Link href="#" className="text-primary hover:text-primary/80 transition-colors">Key Recovery?</Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-18 rounded-[2rem] bg-primary hover:bg-primary/80 shadow-2xl shadow-primary/20 text-sm font-black italic tracking-[0.2em] group border border-white/10"
              disabled={isLoading}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span>AUTHENTICATING...</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <span>ESTABLISH LINK</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </form>

          <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            Node unregistered? <Link href="/register" className="text-primary hover:tracking-[0.4em] transition-all">Request Authorization</Link>
          </p>
        </motion.div>
      </div>

      {/* Right: Technical Visual */}
      <div className="hidden lg:flex flex-1 bg-white/[0.01] border-l border-white/5 relative items-center justify-center p-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-xl glass rounded-[3rem] p-12 space-y-12 border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <ShieldCheck className="text-primary w-8 h-8" />
              </div>
              <div>
                <div className="font-black text-xl italic tracking-tight">SECURE_GATE v2.4</div>
                <div className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   AES-512 Encrypted
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center">
              <Cpu className="text-white/20 w-5 h-5" />
            </div>
          </div>

          {/* Terminal Animation */}
          <div className="space-y-4 font-mono text-[11px] text-primary/40 p-8 rounded-[2rem] bg-black/40 border border-white/5">
            {[
              "INITIALIZING_HANDSHAKE...",
              "VERIFYING_CORE_PROTOCOL... [OK]",
              "LOADING_DISTRIBUTED_KV...",
              "SYNCING_LOCAL_NODE_ID: 0x82...F4",
              "SYSTEM_READY_FOR_CREDENTIALS."
            ].map((line, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.2 }}
                className="flex gap-4"
              >
                <span className="text-white/10">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                <span className={i === 1 || i === 4 ? "text-primary/80" : ""}>&gt; {line}</span>
              </motion.div>
            ))}
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 relative group">
             <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
             <p className="italic text-white/40 text-sm leading-relaxed relative z-10">
               "Automating our cognitive distribution became 10x faster with AutoFlow's reactive engine. It's not just a tool; it's infrastructure."
             </p>
             <div className="mt-8 flex items-center gap-4 relative z-10">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent shadow-lg shadow-primary/20" />
               <div className="text-[10px] font-black uppercase tracking-[0.3em]">Lead Engineer @ NeuralStack</div>
             </div>
          </div>

          {/* Global Network Visual */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10 animate-pulse-slow" />
        </motion.div>
      </div>
    </div>
  );
}
