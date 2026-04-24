import { cn } from "@/lib/utils";
import type { RangeKey } from "@/lib/mock-data";
import { Calendar, CalendarDays, CalendarRange } from "lucide-react";

interface RangeSelectorProps {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
}

const options: { key: RangeKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "today", label: "Hoje", icon: Calendar },
  { key: "week", label: "Esta Semana", icon: CalendarDays },
  { key: "month", label: "Este Mês", icon: CalendarRange },
];

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card/60 p-1 backdrop-blur">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
