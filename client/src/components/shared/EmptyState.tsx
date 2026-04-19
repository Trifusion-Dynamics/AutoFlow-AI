import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass rounded-xl border-dashed">
      <div className="mb-4 text-brand-400 bg-brand-500/10 p-4 rounded-full glow-brand">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mx-auto mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-brand-600 hover:bg-brand-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
