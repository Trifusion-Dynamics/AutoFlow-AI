"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, Loader2, Building2, Mail, Lock, User, ShieldCheck, Cpu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ModernBackground } from "@/components/ui/modern-background";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    orgName: ""
  });
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.orgName) {
      toast.error("INCOMPLETE_DATA", {
        description: "All fields are required for node provisioning.",
      });
      return;
    }

    try {
      await register(formData);
      toast.success("NODE_PROVISIONED", {
        description: "Organization identity established. Welcome to AutoFlow.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      // Use the normalized error message from apiClient if available
      const errorMessage = error.message || "Internal error during registration.";
      const errorDetail = error.data?.error?.details?.[0]?.message || "";
      
      toast.error("PROVISIONING_FAILED", {
        description: errorDetail || errorMessage,
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-black overflow-hidden relative selection:bg-primary/30">
      <ModernBackground />

      {/* Left: Branding & Stats */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col p-20 text-white z-10">
        <div className="absolute inset-0 bg-primary/5 blur-[100px] -z-10 animate-pulse-slow" />
        
        <Link href="/" className="relative z-10 flex items-center gap-4 group">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] group-hover:rotate-12 transition-all duration-500">
             <Zap className="text-primary w-8 h-8 fill-current" />
          </div>
          <span className="text-4xl font-black tracking-tighter italic glow-text">AutoFlow AI</span>
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-auto relative z-10 space-y-10 max-w-xl"
        >
          <div className="inline-block px-5 py-2 bg-primary/10 rounded-full border border-primary/20 backdrop-blur-xl text-[10px] font-black uppercase tracking-[0.3em] text-primary">
             INFRASTRUCTURE V2.4 READY
          </div>
          <h2 className="text-7xl font-black leading-[0.85] tracking-tighter italic">BUILD <br /> <span className="text-primary">COGNITIVE</span> <br /> NETWORKS.</h2>
          <p className="text-white/40 text-xl font-medium leading-relaxed">
            Provision your identity to start building distributed agent loops that orchestrate your entire business logic.
          </p>
          
          <div className="grid grid-cols-3 gap-10 border-t border-white/5 pt-12">
            {[
              { val: "99.9%", label: "Uptime" },
              { val: "<50ms", label: "Latency" },
              { val: "AES-512", label: "Security" }
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="text-2xl font-black italic text-primary">{stat.val}</div>
                <div className="text-[10px] uppercase font-black tracking-[0.3em] text-white/20">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right: Register Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-24 py-20 z-10 relative">
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full mx-auto space-y-12"
        >
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter italic leading-tight">CREATE <br/> <span className="text-primary">IDENTITY</span></h1>
            <p className="text-white/40 font-medium">Setup your developer account and organization entity.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Personal Identity</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="FULL_NAME" 
                      className="h-14 pl-12 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 text-xs font-mono"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                    <Input 
                      type="email" 
                      placeholder="WORK_EMAIL" 
                      className="h-14 pl-12 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 text-xs font-mono"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Organization Entity</label>
                <div className="relative group">
                  <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="ORG_NAME_OR_SLUG" 
                    className="h-14 pl-12 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 text-xs font-mono"
                    value={formData.orgName}
                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Secure Credentials</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="password" 
                    placeholder="PRIVATE_ACCESS_KEY" 
                    className="h-14 pl-12 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 text-xs font-mono"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-start gap-5">
              <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
              <p className="text-[10px] text-white/30 leading-relaxed font-medium">
                By provisioning this node, you agree to the <span className="text-primary cursor-pointer hover:underline">Algorithmic Privacy Policy</span> and our <span className="text-primary cursor-pointer hover:underline">Service Level Agreement</span> regarding data residency.
              </p>
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
                    <span>PROVISIONING...</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <span>INITIALIZE NODE</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </form>

          <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            Node already active? <Link href="/login" className="text-primary hover:tracking-[0.4em] transition-all">Establish Link</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
