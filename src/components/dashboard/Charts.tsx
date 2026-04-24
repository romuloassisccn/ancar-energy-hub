import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { TrendRow } from "@/lib/mock-data";

const axisStyle = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

// CORREÇÃO: Função melhorada para tratar formato ISO do PostgreSQL e do WebCTRL
function shortLabel(ts: any): string {
  if (!ts) return "";
  const strTs = String(ts);
  
  // Se vier do Banco (ISO): 2026-04-22T20:00:00.000Z
  if (strTs.includes("T")) {
    return strTs.split("T")[1]?.slice(0, 5) ?? strTs;
  }
  // Se vier do CSV (WebCTRL): 22/04/2026 20:00:00
  if (strTs.includes(" ")) {
    return strTs.split(" ")[1]?.slice(0, 5) ?? strTs;
  }
  return strTs.slice(0, 5);
}

// CORREÇÃO: Função para garantir que o gráfico siga a linha do tempo correta
function sortData(data: TrendRow[]) {
  return [...data].sort((a, b) => {
    return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
  });
}

function ChartFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ height = 240 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground"
      style={{ height }}
    >
      Sem dados no período
    </div>
  );
}

/**
 * 1) LINE — Eficiência kW/TR ao longo do tempo
 */
export function EfficiencyLineChart({ data }: { data: TrendRow[] }) {
  // Ordenamos antes de mapear para o gráfico não "voltar no tempo"
  const chartData = sortData(data).map((r) => ({
    label: shortLabel(r.timestamp),
    eficiencia_kw_tr: r.eficiencia_kw_tr,
  }));

  return (
    <ChartFrame title="Eficiência kW/TR" subtitle="série temporal">
      {chartData.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              name="kW/TR"
              type="monotone"
              dataKey="eficiencia_kw_tr"
              stroke="var(--chart-1)"
              dot={false}
              strokeWidth={2}
              connectNulls // Evita buracos se faltar um dado isolado
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}

/**
 * 2) BARS — Consumo kW por chiller + periféricos
 */
export function ConsumptionBarChart({ data }: { data: TrendRow[] }) {
  const keys: { key: keyof TrendRow; label: string; color: string }[] = [
    { key: "kw_ur1", label: "UR1", color: "var(--chart-1)" },
    { key: "kw_ur2", label: "UR2", color: "var(--chart-2)" },
    { key: "kw_ur3", label: "UR3", color: "var(--chart-3)" },
    { key: "kw_perifericos", label: "Perif.", color: "var(--chart-6)" },
  ];

  const chartData =
    data.length === 0
      ? []
      : keys.map(({ key, label, color }) => {
          const validData = data.filter(r => Number(r[key]) > 0);
          const sum = validData.reduce((a, r) => a + (Number(r[key]) || 0), 0);
          return { name: label, kw: validData.length > 0 ? sum / validData.length : 0, fill: color };
        });

  return (
    <ChartFrame title="Consumo kW" subtitle="média por chiller">
      {chartData.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip />
            <Bar dataKey="kw" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}

/**
 * 3) SCATTER — Temp. Externa × kW/TR
 */
export function TempExtVsEfficiencyScatter({ data }: { data: TrendRow[] }) {
  const chartData = data
    .filter((r) => (Number(r.temp_ext) || 0) > 0 && (Number(r.eficiencia_kw_tr) || 0) > 0)
    .map((r) => ({ temp_ext: r.temp_ext, kw_tr: r.eficiencia_kw_tr }));

  return (
    <ChartFrame title="Temp. Externa × kW/TR" subtitle="correlação climática">
      {chartData.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="temp_ext"
              name="Temp. Ext"
              unit="°C"
              domain={['auto', 'auto']}
              tick={axisStyle}
            />
            <XAxis dataKey="label" tick={axisStyle} hide id="hidden-x" />
            <YAxis
              type="number"
              dataKey="kw_tr"
              name="kW/TR"
              domain={['auto', 'auto']}
              tick={axisStyle}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={chartData} fill="var(--chart-3)" opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}

/**
 * 4) SCATTER — kW/TR × Carga (TR)
 */
export function EfficiencyVsLoadScatter({ data }: { data: TrendRow[] }) {
  const chartData = data
    .map((r) => {
      const carga = Number(r.carga_tr) || 0;
      return { carga_tr: carga, kw_tr: r.eficiencia_kw_tr };
    })
    .filter((d) => d.carga_tr > 0 && d.kw_tr > 0);

  return (
    <ChartFrame title="kW/TR × Carga (TR)" subtitle="curva de operação">
      {chartData.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="carga_tr"
              name="Carga"
              unit=" TR"
              domain={['auto', 'auto']}
              tick={axisStyle}
            />
            <YAxis
              type="number"
              dataKey="kw_tr"
              name="kW/TR"
              domain={['auto', 'auto']}
              tick={axisStyle}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={chartData} fill="var(--chart-2)" opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}