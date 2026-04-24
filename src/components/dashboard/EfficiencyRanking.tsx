import { cn } from "@/lib/utils";
import { performanceTier, type ShoppingAggregate, type ShoppingId } from "@/lib/mock-data";

interface EfficiencyRankingProps {
  data: ShoppingAggregate[];
  selected: ShoppingId;
  onSelect: (id: ShoppingId) => void;
}

const tierStyles: Record<string, { dot: string; label: string; text: string }> = {
  excellent: { dot: "bg-success", label: "Ótimo", text: "text-success" },
  good: { dot: "bg-primary", label: "Bom", text: "text-primary" },
  warning: { dot: "bg-warning", label: "Atenção", text: "text-warning" },
  critical: { dot: "bg-destructive", label: "Crítico", text: "text-destructive" },
};

export function EfficiencyRanking({ data, selected, onSelect }: EfficiencyRankingProps) {
  // Lower kW/TR is better. Filter shoppings with no operating data to bottom.
  const ranked = [...data].sort((a, b) => {
    if (a.avg_efficiency === 0 && b.avg_efficiency === 0) return 0;
    if (a.avg_efficiency === 0) return 1;
    if (b.avg_efficiency === 0) return -1;
    return a.avg_efficiency - b.avg_efficiency;
  });

  const best = ranked.find((r) => r.avg_efficiency > 0)?.avg_efficiency ?? 1;
  const worst = ranked
    .filter((r) => r.avg_efficiency > 0)
    .reduce((a, r) => Math.max(a, r.avg_efficiency), 0) || 1;

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Ranking de Eficiência</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Menor kW/TR = melhor desempenho
          </p>
        </div>
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">#</th>
              <th className="px-2 py-2 text-left font-medium">Shopping</th>
              <th className="px-2 py-2 text-right font-medium">kW/TR</th>
              <th className="px-4 py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row, idx) => {
              const tier = performanceTier(row.avg_efficiency);
              const style = tierStyles[tier];
              const hasData = row.avg_efficiency > 0;
              const pct = hasData ? ((row.avg_efficiency - best) / Math.max(worst - best, 0.001)) * 100 : 0;
              const isActive = selected === row.shopping_id;
              return (
                <tr
                  key={row.shopping_id}
                  onClick={() => onSelect(row.shopping_id)}
                  className={cn(
                    "cursor-pointer border-t border-border/60 transition-colors hover:bg-accent/30",
                    isActive && "bg-accent/40",
                  )}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                      <div>
                        <p className="font-mono text-xs font-medium">{row.shopping_id}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                          {row.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <div className="font-mono text-sm tabular-nums">
                      {hasData ? row.avg_efficiency.toFixed(3) : "—"}
                    </div>
                    {hasData && (
                      <div className="mt-1 h-1 w-16 ml-auto overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", style.dot)}
                          style={{ width: `${Math.max(8, 100 - pct)}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className={cn("px-4 py-2.5 text-right text-[11px] font-medium", style.text)}>
                    {hasData ? style.label : "Sem dados"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
