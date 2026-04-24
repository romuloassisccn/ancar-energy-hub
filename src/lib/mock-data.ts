// --- CONFIGURAÇÃO ANCAR ---
// Schema-only. Sem geração de dados fictícios.
// Os dados serão inseridos offline (via GitHub / fetch ao Postgres / n8n).

export const SHOPPING_IDS = [
  "BAN", "BLD", "BPS", "CVS", "GOL", "ITA", "MAD", "NAT", "NSF",
  "NSJ", "NSM", "PAN", "PVS", "RDB", "SNA", "SNI", "VSS", "MDW",
] as const;

export type ShoppingId = (typeof SHOPPING_IDS)[number];

export const SHOPPING_NAMES: Record<ShoppingId, string> = {
  BAN: "Shopping Bangu",
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

export interface TrendRow {
  timestamp: string;
  shopping_id: ShoppingId;

  temp_entrada: number;
  temp_saida: number;
  temp_ext: number;

  vazao: number;

  kw_ur1: number;
  kw_ur2: number;
  kw_ur3: number;
  kw_ur4: number;
  kw_ur5: number;

  kw_perifericos: number;
  kw_total_planta: number;

  eficiencia_kw_tr: number;

  /** Carga térmica em TR (opcional — pode ser calculada offline). */
  carga_tr?: number;
}

export interface ShoppingAggregate {
  shopping_id: ShoppingId;
  name: string;
  avg_efficiency: number;
  avg_kw_total: number;
  samples: number;
}

export type RangeKey = "today" | "week" | "month" | "quarter" | "year";

// -----------------------------
// Dataset placeholder.
// Substitua o corpo desta função pela leitura real (Postgres / n8n / arquivo).
// -----------------------------
export async function buildDataset(): Promise<TrendRow[]> {
  return [];
}

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
    const ts = new Date(r.timestamp).getTime();
    return !isNaN(ts) && ts >= cutoff;
  });
}

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

export function performanceTier(eff: number): "excellent" | "good" | "warning" | "critical" {
  if (eff <= 0) return "warning";
  if (eff < 0.75) return "excellent";
  if (eff < 0.95) return "good";
  if (eff < 1.1) return "warning";
  return "critical";
}
