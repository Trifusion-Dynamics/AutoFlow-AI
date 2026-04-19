'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  LayoutDashboard, 
  Workflow, 
  Activity, 
  Key, 
  Settings, 
  CreditCard,
  Zap,
  Library,
  Users
} from "lucide-react";

const mainNav = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Workflows", href: "/dashboard/workflows", icon: Workflow },
  { title: "Executions", href: "/dashboard/executions", icon: Activity },
  { title: "Templates", href: "/dashboard/templates", icon: Library },
];

const settingsNav = [
  { title: "API Keys", href: "/dashboard/keys", icon: Key },
  { title: "Team", href: "/dashboard/team", icon: Users },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <div className="hidden md:flex flex-col w-64 bg-surface-card border-r border-surface-border h-screen sticky top-0">
      
      <div className="h-16 flex items-center px-6 border-b border-surface-border shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-brand-500 rounded p-1 group-hover:shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground truncate">
            {user?.organization?.name || "AutoFlow AI"}
          </span>
        </Link>
      </div>

      <div className="flex-1 py-6 px-3 cursor-default overflow-y-auto">
        <div className="space-y-1 mb-8">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Main
          </p>
          {mainNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-1",
                    isActive
                      ? "bg-brand-500/10 text-brand-400"
                      : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-brand-400" : "text-muted-foreground")} />
                  {item.title}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Settings & Config
          </p>
          {settingsNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-1",
                    isActive
                      ? "bg-brand-500/10 text-brand-400"
                      : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-brand-400" : "text-muted-foreground")} />
                  {item.title}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-surface-border mt-auto">
        <div className="bg-surface-muted rounded-lg p-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-brand-500/5 transition-colors group-hover:bg-brand-500/10" />
          <div className="relative z-10 flex items-center justify-between xl:flex-row flex-col xl:items-start gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">Pro Plan</p>
              <p className="text-xs text-muted-foreground mt-0.5">25k / 100k tokens</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-brand-500/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-brand-400">25%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
