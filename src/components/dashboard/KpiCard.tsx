import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "critical";
}

const toneClasses: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-primary",
  success: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
};

export function KpiCard({ label, value, unit, hint, icon: Icon, tone = "default" }: KpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <div className={cn("rounded-md bg-accent/40 p-1.5", toneClasses[tone])}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={cn("text-2xl font-semibold tabular-nums tracking-tight", toneClasses[tone])}>
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
