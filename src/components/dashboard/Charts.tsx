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

const axisStyle = { fontSize: 10, fill: "var(--chart-axis)" };

const chillerSeries = [
  { id: "UR1", kw: "kw_ur1", tr: "tr_ur1", kwtr: "kwtr_ur1", color: "var(--chart-1)" },
  { id: "UR2", kw: "kw_ur2", tr: "tr_ur2", kwtr: "kwtr_ur2", color: "var(--chart-2)" },
  { id: "UR3", kw: "kw_ur3", tr: "tr_ur3", kwtr: "kwtr_ur3", color: "var(--chart-3)" },
  { id: "UR4", kw: "kw_ur4", tr: "tr_ur4", kwtr: "kwtr_ur4", color: "var(--chart-4)" },
  { id: "UR5", kw: "kw_ur5", tr: "tr_ur5", kwtr: "kwtr_ur5", color: "var(--chart-5)" },
] as const;

const ambientColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

const tempAmbSeries = Array.from({ length: 16 }, (_, index) => ({
  id: `Temp ${index + 1}`,
  key: `temp_amb${index + 1}` as keyof TrendRow,
  color: ambientColors[index % ambientColors.length],
}));

const coAmbSeries = Array.from({ length: 16 }, (_, index) => ({
  id: `CO ${index + 1}`,
  key: `co_amb${index + 1}` as keyof TrendRow,
  color: ambientColors[index % ambientColors.length],
}));

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseTimestampMs(ts: unknown): number | null {
  if (!ts) return null;
  if (typeof ts === "number") return Number.isFinite(ts) ? ts : null;
  const strTs = String(ts);

  const iso = strTs.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (iso) {
    return new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4] ?? 0),
      Number(iso[5] ?? 0),
      Number(iso[6] ?? 0),
    ).getTime();
  }

  const br = strTs.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (br) {
    return new Date(
      Number(br[3]),
      Number(br[2]) - 1,
      Number(br[1]),
      Number(br[4] ?? 0),
      Number(br[5] ?? 0),
      Number(br[6] ?? 0),
    ).getTime();
  }

  const parsed = new Date(strTs).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

// CORREÇÃO: Função melhorada para tratar formato ISO do PostgreSQL e do WebCTRL
function shortLabel(ts: any): string {
  const ms = parseTimestampMs(ts);
  if (ms === null) return String(ts ?? "").slice(0, 5);
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}

// CORREÇÃO: Função para garantir que o gráfico siga a linha do tempo correta
function sortData(data: TrendRow[]) {
  return [...data].sort((a, b) => {
    return (parseTimestampMs(a.timestamp) ?? 0) - (parseTimestampMs(b.timestamp) ?? 0);
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
  const chartData = sortData(data)
    .map((r) => ({
      timestampMs: parseTimestampMs(r.timestamp),
      label: shortLabel(r.timestamp),
      eficiencia_kw_tr: r.eficiencia_kw_tr,
      kwtr_ur1: r.kwtr_ur1,
      kwtr_ur2: r.kwtr_ur2,
      kwtr_ur3: r.kwtr_ur3,
      kwtr_ur4: r.kwtr_ur4,
      kwtr_ur5: r.kwtr_ur5,
    }))
    .filter((r): r is typeof r & { timestampMs: number } => r.timestampMs !== null);

  return (
    <ChartFrame title="Eficiência kW/TR" subtitle="série temporal">
      {chartData.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="timestampMs"
              domain={["dataMin", "dataMax"]}
              tick={axisStyle}
              tickFormatter={(value) => shortLabel(value)}
            />
            <YAxis tick={axisStyle} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              name="Média Planta"
              type="monotone"
              dataKey="eficiencia_kw_tr"
              stroke="var(--chart-1)"
              dot={false}
              strokeWidth={2}
              connectNulls={true}
            />
            {chillerSeries.map((series) => (
              <Line
                key={series.kwtr}
                name={series.id}
                type="monotone"
                dataKey={series.kwtr}
                stroke={series.color}
                dot={false}
                strokeWidth={1.6}
                connectNulls={true}
              />
            ))}
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
    ...chillerSeries.map((series) => ({ key: series.kw as keyof TrendRow, label: series.id, color: series.color })),
    { key: "kw_perifericos", label: "Perif.", color: "var(--chart-6)" },
  ];

  const chartData =
    data.length === 0
      ? []
      : keys.map(({ key, label, color }) => {
          const validData = data.filter((r) => num(r[key]) !== null);
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
  const chartData = chillerSeries.map((series) => ({
    id: series.id,
    color: series.color,
    points: data
      .map((r) => ({ x: num(r.temp_ext), y: num(r[series.kwtr]) }))
      .filter((point): point is { x: number; y: number } => point.x !== null && point.y !== null && point.y > 0),
  }));
  const hasData = chartData.some((series) => series.points.length > 0);

  return (
    <ChartFrame title="Temp. Externa × kW/TR" subtitle="correlação climática">
      {!hasData ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="x"
              name="Temp. Ext"
              unit="°C"
              domain={['auto', 'auto']}
              tick={axisStyle}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="kW/TR"
              domain={['auto', 'auto']}
              tick={axisStyle}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {chartData.map((series) => (
              <Scatter key={series.id} name={series.id} data={series.points} fill={series.color} opacity={0.7} />
            ))}
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
  const chartData = chillerSeries.map((series) => ({
    id: series.id,
    color: series.color,
    points: data
      .map((r) => ({ carga_tr: num(r[series.tr]), kw_tr: num(r[series.kwtr]) }))
      .filter((point): point is { carga_tr: number; kw_tr: number } => point.carga_tr !== null && point.kw_tr !== null),
  }));
  const hasData = chartData.some((series) => series.points.length > 0);

  return (
    <ChartFrame title="kW/TR × Carga (TR)" subtitle="curva de operação">
      {!hasData ? (
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
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {chartData.map((series) => (
              <Scatter key={series.id} name={series.id} data={series.points} fill={series.color} opacity={0.7} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}