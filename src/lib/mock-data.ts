// -----------------------------
// CONFIG - Lista de Shoppings
// -----------------------------
export const SHOPPING_IDS = [
  "BAN", "BLD", "BPS", "CVS", "GOL", "ITA", "MAD", "NAT", "NSF",
  "NSJ", "NSM", "PAN", "PVS", "RDB", "SNA", "SNI", "VSS", "MDW",
] as const;

export type ShoppingId = (typeof SHOPPING_IDS)[number];

export const SHOPPING_NAMES: Record<ShoppingId, string> = {
  BAN: "Shopping das Bandeiras",
  BLD: "Shopping Boulevard",
  BPS: "Botafogo Praia Shopping",
  CVS: "Center Vale Shopping",
  GOL: "Golden Square Shopping",
  ITA: "Shopping Itaquera",
  MAD: "Shopping Madureira",
  NAT: "Natal Shopping",
  NSF: "North Shopping Fortaleza",
  NSJ: "North Shopping Jóquei",
  NSM: "North Shopping Maracanaú",
  PAN: "Pantanal Shopping",
  PVS: "Porto Velho Shopping",
  RDB: "Rio Design Barra",
  SNA: "Shopping Nova América",
  SNI: "Shopping Nova Iguaçu",
  VSS: "Via Sul Shopping",
  MDW: "Midway Mall",
};

// -----------------------------
// TYPES - Interface dos Dados
// -----------------------------
export interface TrendRow {
  timestamp: string;
  shopping_id: ShoppingId;
  temp_ext: number | null;
  vazao: number | null;
  tr_ur1: number | null;
  tr_ur2: number | null;
  tr_ur3: number | null;
  tr_ur4: number | null;
  tr_ur5: number | null;
  kw_ur1: number | null;
  kw_ur2: number | null;
  kw_ur3: number | null;
  kw_ur4: number | null;
  kw_ur5: number | null;
  kw_perifericos: number | null;
  kw_total_planta: number | null;
  kwtr_ur1: number | null;
  kwtr_ur2: number | null;
  kwtr_ur3: number | null;
  kwtr_ur4: number | null;
  kwtr_ur5: number | null;
  eficiencia_kw_tr: number | null;
  temp_amb1: number | null;
  temp_amb2: number | null;
  temp_amb3: number | null;
  temp_amb4: number | null;
  temp_amb5: number | null;
  temp_amb6: number | null;
  temp_amb7: number | null;
  temp_amb8: number | null;
  temp_amb9: number | null;
  temp_amb10: number | null;
  temp_amb11: number | null;
  temp_amb12: number | null;
  temp_amb13: number | null;
  temp_amb14: number | null;
  temp_amb15: number | null;
  temp_amb16: number | null;
  co_amb1: number | null;
  co_amb2: number | null;
  co_amb3: number | null;
  co_amb4: number | null;
  co_amb5: number | null;
  co_amb6: number | null;
  co_amb7: number | null;
  co_amb8: number | null;
  co_amb9: number | null;
  co_amb10: number | null;
  co_amb11: number | null;
  co_amb12: number | null;
  co_amb13: number | null;
  co_amb14: number | null;
  co_amb15: number | null;
  co_amb16: number | null;
}

export interface ShoppingAggregate {
  shopping_id: ShoppingId;
  name: string;
  avg_efficiency: number;
  avg_kw_total: number;
  samples: number;
}

export type RangeKey = "today" | "week" | "month" | "quarter" | "year";

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

// -----------------------------
// FETCH REAL (Conexão com n8n)
// -----------------------------
export async function buildDataset(): Promise<TrendRow[]> {
  try {
    // O webhook deve retornar todo o histórico da tabela trends_shoppings,
    // sem LIMIT e sem filtro fixo. Os períodos são aplicados na visualização.
    const res = await fetch("http://localhost:5678/webhook/dados-ancal");
    const data = await res.json();

    console.log("DADOS RECEBIDOS DO N8N:", data);

    // Garante que os dados sejam tratados como array (mesmo que venha 1 item só)
    const rows = Array.isArray(data) ? data : [data];

    return rows.map((r: any) => ({
      timestamp: String(r.timestamp ?? r.data_hora ?? ""),
      
      shopping_id: String(r.shopping_id || "")
        .trim()
        .toUpperCase() as ShoppingId,

      temp_ext: toNumberOrNull(r.temp_ext ?? r.temp),
      vazao: toNumberOrNull(r.vazao),

      // Carga térmica por chiller
      tr_ur1: toNumberOrNull(r.tr_ur1),
      tr_ur2: toNumberOrNull(r.tr_ur2),
      tr_ur3: toNumberOrNull(r.tr_ur3),
      tr_ur4: toNumberOrNull(r.tr_ur4),
      tr_ur5: toNumberOrNull(r.tr_ur5),

      // Chillers
      kw_ur1: toNumberOrNull(r.kw_ur1),
      kw_ur2: toNumberOrNull(r.kw_ur2),
      kw_ur3: toNumberOrNull(r.kw_ur3),
      kw_ur4: toNumberOrNull(r.kw_ur4),
      kw_ur5: toNumberOrNull(r.kw_ur5),

      // Eficiência individual por chiller
      kwtr_ur1: toNumberOrNull(r.kwtr_ur1),
      kwtr_ur2: toNumberOrNull(r.kwtr_ur2),
      kwtr_ur3: toNumberOrNull(r.kwtr_ur3),
      kwtr_ur4: toNumberOrNull(r.kwtr_ur4),
      kwtr_ur5: toNumberOrNull(r.kwtr_ur5),

      // Planta Geral
      kw_perifericos: toNumberOrNull(r.kw_perifericos),
      kw_total_planta: toNumberOrNull(r.kw_total_planta),
      eficiencia_kw_tr: toNumberOrNull(r.eficiencia_kw_tr),
      temp_amb1: toNumberOrNull(r.temp_amb1),
      temp_amb2: toNumberOrNull(r.temp_amb2),
      temp_amb3: toNumberOrNull(r.temp_amb3),
      temp_amb4: toNumberOrNull(r.temp_amb4),
      temp_amb5: toNumberOrNull(r.temp_amb5),
      temp_amb6: toNumberOrNull(r.temp_amb6),
      temp_amb7: toNumberOrNull(r.temp_amb7),
      temp_amb8: toNumberOrNull(r.temp_amb8),
      temp_amb9: toNumberOrNull(r.temp_amb9),
      temp_amb10: toNumberOrNull(r.temp_amb10),
      temp_amb11: toNumberOrNull(r.temp_amb11),
      temp_amb12: toNumberOrNull(r.temp_amb12),
      temp_amb13: toNumberOrNull(r.temp_amb13),
      temp_amb14: toNumberOrNull(r.temp_amb14),
      temp_amb15: toNumberOrNull(r.temp_amb15),
      temp_amb16: toNumberOrNull(r.temp_amb16),
      co_amb1: toNumberOrNull(r.co_amb1),
      co_amb2: toNumberOrNull(r.co_amb2),
      co_amb3: toNumberOrNull(r.co_amb3),
      co_amb4: toNumberOrNull(r.co_amb4),
      co_amb5: toNumberOrNull(r.co_amb5),
      co_amb6: toNumberOrNull(r.co_amb6),
      co_amb7: toNumberOrNull(r.co_amb7),
      co_amb8: toNumberOrNull(r.co_amb8),
      co_amb9: toNumberOrNull(r.co_amb9),
      co_amb10: toNumberOrNull(r.co_amb10),
      co_amb11: toNumberOrNull(r.co_amb11),
      co_amb12: toNumberOrNull(r.co_amb12),
      co_amb13: toNumberOrNull(r.co_amb13),
      co_amb14: toNumberOrNull(r.co_amb14),
      co_amb15: toNumberOrNull(r.co_amb15),
      co_amb16: toNumberOrNull(r.co_amb16),
    }));
  } catch (err) {
    console.error("Erro ao buscar dados do n8n:", err);
    return [];
  }
}

// -----------------------------
// RANGE FILTER (Filtro Temporal)
// -----------------------------
export function filterByRange(rows: TrendRow[], range: RangeKey): TrendRow[] {
  if (range === "year") return rows;

  const now = getSaoPauloDateParts(new Date());
  const todayStart = { ...now, hour: 0, minute: 0, second: 0 };
  const cutoff = getRangeCutoff(now, range);

  return rows.filter((r) => {
    const rowDate = parsePostgresTimestamp(r.timestamp);
    if (!rowDate) return false;

    if (range === "today") {
      return compareDateParts(rowDate, cutoff) >= 0 && compareDateParts(rowDate, todayStart) < 0;
    }

    return compareDateParts(rowDate, cutoff) >= 0 && compareDateParts(rowDate, now) <= 0;
  });
}

function getSaoPauloDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function parsePostgresTimestamp(timestamp: string) {
  if (!timestamp) return null;

  const match = String(timestamp).match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/,
  );

  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] ?? 0),
    minute: Number(match[5] ?? 0),
    second: Number(match[6] ?? 0),
  };
}

function getRangeCutoff(
  now: ReturnType<typeof getSaoPauloDateParts>,
  range: Exclude<RangeKey, "year">,
) {
  if (range === "today") {
    const yesterday = new Date(Date.UTC(now.year, now.month - 1, now.day - 1, 0, 0, 0));

    return {
      year: yesterday.getUTCFullYear(),
      month: yesterday.getUTCMonth() + 1,
      day: yesterday.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    };
  }

  const monthsBack = range === "month" ? 1 : range === "quarter" ? 3 : 0;
  const daysBack = range === "week" ? 7 : 0;
  const date = new Date(Date.UTC(now.year, now.month - 1 - monthsBack, now.day - daysBack, 0, 0, 0));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
  };
}

function compareDateParts(a: NonNullable<ReturnType<typeof parsePostgresTimestamp>>, b: ReturnType<typeof getSaoPauloDateParts>) {
  const keys = ["year", "month", "day", "hour", "minute", "second"] as const;

  for (const key of keys) {
    if (a[key] !== b[key]) return a[key] - b[key];
  }

  return 0;
}

// -----------------------------
// AGGREGATION (Cálculo do Ranking)
// -----------------------------
export function aggregateByShopping(rows: TrendRow[]): ShoppingAggregate[] {
  return SHOPPING_IDS.map((id) => {
    const arr = rows.filter((r) => r.shopping_id === id);

    if (arr.length === 0) {
      return {
        shopping_id: id,
        name: SHOPPING_NAMES[id],
        avg_efficiency: 0,
        avg_kw_total: 0,
        samples: 0,
      };
    }

    const effRows = arr.filter((r) => typeof r.eficiencia_kw_tr === "number" && r.eficiencia_kw_tr > 0);
    const kwRows = arr.filter((r) => typeof r.kw_total_planta === "number" && r.kw_total_planta > 0);

    const avgEff = effRows.length
      ? effRows.reduce((a, b) => a + (b.eficiencia_kw_tr ?? 0), 0) / effRows.length
      : 0;

    const avgKw = kwRows.length
      ? kwRows.reduce((a, b) => a + (b.kw_total_planta ?? 0), 0) / kwRows.length
      : 0;

    return {
      shopping_id: id,
      name: SHOPPING_NAMES[id],
      avg_efficiency: avgEff || 0,
      avg_kw_total: avgKw || 0,
      samples: arr.length,
    };
  });
}

// -----------------------------
// STATUS TIER (Cores dos Cards)
// -----------------------------
export function performanceTier(eff: number): "excellent" | "good" | "warning" | "critical" {
  if (eff <= 0) return "warning";
  if (eff < 0.75) return "excellent";
  if (eff < 0.95) return "good";
  if (eff < 1.1) return "warning";
  return "critical";
}