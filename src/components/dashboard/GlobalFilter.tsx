import { useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const CHILLER_IDS = ["UR1", "UR2", "UR3", "UR4", "UR5"] as const;
export type ChillerId = (typeof CHILLER_IDS)[number];

export const SENSOR_INDEXES = Array.from({ length: 16 }, (_, i) => i + 1);

interface GlobalFilterProps {
  chillers: ChillerId[];
  onChillersChange: (next: ChillerId[]) => void;
  tempSensors: number[];
  onTempSensorsChange: (next: number[]) => void;
  coSensors: number[];
  onCoSensorsChange: (next: number[]) => void;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-1 text-[11px] font-mono transition-colors",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-accent/40",
      )}
    >
      {children}
    </button>
  );
}

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function GlobalFilter({
  chillers,
  onChillersChange,
  tempSensors,
  onTempSensorsChange,
  coSensors,
  onCoSensorsChange,
}: GlobalFilterProps) {
  const [open, setOpen] = useState(false);
  const totalSelected =
    chillers.length + tempSensors.length + coSensors.length;
  const totalAvailable = CHILLER_IDS.length + SENSOR_INDEXES.length * 2;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Filter className="h-3.5 w-3.5" />
          <span className="text-xs">Filtro Global</span>
          <span className="rounded bg-accent/40 px-1.5 py-0.5 text-[10px] font-mono">
            {totalSelected}/{totalAvailable}
          </span>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[420px] p-4 space-y-4">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Chillers
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => onChillersChange([...CHILLER_IDS])}
                className="text-[10px] text-primary hover:underline"
              >
                Todos
              </button>
              <span className="text-[10px] text-muted-foreground">·</span>
              <button
                onClick={() => onChillersChange([])}
                className="text-[10px] text-muted-foreground hover:underline"
              >
                Nenhum
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CHILLER_IDS.map((c) => (
              <Chip
                key={c}
                active={chillers.includes(c)}
                onClick={() => onChillersChange(toggle(chillers, c))}
              >
                {c}
              </Chip>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Temp. Mall (1–16)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => onTempSensorsChange([...SENSOR_INDEXES])}
                className="text-[10px] text-primary hover:underline"
              >
                Todos
              </button>
              <span className="text-[10px] text-muted-foreground">·</span>
              <button
                onClick={() => onTempSensorsChange([])}
                className="text-[10px] text-muted-foreground hover:underline"
              >
                Nenhum
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SENSOR_INDEXES.map((i) => (
              <Chip
                key={`t${i}`}
                active={tempSensors.includes(i)}
                onClick={() => onTempSensorsChange(toggle(tempSensors, i))}
              >
                T{i}
              </Chip>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              CO₂ Mall (1–16)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => onCoSensorsChange([...SENSOR_INDEXES])}
                className="text-[10px] text-primary hover:underline"
              >
                Todos
              </button>
              <span className="text-[10px] text-muted-foreground">·</span>
              <button
                onClick={() => onCoSensorsChange([])}
                className="text-[10px] text-muted-foreground hover:underline"
              >
                Nenhum
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SENSOR_INDEXES.map((i) => (
              <Chip
                key={`c${i}`}
                active={coSensors.includes(i)}
                onClick={() => onCoSensorsChange(toggle(coSensors, i))}
              >
                C{i}
              </Chip>
            ))}
          </div>
        </section>

        <p className="text-[10px] text-muted-foreground">
          Aplica-se a todos os gráficos (Trends e Scatter Plots).
        </p>
      </PopoverContent>
    </Popover>
  );
}
