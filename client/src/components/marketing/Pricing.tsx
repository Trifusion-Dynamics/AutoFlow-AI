'use client';

import { useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { motion } from "framer-motion";

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Developer",
      description: "Perfect for testing and small side projects.",
      price: "0",
      tokens: "50,000",
      features: [
        "Local API integration",
        "3 Active Workflows",
        "Community Discord Access",
        "Basic Edge Deployment",
        "1 Day log retention"
      ],
      buttonText: "Start Free",
      popular: false,
      color: "brand"
    },
    {
      name: "Pro",
      description: "For professionals running production automations.",
      price: annual ? "39" : "49",
      tokens: "5,000,000",
      features: [
        "Unlimited Workflows",
        "Priority Support SLA",
        "Premium Vector Databases",
        "30 Day trace retention",
        "SSO Single Sign-On",
        "Team Collaboration (up to 5)",
        "DDoS Protection"
      ],
      buttonText: "Start 14-Day Trial",
      popular: true,
      color: "purple"
    },
    {
      name: "Enterprise",
      description: "Custom limits and VPC deployments for large teams.",
      price: "Custom",
      tokens: "Unlimited",
      features: [
        "Custom token limits",
        "Dedicated GPU instances",
        "24/7 Phone Support",
        "Custom Integrations built for you",
        "Infinite log retention",
        "Role-based Access Control",
        "Dedicated Account Manager",
        "On-prem deployment options"
      ],
      buttonText: "Contact Sales",
      popular: false,
      color: "slate"
    }
  ];

  return (
    <div id="pricing" className="py-32 bg-[#05050A] relative overflow-hidden">
      
      {/* Abstract Backgrounds */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-500/10 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-20 px-4">
          <h2 className="text-sm font-black text-purple-400 uppercase tracking-[0.3em] mb-4">Pricing</h2>
          <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-6">
            Scale infinitely. Pay predictably.
          </h3>
          <p className="text-xl text-slate-400 mb-10">
            Start free, upgrade when your agents need more cognitive power.
          </p>

          <div className="inline-flex glass items-center justify-center gap-4 p-2 rounded-full border border-white/5 shadow-2xl">
            <span className={cn("text-sm font-bold pl-4 transition-colors", !annual ? "text-white" : "text-slate-500")}>Monthly</span>
            <Switch checked={annual} onCheckedChange={setAnnual} className="data-[state=checked]:bg-purple-500 mx-2" />
            <span className={cn("text-sm font-bold pr-2 flex items-center gap-2 transition-colors", annual ? "text-white" : "text-slate-500")}>
              Annually <span className="text-[9px] uppercase font-black tracking-widest text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
          {plans.map((plan, idx) => {
            const isPopular = plan.popular;
            
            return (
              <motion.div 
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={cn(
                  "relative glass rounded-[2.5rem] border transition-all duration-300 hover:-translate-y-2 group overflow-hidden",
                  isPopular 
                    ? "p-10 border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20 z-10" 
                    : "p-8 border-white/5 opacity-80 hover:opacity-100 scale-95 hover:scale-100"
                )}
              >
                {isPopular && (
                  <>
                     <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                     <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[40px]" />
                     <div className="absolute top-6 right-6 flex items-center gap-1 bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-purple-500/20">
                       <Star className="w-3 h-3 fill-current" /> Popular
                     </div>
                  </>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm h-10 leading-relaxed font-medium">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    {plan.price !== "Custom" && <span className="text-2xl font-bold text-slate-500">$</span>}
                    <span className="text-6xl font-black tracking-tighter text-white">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-slate-500 font-medium">/mo</span>}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#a5b4fc] mt-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    {plan.tokens} Tokens Included
                  </div>
                </div>

                <Link href={plan.name === 'Enterprise' ? 'mailto:sales@autoflow.ai' : '/register'}>
                  <Button 
                    className={cn(
                      "w-full h-14 mb-10 text-base font-bold rounded-2xl transition-all",
                      isPopular 
                        ? "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]" 
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/5"
                    )}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>

                <div className="space-y-4">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-3">
                      <CheckCircle2 className={cn("h-5 w-5 shrink-0", isPopular ? "text-purple-400" : "text-slate-500")} />
                      <span className="text-sm font-medium text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
