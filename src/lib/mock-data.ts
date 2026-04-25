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
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// -----------------------------
// FETCH REAL (Conexão com n8n)
// -----------------------------
export async function buildDataset(): Promise<TrendRow[]> {
  try {
    // Se estiver usando o workflow ativo, mude para /webhook/ (sem o -test)
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

      temp_ext: toNumberOrNull(r.temp_ext),
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
  const now = Date.now();

  const hours =
    range === "today" ? 24 :
    range === "week" ? 24 * 7 :
    range === "month" ? 24 * 30 :
    range === "quarter" ? 24 * 90 :
    24 * 365;

  const cutoff = now - hours * 3600_000;

  return rows.filter((r) => {
    // Formata para ISO para garantir que o JavaScript entenda a data corretamente
    const isoDate = r.timestamp ? r.timestamp.replace(" ", "T") : "";
    const ts = new Date(isoDate).getTime();
    
    return true;
  });
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

    const avgEff =
      arr.reduce((a, b) => a + (b.eficiencia_kw_tr || 0), 0) / arr.length;

    const avgKw =
      arr.reduce((a, b) => a + (b.kw_total_planta || 0), 0) / arr.length;

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