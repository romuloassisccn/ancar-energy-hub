import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Activity, Gauge, ThermometerSun, Waves, Zap, TrendingDown } from "lucide-react";

import { ShoppingSidebar } from "@/components/dashboard/ShoppingSidebar";
import { RangeSelector } from "@/components/dashboard/RangeSelector";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { EfficiencyRanking } from "@/components/dashboard/EfficiencyRanking";
import { ChillerLoadChart, TemperatureChart } from "@/components/dashboard/Charts";
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

// ================= UTIL =================
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

// ================= PAGE =================
function DashboardPage() {
  const [allRows, setAllRows] = useState<TrendRow[]>([]);
  const [range, setRange] = useState<RangeKey>("week");
  const [selected, setSelected] = useState<ShoppingId>("SHOP01" as any);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await buildDataset();
        setAllRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Erro na carga de dados:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const rangeRows = useMemo(() => filterByRange(allRows, range), [allRows, range]);
  const aggregates = useMemo(() => aggregateByShopping(rangeRows), [rangeRows]);

  const selectedRows = useMemo(
    () => rangeRows.filter((r) => r.shopping_id === selected),
    [rangeRows, selected]
  );

  // ================= NETWORK =================
  const network = useMemo(() => {
    const op = aggregates.filter((a) => (a.avg_efficiency || 0) > 0);

    if (op.length === 0) {
      return { totalKw: 0, avgEff: 0, best: null, worst: null, active: 0 };
    }

    const avgEff =
      op.reduce((a, b) => a + (b.avg_efficiency || 0), 0) / op.length;

    const totalKw = op.reduce((a, b) => a + (b.avg_kw_total || 0), 0);

    const sorted = [...op].sort(
      (a, b) => a.avg_efficiency - b.avg_efficiency
    );

    return {
      totalKw,
      avgEff,
      best: sorted[0] || null,
      worst: sorted[sorted.length - 1] || null,
      active: op.length,
    };
  }, [aggregates]);

  // ================= KPIs (SEM FILTRO QUE QUEBRA DADOS) =================
  const selectedKpis = useMemo(() => {
    const validData = selectedRows.filter(
      (r) =>
        (r.kw_ur1 || 0) > 0 ||
        (r.kw_ur2 || 0) > 0 ||
        (r.kw_ur3 || 0) > 0
    );

    if (validData.length === 0) return null;

    const avgEff =
      validData.reduce((a, b) => a + (b.eficiencia_kw_tr || 0), 0) /
      validData.length;

    const avgDt =
      validData.reduce(
        (a, b) =>
          a +
          Math.abs(
            (b.temp_entrada || 0) - (b.temp_saida || 0)
          ),
        0
      ) / validData.length;

    const avgVazao =
      validData.reduce((a, b) => a + (b.vazao || 0), 0) /
      validData.length;

    return {
      eff: avgEff,
      kw: Math.max(...validData.map((r) => r.kw_total_planta || 0)),
      vazao: avgVazao,
      dt: avgDt,
      samples: validData.length,
    };
  }, [selectedRows]);

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0E14] text-white">
        <div className="text-center animate-pulse">
          <Gauge className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
          <p>Conectando ao n8n local...</p>
        </div>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div className="flex min-h-screen w-full bg-[#0A0E14]">
      <ShoppingSidebar
        selected={selected}
        onSelect={setSelected}
        aggregates={aggregates}
      />

      <main className="flex-1 p-6 space-y-6 overflow-hidden">
        {/* KPIs REDE */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            label="Média Rede"
            value={format(network.avgEff)}
            unit="kW/TR"
            icon={Activity}
          />
          <KpiCard
            label="Potência Total"
            value={format(network.totalKw, 0)}
            unit="kW"
            icon={Zap}
            tone="warning"
          />
          <KpiCard
            label="Melhor Unidade"
            value={network.best?.shopping_id || "—"}
            unit={format(network.best?.avg_efficiency)}
            icon={TrendingDown}
            tone="success"
          />
          <KpiCard
            label="Maior Consumo"
            value={network.worst?.shopping_id || "—"}
            unit={format(network.worst?.avg_efficiency)}
            icon={Activity}
            tone="critical"
          />
        </section>

        {/* GRÁFICOS */}
        <section className="grid gap-6 xl:grid-cols-[400px_1fr]">
          <EfficiencyRanking
            data={aggregates}
            selected={selected}
            onSelect={setSelected}
          />

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold">
                    <span className="text-primary">{selected}</span> ·{" "}
                    {SHOPPING_NAMES[selected as any]}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedKpis
                      ? `${selectedKpis.samples} logs`
                      : "Sem dados"}
                  </p>
                </div>
                <RangeSelector value={range} onChange={setRange} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <KpiCard
                label="Eficiência"
                value={format(selectedKpis?.eff)}
                unit="kW/TR"
                icon={Activity}
                tone={
                  selectedKpis
                    ? tierTone[
                        performanceTier(selectedKpis.eff)
                      ]
                    : "default"
                }
              />
              <KpiCard
                label="ΔT Médio"
                value={format(selectedKpis?.dt, 2)}
                unit="°C"
                icon={ThermometerSun}
              />
              <KpiCard
                label="Vazão"
                value={format(selectedKpis?.vazao, 1)}
                unit="m³/h"
                icon={Waves}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <TemperatureChart data={selectedRows} />
              <ChillerLoadChart data={selectedRows} />
            </div>
          </div>
        </section>

        <LogsTable rows={selectedRows} />
      </main>
    </div>
  );
}