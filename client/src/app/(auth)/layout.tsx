import { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      {/* Left side - Visuals */}
      <div className="hidden md:flex flex-col w-1/2 p-12 bg-surface-card border-r border-surface-border relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-30 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-16">
            <div className="bg-brand-500 rounded p-1">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">AutoFlow AI</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 animate-fade-up">
              Automate your <br/>
              <span className="gradient-text">Business at Scale</span>
            </h1>
            
            <p className="text-muted-foreground text-lg mb-8 max-w-md animate-fade-up" style={{ animationDelay: "100ms" }}>
              Join thousands of developers building AI-powered workflows without writing boilerplate code.
            </p>

            <ul className="space-y-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
              {[
                "100K free tokens to start",
                "Claude, GPT-4o, and Gemini models included",
                "No credit card required",
                "Deploy production workflows in 5 minutes"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-white">
                  <CheckCircle2 className="h-5 w-5 text-brand-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-8 border-t border-surface-border/50 animate-fade-up" style={{ animationDelay: "300ms" }}>
            <blockquote className="space-y-4">
              <p className="text-lg italic text-white/90">
                &quot;AutoFlow AI replaced our entire messy Zapier setup. The developer APIs and AI execution streaming are miles ahead.&quot;
              </p>
              <footer className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  SK
                </div>
                <div>
                  <div className="font-semibold text-white">Sarah K.</div>
                  <div className="text-sm text-muted-foreground">Lead Developer, TechCorp</div>
                </div>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
