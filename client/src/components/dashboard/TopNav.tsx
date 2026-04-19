'use client';

import { useAuthStore } from "@/lib/store/authStore";
import { format } from "date-fns";
import { Bell, Search, Command, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopNav() {
  const { user, logout } = useAuthStore();
  const today = format(new Date(), 'EEEE, MMMM d');

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <div className="h-16 border-b border-surface-border bg-surface-card/50 backdrop-blur flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-all">
      
      {/* Mobile Menu Trigger */}
      <div className="md:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="hidden md:flex items-center text-sm font-medium text-muted-foreground w-1/3">
        {today}
      </div>

      <div className="flex-1 flex justify-center md:w-1/3">
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search workflows, executions..." 
            className="w-full pl-9 pr-12 bg-background border-surface-border h-9"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-surface-border bg-surface-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" /> K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-4 md:w-1/3">
        <Button variant="ghost" size="icon" className="relative hover:bg-surface-hover">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="relative h-8 w-8 rounded-full ml-2 border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 font-medium">
              {getInitials(user?.name || '')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-surface-card border-surface-border" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-surface-border" />
            <DropdownMenuItem className="focus:bg-surface-hover cursor-pointer">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-surface-hover cursor-pointer">
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-surface-hover cursor-pointer">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-surface-border" />
            <DropdownMenuItem 
              className="focus:bg-destructive/10 focus:text-destructive text-destructive cursor-pointer"
              onClick={() => logout()}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </div>
  );
}
