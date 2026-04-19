import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  return (
    <div className="py-32 bg-[#05050A] relative overflow-hidden">
      
      {/* Immersive Space Lighting Effect */}
      <div className="absolute inset-0 bg-brand-900/20 mix-blend-screen pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[500px] bg-brand-500/20 blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-20 mix-blend-overlay pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-400/30 bg-brand-500/10 text-brand-300 text-xs sm:text-sm font-black uppercase tracking-widest mb-8 backdrop-blur-md">
           <Sparkles className="w-4 h-4" /> The future of work is autonomous.
        </div>

        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8 leading-[1.1]">
          Ready to supercharge
          <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">your organization?</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
          Join thousands of developers building cognitive workflows. Break free from rigid logic paths today.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full h-16 px-12 text-lg font-black tracking-wide rounded-[2rem] bg-brand-600 hover:bg-brand-500 text-white shadow-[0_0_50px_rgba(99,102,241,0.4)] transition-all group overflow-hidden relative">
              <span className="relative z-10 flex items-center">
                 Start Building For Free
                 <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </Link>
          <Link href="/contact" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full h-16 px-12 text-lg font-bold tracking-wide rounded-[2rem] border-white/20 text-white hover:bg-white/5 transition-colors glass">
              Talk to Enterprise Sales
            </Button>
          </Link>
        </div>

        <div className="mt-12 text-sm text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-6">
           <span>No Credit Card Required</span>
           <span className="w-1 h-1 bg-slate-700 rounded-full" />
           <span>Cancel Anytime</span>
        </div>
      </div>
    </div>
  );
}
