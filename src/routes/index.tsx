import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Activity, Droplet, Gauge, ThermometerSun, Waves } from "lucide-react";

import { ShoppingSidebar } from "@/components/dashboard/ShoppingSidebar";
import { RangeSelector } from "@/components/dashboard/RangeSelector";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SparklineKpiCard } from "@/components/dashboard/SparklineKpiCard";
import { EfficiencyRanking } from "@/components/dashboard/EfficiencyRanking";
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

    const maxVazao = selectedRows.reduce(
      (m, r) => Math.max(m, r.vazao || 0),
      0
    );

    const maxKw = selectedRows.reduce(
      (m, r) => Math.max(m, r.kw_total_planta || 0),
      0
    );

    const maxTempExt = selectedRows.reduce(
      (m, r) => Math.max(m, r.temp_ext || 0),
      0
    );

    const valid = selectedRows.filter(
      (r) => typeof r.eficiencia_kw_tr === "number" && r.eficiencia_kw_tr > 0
    );

    const avgEff = valid.length
      ? valid.reduce((a, b) => a + (b.eficiencia_kw_tr ?? 0), 0) /
        valid.length
      : 0;

    return {
      eff: avgEff,
      maxKw,
      maxVazao,
      maxTempExt,
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
      <ShoppingSidebar
        selected={selected}
        onSelect={setSelected}
        aggregates={aggregates}
      />

      <main className="flex-1 p-6 space-y-6 overflow-x-hidden">

        {/* KPIs REDE */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            label="Média da Rede"
            value={format(selectedKpis?.eff)}
            unit="kW/TR"
            icon={Activity}
          />

          <KpiCard
            label="Vazão Máxima"
            value={format(selectedKpis?.maxVazao, 1)}
            unit="m³/h"
            icon={Waves}
          />

          <KpiCard
            label="Potência Máxima"
            value={format(selectedKpis?.maxKw, 0)}
            unit="kW"
            icon={Zap}
            tone="warning"
          />

          <KpiCard
            label="Temp. Externa Máxima"
            value={format(selectedKpis?.maxTempExt, 1)}
            unit="°C"
            icon={ThermometerSun}
            tone="critical"
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
          <EfficiencyLineChart data={selectedRows} />
          <ConsumptionBarChart data={selectedRows} />
          <TempExtVsEfficiencyScatter data={selectedRows} />
          <AmbientTemperatureChart data={selectedRows} />
          <EfficiencyVsLoadScatter data={selectedRows} />
          <AmbientCOChart data={selectedRows} />
        </section>

        {/* RANKING + LOG */}
        <section className="grid gap-6 xl:grid-cols-[400px_1fr]">
          <EfficiencyRanking
            data={aggregates}
            selected={selected}
            onSelect={setSelected}
          />

          <LogsTable rows={selectedRows} />
        </section>
      </main>
    </div>
  );
}