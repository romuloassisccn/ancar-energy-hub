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
  temp_ag_cag: number | null;
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
  target: number | null;
  deviation: number | null;
}

export const SHOPPING_TARGETS: Partial<Record<ShoppingId, number>> = {
  BPS: 1.18, BLD: 0.76, RDB: 0.88, MAD: 0.93, SNI: 0.86, CVS: 0.91,
  ITA: 1.20, GOL: 1.20, NAT: 0.82, PVS: 0.85, PAN: 0.92, BAN: 0.86,
  NSF: 1.20, NSM: 1.19, NSJ: 1.19, VSS: 0.93,
};

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
    // Prioriza a URL do Easypanel para evitar conexão com IP local antigo
    const apiUrl = import.meta.env.VITE_API_URL || "https://ancar-n8n.gpfgqx.easypanel.host/webhook/dashboard-dados";
    
    console.log(`[dashboard] conectando em: ${apiUrl}`);

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!res.ok) throw new Error(`Erro na API: ${res.status}`);

    const data = await res.json();
    const rows = Array.isArray(data) ? data : [data];
    
    console.log(`[dashboard] bruto recebido: ${rows.length} registros`);
    
    const normalized: TrendRow[] = rows.map((r: any) => {
      // Normalização da sigla do shopping para garantir match com SHOPPING_IDS
      const sId = String(r.shopping_id || r.shopping || "").trim().toUpperCase();
      
      const out: any = {
        timestamp: String(r.timestamp ?? r.data_hora ?? ""),
        shopping_id: sId as ShoppingId,
      };
      
      const numericKeys = [
        "temp_ext","temp_ag_cag","vazao",
        "tr_ur1","tr_ur2","tr_ur3","tr_ur4","tr_ur5",
        "kw_ur1","kw_ur2","kw_ur3","kw_ur4","kw_ur5",
        "kwtr_ur1","kwtr_ur2","kwtr_ur3","kwtr_ur4","kwtr_ur5",
        "kw_perifericos","kw_total_planta","eficiencia_kw_tr",
      ];

      for (const k of numericKeys) out[k] = toNumberOrNull(r[k]);
      
      for (let i = 1; i <= 16; i++) {
        out[`temp_amb${i}`] = toNumberOrNull(r[`temp_amb${i}`] ?? r[`tem_amb${i}`]);
        out[`co_amb${i}`] = toNumberOrNull(r[`co_amb${i}`]);
      }
      
      if (out.temp_ext === null) out.temp_ext = toNumberOrNull(r.temp);
      
      return out as TrendRow;
    });

    console.log(`[dashboard] processados com sucesso: ${normalized.length}`);
    return normalized;
  } catch (err) {
    console.error("Erro ao buscar dados do n8n:", err);
    return [];
  }
}

// -----------------------------
// RANGE FILTER (Filtro Temporal)
// -----------------------------
export function filterByRange(rows: TrendRow[], range: RangeKey): TrendRow[] {
  // Se não houver registros, nem tenta filtrar
  if (!rows.length) return [];

  const now = getSaoPauloDateParts(new Date());
  const todayStart = { ...now, hour: 0, minute: 0, second: 0 };
  const cutoff = getRangeCutoff(now, range);

  const filtered = rows.filter((r) => {
    const rowDate = parsePostgresTimestamp(r.timestamp);
    if (!rowDate) return true; 

    if (range === "today") {
      return compareDateParts(rowDate, cutoff) >= 0 && compareDateParts(rowDate, todayStart) <= 1;
    }

    return compareDateParts(rowDate, cutoff) >= 0;
  });

  // Fallback: Se o filtro for muito agressivo e zerar tudo, retorna os últimos 100 registros 
  // para o dashboard não ficar em branco enquanto os dados novos não entram.
  if (filtered.length === 0 && rows.length > 0) {
    console.warn(`[dashboard] Filtro ${range} retornou vazio. Mostrando dados brutos.`);
    return rows;
  }

  return filtered;
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
  const match = String(timestamp).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
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

function getRangeCutoff(now: ReturnType<typeof getSaoPauloDateParts>, range: RangeKey) {
  const date = new Date(Date.UTC(now.year, now.month - 1, now.day));
  
  if (range === "today") date.setUTCDate(date.getUTCDate() - 1);
  else if (range === "week") date.setUTCDate(date.getUTCDate() - 7);
  else if (range === "month") date.setUTCMonth(date.getUTCMonth() - 1);
  else if (range === "quarter") date.setUTCMonth(date.getUTCMonth() - 2);
  else if (range === "year") date.setUTCMonth(date.getUTCMonth() - 3);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
  };
}

function compareDateParts(a: any, b: any) {
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
    const target = SHOPPING_TARGETS[id] ?? null;
    const arr = rows.filter((r) => r.shopping_id === id);

    if (arr.length === 0) {
      return {
        shopping_id: id,
        name: SHOPPING_NAMES[id],
        avg_efficiency: 0,
        avg_kw_total: 0,
        samples: 0,
        target,
        deviation: null,
      };
    }

    const effRows = arr.filter(
      (r) => typeof r.eficiencia_kw_tr === "number" && r.eficiencia_kw_tr > 0 && r.eficiencia_kw_tr <= 5
    );
    const kwRows = arr.filter((r) => typeof r.kw_total_planta === "number" && r.kw_total_planta > 0);

    const avgEff = effRows.length
      ? effRows.reduce((a, b) => a + (b.eficiencia_kw_tr ?? 0), 0) / effRows.length
      : 0;

    const avgKw = kwRows.length
      ? kwRows.reduce((a, b) => a + (b.kw_total_planta ?? 0), 0) / kwRows.length
      : 0;

    const deviation = target && avgEff > 0 ? ((avgEff - target) / target) * 100 : null;

    return {
      shopping_id: id,
      name: SHOPPING_NAMES[id],
      avg_efficiency: avgEff,
      avg_kw_total: avgKw,
      samples: arr.length,
      target,
      deviation,
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

export function tierByDeviation(deviation: number | null): "excellent" | "good" | "warning" | "critical" | "none" {
  if (deviation === null || !Number.isFinite(deviation)) return "none";
  if (deviation <= -10) return "excellent";
  if (deviation <= 0) return "good";
  if (deviation <= 5) return "warning";
  return "critical";
}
