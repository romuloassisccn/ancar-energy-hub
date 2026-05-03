import { cn } from "@/lib/utils";
import type { RangeKey } from "@/lib/mock-data";

interface RangeSelectorProps {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
}

const options: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Ontem" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mês" },
  { key: "quarter", label: "2 Meses" },
  { key: "year", label: "3 Meses" },
];

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card/60 p-1 backdrop-blur">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={cn(
              "inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
