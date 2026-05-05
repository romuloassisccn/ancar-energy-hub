import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Activity, Droplet, Gauge, ThermometerSun, Waves } from "lucide-react";

import { RangeSelector } from "@/components/dashboard/RangeSelector";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SparklineKpiCard } from "@/components/dashboard/SparklineKpiCard";
import { EfficiencyRanking } from "@/components/dashboard/EfficiencyRanking";
import {
  GlobalFilter,
  CHILLER_IDS,
  SENSOR_INDEXES,
  type ChillerId,
} from "@/components/dashboard/GlobalFilter";
import {
  AmbientCOChart,
  AmbientTemperatureChart,
  EfficiencyLineChart,
  ConsumptionBarChart,
  TempExtVsEfficiencyScatter,
  EfficiencyVsLoadScatter,
} from "@/components/dashboard/Charts";
import { LogsTable } from "@/components/dashboard/LogsTable";

import {
  SHOPPING_NAMES,
  aggregateByShopping,
  buildDataset,
  filterByRange,
  performanceTier,
  type RangeKey,
  type ShoppingId,
  type TrendRow,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function format(val: any, precision: number = 3): string {
  const n = parseFloat(val);
  if (isNaN(n) || !isFinite(n) || val === null || val === undefined) return "—";
  return n.toFixed(precision);
}

const tierTone: Record<string, "success" | "default" | "warning" | "critical"> = {
  excellent: "success",
  good: "default",
  warning: "warning",
  critical: "critical",
};

function DashboardPage() {
  const [allRows, setAllRows] = useState<TrendRow[]>([]);
  const [range, setRange] = useState<RangeKey>("week");
  const [selected, setSelected] = useState<ShoppingId>("BLD");
  const [isLoading, setIsLoading] = useState(true);
  const [selChillers, setSelChillers] = useState<ChillerId[]>([...CHILLER_IDS]);
  const [selTempSensors, setSelTempSensors] = useState<number[]>([...SENSOR_INDEXES]);
  const [selCoSensors, setSelCoSensors] = useState<number[]>([...SENSOR_INDEXES]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await buildDataset();
        console.log("DATASET FINAL:", data);

        if (!cancelled) {
          setAllRows(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Erro na carga de dados:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const rangeRows = useMemo(
    () => filterByRange(allRows, range),
    [allRows, range]
  );

  const aggregates = useMemo(
    () => aggregateByShopping(rangeRows),
    [rangeRows]
  );

  // ✅ CORREÇÃO AQUI (case insensitive)
  const selectedRows = useMemo(
    () =>
      rangeRows.filter(
        (r) => r.shopping_id?.toUpperCase() === selected
      ),
    [rangeRows, selected]
  );

  // ============= NETWORK KPIs =============
  const network = useMemo(() => {
    const op = aggregates.filter((a) => (a.avg_efficiency || 0) > 0);

    if (op.length === 0) {
      return {
        avgEff: 0,
        totalKw: 0,
        best: null,
        worst: null,
        active: 0,
      };
    }

    const avgEff =
      op.reduce((a, b) => a + b.avg_efficiency, 0) / op.length;

    const totalKw = op.reduce((a, b) => a + b.avg_kw_total, 0);

    const sorted = [...op].sort(
      (a, b) => a.avg_efficiency - b.avg_efficiency
    );

    return {
      avgEff,
      totalKw,
      best: sorted[0] ?? null,
      worst: sorted[sorted.length - 1] ?? null,
      active: op.length,
    };
  }, [aggregates]);

  // ============= SELECTED KPIs =============
  const selectedKpis = useMemo(() => {
    if (selectedRows.length === 0) return null;

    const sorted = [...selectedRows].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime() || 0;
      const tb = new Date(b.timestamp).getTime() || 0;
      return ta - tb;
    });

    const series = (key: keyof typeof sorted[number]) =>
      sorted
        .map((r) => ({ t: new Date(r.timestamp).getTime() || 0, v: Number(r[key]) }))
        .filter((p) => Number.isFinite(p.v) && p.v > 0);

    const maxVazao = selectedRows.reduce((m, r) => Math.max(m, r.vazao || 0), 0);
    const maxTempExt = selectedRows.reduce((m, r) => Math.max(m, r.temp_ext || 0), 0);

    const tempAgValues = selectedRows
      .map((r) => Number((r as any).temp_ag_cag))
      .filter((v) => Number.isFinite(v));
    const avgTempAg = tempAgValues.length
      ? tempAgValues.reduce((a, b) => a + b, 0) / tempAgValues.length
      : 0;

    const valid = selectedRows.filter(
      (r) =>
        typeof r.eficiencia_kw_tr === "number" &&
        r.eficiencia_kw_tr > 0 &&
        r.eficiencia_kw_tr <= 4,
    );

    const avgEff = valid.length
      ? valid.reduce((a, b) => a + (b.eficiencia_kw_tr ?? 0), 0) / valid.length
      : 0;

    return {
      eff: avgEff,
      avgTempAg,
      maxVazao,
      maxTempExt,
      vazaoSeries: series("vazao"),
      tempAgSeries: series("temp_ag_cag" as any),
      tempExtSeries: series("temp_ext"),
      samples: selectedRows.length,
    };
  }, [selectedRows]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center animate-pulse">
          <Gauge className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden lg:flex w-[460px] shrink-0 flex-col border-r border-border bg-sidebar p-3">
        <EfficiencyRanking
          data={aggregates}
          selected={selected}
          onSelect={setSelected}
        />
      </aside>

      <main className="flex-1 p-6 space-y-6 overflow-x-hidden">

        {/* KPIs REDE */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            label="Média da Rede"
            value={format(selectedKpis?.eff)}
            unit="kW/TR"
            icon={Activity}
          />

          <SparklineKpiCard
            label="Vazão"
            value={format(selectedKpis?.maxVazao, 1)}
            unit="m³/h (máx)"
            icon={Waves}
            data={selectedKpis?.vazaoSeries ?? []}
            color="var(--chart-2)"
          />

          <SparklineKpiCard
            label="Temp. Alimentação Água Gelada"
            value={format(selectedKpis?.avgTempAg, 1)}
            unit="°C"
            icon={Droplet}
            tone="warning"
            data={selectedKpis?.tempAgSeries ?? []}
            color="var(--chart-3)"
          />

          <SparklineKpiCard
            label="Temperatura Externa"
            value={format(selectedKpis?.maxTempExt, 1)}
            unit="°C (máx)"
            icon={ThermometerSun}
            tone="critical"
            data={selectedKpis?.tempExtSeries ?? []}
            color="var(--chart-4)"
          />
        </section>

        {/* HEADER */}
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-5">
          <div>
            <h2 className="text-2xl font-semibold">
              <span className="text-primary">{selected}</span> ·{" "}
              {SHOPPING_NAMES[selected]}
            </h2>

            <p className="text-xs text-muted-foreground">
              {selectedKpis
                ? `${selectedKpis.samples} logs`
                : "Sem dados"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <GlobalFilter
              chillers={selChillers}
              onChillersChange={setSelChillers}
              tempSensors={selTempSensors}
              onTempSensorsChange={setSelTempSensors}
              coSensors={selCoSensors}
              onCoSensorsChange={setSelCoSensors}
            />
            <RangeSelector value={range} onChange={setRange} />
            <ThemeToggle />
          </div>
        </section>

        {/* KPIs SHOPPING */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiCard
            label="Eficiência"
            value={format(selectedKpis?.eff)}
            unit="kW/TR"
            icon={Activity}
            tone={
              selectedKpis
                ? tierTone[performanceTier(selectedKpis.eff)]
                : "default"
            }
          />

          <KpiCard
            label="Amostras"
            value={selectedKpis ? String(selectedKpis.samples) : "—"}
            unit="logs"
            icon={Gauge}
          />

          <KpiCard
            label="Período"
            value={
              range === "today"
                ? "24h"
                : range === "week"
                ? "7d"
                : range === "month"
                ? "30d"
                : range === "quarter"
                ? "90d"
                : "Tudo"
            }
          />
        </section>

        {/* GRÁFICOS */}
        <section className="grid gap-4 md:grid-cols-2">
          <EfficiencyLineChart data={selectedRows} selectedChillers={selChillers} />
          <ConsumptionBarChart data={selectedRows} selectedChillers={selChillers} />
          <TempExtVsEfficiencyScatter data={selectedRows} selectedChillers={selChillers} />
          <AmbientTemperatureChart data={selectedRows} selectedSensors={selTempSensors} />
          <EfficiencyVsLoadScatter data={selectedRows} selectedChillers={selChillers} />
          <AmbientCOChart data={selectedRows} selectedSensors={selCoSensors} />
        </section>

        {/* LOGS — full width */}
        <section>
          <LogsTable rows={selectedRows} />
        </section>
      </main>
    </div>
  );
}