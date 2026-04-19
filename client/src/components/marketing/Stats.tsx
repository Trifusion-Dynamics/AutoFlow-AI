'use client';

import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { useInView } from "react-intersection-observer";

export function Stats() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div className="py-24 bg-[#05050A] border-y border-white/5 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center items-center justify-center">
          
          {[
            { end: 10, suffix: "M+", label: "Tasks Automated Yearly" },
            { end: 99.9, suffix: "%", decimals: 1, label: "Platform Uptime" },
            { end: 120, suffix: "+", label: "Native API Integrations" },
            { end: 15, suffix: "k+", label: "Developers Onboarded" }
          ].map((stat, idx) => (
             <div key={idx} className="space-y-4 group">
               <div className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_25px_rgba(99,102,241,0.2)] group-hover:drop-shadow-[0_0_35px_rgba(99,102,241,0.5)] transition-all">
                 {inView ? <AnimatedCounter end={stat.end} decimals={stat.decimals} suffix={stat.suffix} /> : "0"}
               </div>
               <div className="text-xs font-black text-brand-400 uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                 {stat.label}
               </div>
             </div>
          ))}

        </div>
      </div>
    </div>
  );
}
