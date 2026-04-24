import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * PROCESSADOR FINAL ANCAR (ROBUSTO + MULTI-FONTE)
 */
function failSafeAncarProcessor(rawData: any[]) {
  if (!Array.isArray(rawData)) return [];

  const map = new Map<string, any>();

  const clean = (v: any) => {
    if (v === null || v === undefined || v === "null" || v === "") return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  for (const row of rawData) {
    const ts = row.timestamp || row.data_hora || row["Date Range"];
    if (!ts) continue;

    if (!map.has(ts)) {
      map.set(ts, {
        timestamp: ts,
        label: ts.includes(" ") ? ts.split(" ")[1]?.slice(0, 5) : ts,

        temp_entrada: null,
        temp_saida: null,
        temp_ext: null,

        kw_ur1: null,
        kw_ur2: null,
        kw_ur3: null,

        perifericos: null,
      });
    }

    const entry = map.get(ts);

    // =========================
    // TEMPERATURAS
    // =========================
    entry.temp_entrada =
      clean(row.ewt_ur1 ?? row.temp_entrada) ?? entry.temp_entrada;

    entry.temp_saida =
      clean(row.lwt_ur1 ?? row.temp_saida) ?? entry.temp_saida;

    entry.temp_ext =
      clean(row.temp_ext ?? row.TEMP_EXT) ?? entry.temp_ext;

    // =========================
    // KW CHILLERS
    // =========================
    entry.kw_ur1 =
      clean(row.kw_ur1) ?? entry.kw_ur1;

    entry.kw_ur2 =
      clean(row.kw_ur2) ?? entry.kw_ur2;

    entry.kw_ur3 =
      clean(row.kw_ur3) ?? entry.kw_ur3;

    // =========================
    // 🔥 PERIFÉRICOS (CORRIGIDO)
    // =========================
    entry.perifericos =
      clean(row.kw_perifericos) ??
      clean(row.perifericos) ??
      entry.perifericos;
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime()
  );
}

const axisStyle = { fontSize: 10, fill: "#666" };

/**
 * TEMPERATURE CHART
 */
export function TemperatureChart({ data }: { data: any[] }) {
  const chartData = failSafeAncarProcessor(data);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />

        <XAxis dataKey="label" tick={axisStyle} />
        <YAxis tick={axisStyle} />

        <Tooltip />
        <Legend />

        <Line
          name="Entrada"
          type="monotone"
          dataKey="temp_entrada"
          stroke="#ffa500"
          dot={false}
        />

        <Line
          name="Saída"
          type="monotone"
          dataKey="temp_saida"
          stroke="#00bfff"
          dot={false}
        />

        {/* 🔥 AGORA FUNCIONA */}
        <Line
          name="Externa"
          type="monotone"
          dataKey="temp_ext"
          stroke="#888"
          dot={false}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * CHILLER LOAD CHART
 */
export function ChillerLoadChart({ data }: { data: any[] }) {
  const chartData = failSafeAncarProcessor(data);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />

        <XAxis dataKey="label" tick={axisStyle} />
        <YAxis tick={axisStyle} />

        <Tooltip />
        <Legend />

        <Area dataKey="kw_ur1" stackId="1" fill="#00bfff" />
        <Area dataKey="kw_ur2" stackId="1" fill="#32cd32" />
        <Area dataKey="kw_ur3" stackId="1" fill="#ffa500" />

        {/* 🔥 PERIFÉRICOS FINALMENTE FIX */}
        <Area
          dataKey="perifericos"
          stackId="1"
          fill="#ff4500"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}