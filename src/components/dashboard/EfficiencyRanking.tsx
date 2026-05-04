import { cn } from "@/lib/utils";
import { tierByDeviation, type ShoppingAggregate, type ShoppingId } from "@/lib/mock-data";

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
  // Rank by deviation vs target. Without target → bottom. Without measured eff → bottom.
  const ranked = [...data].sort((a, b) => {
    const aHas = a.deviation !== null;
    const bHas = b.deviation !== null;
    if (aHas && bHas) return (a.deviation as number) - (b.deviation as number);
    if (aHas) return -1;
    if (bHas) return 1;
    return 0;
  });

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Ranking de Eficiência</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Desvio % vs meta · menor é melhor
          </p>
        </div>
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-2 py-2 text-left font-medium">Shopping</th>
              <th className="px-2 py-2 text-right font-medium">kW/TR</th>
              <th className="px-2 py-2 text-right font-medium">Meta</th>
              <th className="px-2 py-2 text-right font-medium">Desvio</th>
              <th className="px-3 py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row, idx) => {
              const hasData = row.avg_efficiency > 0;
              const hasTarget = row.target !== null;
              const tier = tierByDeviation(row.deviation);
              const style = tier === "none" ? null : tierStyles[tier];
              const isActive = selected === row.shopping_id;
              const dev = row.deviation;
              const devColor =
                dev === null
                  ? "text-muted-foreground"
                  : dev < 0
                    ? "text-success"
                    : "text-destructive";
              return (
                <tr
                  key={row.shopping_id}
                  onClick={() => onSelect(row.shopping_id)}
                  className={cn(
                    "cursor-pointer border-t border-border/60 transition-colors hover:bg-accent/30",
                    isActive && "bg-accent/40",
                  )}
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", style?.dot ?? "bg-muted")} />
                      <div>
                        <p className="font-mono text-xs font-medium">{row.shopping_id}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                          {row.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={cn("px-2 py-2.5 text-right font-mono text-xs tabular-nums", devColor)}>
                    {hasData ? row.avg_efficiency.toFixed(3) : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {hasTarget ? row.target!.toFixed(2) : "—"}
                  </td>
                  <td className={cn("px-2 py-2.5 text-right font-mono text-xs tabular-nums", devColor)}>
                    {dev === null ? "—" : `${dev > 0 ? "+" : ""}${dev.toFixed(1)}%`}
                  </td>
                  <td className={cn("px-3 py-2.5 text-right text-[11px] font-medium", style?.text ?? "text-muted-foreground")}>
                    {!hasData ? "Sem dados" : !hasTarget ? "Sem meta" : style?.label}
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
