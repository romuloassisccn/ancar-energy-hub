import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

interface SparklineKpiCardProps {
  label: string;
  value: string;
  unit?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "critical";
  data: { t: number; v: number }[];
  color?: string;
}

const toneClasses = {
  default: "text-primary",
  success: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
} as const;

export function SparklineKpiCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "default",
  data,
  color = "var(--chart-1)",
}: SparklineKpiCardProps) {
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
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={cn("text-xl font-semibold tabular-nums tracking-tight", toneClasses[tone])}>
          {value}
        </span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-2 h-12">
        {data.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 11,
                  padding: "4px 8px",
                }}
                labelFormatter={(t) =>
                  typeof t === "number" && t > 0
                    ? new Date(t).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                    : ""
                }
                formatter={(v: any) => [
                  Number.isFinite(Number(v)) ? Number(v).toFixed(2) : "—",
                  unit ?? "valor",
                ]}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.6}
                dot={false}
                activeDot={{ r: 3, stroke: color, fill: color }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center text-[10px] text-muted-foreground">Sem série</div>
        )}
      </div>
    </div>
  );
}
