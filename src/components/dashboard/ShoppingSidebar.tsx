import { cn } from "@/lib/utils";
import {
  SHOPPING_IDS,
  SHOPPING_NAMES,
  performanceTier,
  type ShoppingAggregate,
  type ShoppingId,
} from "@/lib/mock-data";


interface ShoppingSidebarProps {
  selected: ShoppingId;
  onSelect: (id: ShoppingId) => void;
  aggregates: ShoppingAggregate[];
}

const tierClasses: Record<string, string> = {
  excellent: "bg-success",
  good: "bg-primary",
  warning: "bg-warning",
  critical: "bg-destructive",
};

export function ShoppingSidebar({ selected, onSelect, aggregates }: ShoppingSidebarProps) {
  const aggMap = new Map(aggregates.map((a) => [a.shopping_id, a]));

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="px-3 pt-4 pb-2">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Shoppings · 18
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {SHOPPING_IDS.map((id) => {
          const agg = aggMap.get(id);
          const tier = agg ? performanceTier(agg.avg_efficiency) : "warning";
          const isActive = selected === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  tierClasses[tier],
                  isActive && "ring-2 ring-background",
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-mono leading-none">{id}</p>
                <p className="mt-1 text-[11px] text-muted-foreground truncate">
                  {SHOPPING_NAMES[id]}
                </p>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                {agg && agg.avg_efficiency > 0 ? agg.avg_efficiency.toFixed(2) : "—"}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-3">
        <p className="text-[10px] text-muted-foreground">
          Fonte: WebCTRL · n8n
        </p>
      </div>
    </aside>
  );
}
