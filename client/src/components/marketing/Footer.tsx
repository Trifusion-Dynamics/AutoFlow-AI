import Link from "next/link";
import { Zap, Code, Link2, Globe, MessageSquare, ArrowRight, Shield, Activity, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const links = {
    Product: [
      { name: "Features", href: "/features" },
      { name: "AI Agents", href: "/agents" },
      { name: "Integrations", href: "/integrations" },
      { name: "Pricing", href: "/pricing" },
      { name: "Changelog", href: "/changelog" },
      { name: "Enterprise", href: "/enterprise" },
    ],
    Developers: [
      { name: "API Reference", href: "/docs/api" },
      { name: "SDK Documentation", href: "/docs/sdk" },
      { name: "Code Examples", href: "/docs/examples" },
      { name: "Webhooks", href: "/docs/webhooks" },
      { name: "Status", href: "/status" },
      { name: "Open Source", href: "/oss" },
    ],
    Company: [
      { name: "About Us", href: "/about" },
      { name: "Blog & News", href: "/blog" },
      { name: "Careers", href: "/careers", badge: "Hiring" },
      { name: "Customers", href: "/customers" },
      { name: "Partners", href: "/partners" },
      { name: "Contact", href: "/contact" },
    ],
    Legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Data Processing", href: "/dpa" },
      { name: "Security", href: "/security" },
    ],
  };

  return (
    <footer className="relative bg-[#05050A] pt-24 overflow-hidden border-t border-surface-border">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Newsletter / CTA Section within Footer */}
        <div className="glass rounded-3xl p-8 md:p-12 mb-20 flex flex-col lg:flex-row items-center justify-between gap-10 border border-brand-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/20 blur-[80px] rounded-full" />
          
          <div className="relative z-10 max-w-xl text-center lg:text-left">
            <h3 className="text-3xl font-black tracking-tight text-white mb-4">Start automating today.</h3>
            <p className="text-muted-foreground text-lg mb-0">
              Join 10,000+ developers building autonomous AI workflows. No credit card required.
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
             <input 
               type="email" 
               placeholder="Enter your work email" 
               className="h-14 px-6 rounded-full bg-black/50 border border-surface-border text-white focus:outline-none focus:border-brand-500 w-full lg:w-80 backdrop-blur-md"
             />
             <Button className="h-14 px-8 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-bold tracking-wide">
               Get Started <ArrowRight className="ml-2 w-5 h-5" />
             </Button>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 pb-16">
          
          <div className="lg:col-span-2 space-y-8">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="bg-brand-500 rounded-xl p-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">AutoFlow AI</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              The cognitive automation engine for modern enterprises. We blend explicit workflow logic with implicit AI reasoning to drive unprecedented business efficiency.
            </p>
            
            <div className="flex items-center gap-6 text-muted-foreground">
               <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"><Shield className="w-4 h-4 text-green-500" /> SOC2 TYPE II</div>
               <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"><Lock className="w-4 h-4 text-brand-400" /> AES-256</div>
            </div>

            <div className="flex gap-4 pt-2">
              <Button variant="ghost" size="icon" className="h-10 w-10 border border-surface-border rounded-full bg-surface-muted hover:bg-brand-500 hover:text-white transition-all text-muted-foreground">
                <Code className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 border border-surface-border rounded-full bg-surface-muted hover:bg-blue-500 hover:text-white transition-all text-muted-foreground">
                <Link2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 border border-surface-border rounded-full bg-surface-muted hover:bg-blue-600 hover:text-white transition-all text-muted-foreground">
                <Globe className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 border border-surface-border rounded-full bg-surface-muted hover:bg-purple-500 hover:text-white transition-all text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-6">Product</h3>
            <ul className="space-y-4">
              {links.Product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-muted-foreground hover:text-brand-400 transition-colors text-sm font-medium flex items-center gap-2">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-6">Developers</h3>
            <ul className="space-y-4">
              {links.Developers.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-muted-foreground hover:text-brand-400 transition-colors text-sm font-medium">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-6">Company</h3>
            <ul className="space-y-4">
              {links.Company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-muted-foreground hover:text-brand-400 transition-colors text-sm font-medium flex items-center gap-2">
                    {link.name}
                    {link.badge && (
                      <span className="bg-brand-500/10 text-brand-400 text-[10px] uppercase font-black px-2 py-0.5 rounded-full border border-brand-500/20">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-6">Legal</h3>
            <ul className="space-y-4">
              {links.Legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-muted-foreground hover:text-brand-400 transition-colors text-sm font-medium">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Global Footer Bottom */}
        <div className="py-8 border-t border-surface-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground font-medium">
            © {new Date().getFullYear()} AutoFlow AI Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-surface-muted/50 px-4 py-2 rounded-full border border-surface-border">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
