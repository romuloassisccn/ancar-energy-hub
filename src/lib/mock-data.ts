// --- CONFIGURAÇÃO ANCAR - VERSÃO CORRIGIDA (SHOP01 + POSTGRES REAL) ---

export const SHOPPING_IDS = [
  "SHOP01", "BLD", "BPS", "CVS", "GOL", "ITA", "MAD", "NAT", "NSF",
  "NSJ", "NSM", "PAN", "PVS", "RDB", "SNA", "SNI", "VSS", "MDW",
] as const;

export type ShoppingId = (typeof SHOPPING_IDS)[number];

export const SHOPPING_NAMES: Record<ShoppingId, string> = {
  SHOP01: "Shopping Boulevard",
  BLD: "Shopping Boulevard (legacy)",
  BPS: "Botafogo Praia Shopping",
  CVS: "Center Vale Shopping",
  GOL: "Golden Square Shopping",
  ITA: "Shopping Itaquera",
  MAD: "Shopping Madureira",
  NAT: "Natal Shopping",
  NSF: "North Shopping Fortaleza",
  NSJ: "North Shopping Joquei",
  NSM: "North Shopping Maracanau",
  PAN: "Pantanal Shopping",
  PVS: "Porto Velho Shopping",
  RDB: "Rio Design Barra",
  SNA: "Shopping Nova America",
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

  kw_perifericos: number;
  kw_total_planta: number;

  eficiencia_kw_tr: number;
}

export type RangeKey = "today" | "week" | "month";

// -----------------------------
// 🔥 BUILD DATASET (CORRIGIDO)
// -----------------------------
export async function buildDataset(): Promise<TrendRow[]> {
  try {
    const response = await fetch("http://localhost:5678/webhook/dados-ancal");

    if (!response.ok) throw new Error("n8n offline");

    const rawData = await response.json();
    if (!Array.isArray(rawData)) return [];

    return rawData.map((db: any) => {

      const cleanNum = (val: any) => {
        if (val === null || val === undefined || val === "null" || val === "") return null;
        const n = Number(val);
        return isNaN(n) ? null : n;
      };

      return {
        // 🔥 IMPORTANTE: Postgres usa data_hora
        timestamp: db.data_hora || db.timestamp || new Date().toISOString(),

        // 🔥 SHOP CORRIGIDO
        shopping_id: (db.shopping_id as ShoppingId) || "SHOP01",

        // 🔥 MAPEAMENTO REAL DO BANCO
        temp_entrada: cleanNum(db.ewt_ur1 ?? db.temp_entrada) || 0,
        temp_saida: cleanNum(db.lwt_ur1 ?? db.temp_saida) || 0,
        temp_ext: cleanNum(db.temp_ext) || 0,

        vazao: cleanNum(db.vazao) || 0,

        kw_ur1: cleanNum(db.kw_ur1) || 0,
        kw_ur2: cleanNum(db.kw_ur2) || 0,
        kw_ur3: cleanNum(db.kw_ur3) || 0,

        kw_perifericos: cleanNum(db.kw_perifericos) || 0,
        kw_total_planta: cleanNum(db.kw_total_planta) || 0,

        eficiencia_kw_tr: cleanNum(db.eficiencia_kw_tr) || 0,
      };
    });

  } catch (err) {
    console.error("Erro n8n:", err);
    return [];
  }
}

// -----------------------------
export function filterByRange(rows: TrendRow[], range: RangeKey): TrendRow[] {
  const now = new Date();

  const hours =
    range === "today" ? 24 :
    range === "week" ? 168 : 720;

  const cutoff = now.getTime() - hours * 3600_000;

  return rows.filter(r => {
    const ts = new Date(r.timestamp).getTime();
    return !isNaN(ts) && ts >= cutoff;
  });
}

// -----------------------------
export function aggregateByShopping(rows: TrendRow[]) {
  return SHOPPING_IDS.map(id => {
    const arr = rows.filter(r => r.shopping_id === id);

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
      arr.reduce((a, b) => a + b.eficiencia_kw_tr, 0) / arr.length;

    const avgKw =
      arr.reduce((a, b) => a + b.kw_total_planta, 0) / arr.length;

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