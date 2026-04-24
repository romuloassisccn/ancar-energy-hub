import type { TrendRow } from "@/lib/mock-data";

interface LogsTableProps {
  rows: TrendRow[];
}

// FUNÇÃO DE FORMATAÇÃO ULTRA-SEGURA
function fmt(val: any, digits = 2) {
  const n = parseFloat(val);
  // Se não for número, for infinito ou nulo, retorna o traço
  if (isNaN(n) || !isFinite(n) || val === null || val === undefined || n === 0) {
    return "—";
  }
  return n.toFixed(digits);
}

function fmtTs(ts: string) {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "Data Inválida";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:00`;
  } catch {
    return "—";
  }
}

export function LogsTable({ rows }: LogsTableProps) {
  // Garantir que rows é um array antes de fazer o spread
  const safeRows = Array.isArray(rows) ? rows : [];

  // Show most recent first, cap at 200 rows for performance.
  const sorted = [...safeRows]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 200);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Logs Brutos · Trends</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {safeRows.length} registros · exibindo {sorted.length} mais recentes
          </p>
        </div>
        <span className="rounded-md bg-accent/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          trends_shoppings
        </span>
      </div>
      <div className="overflow-x-auto max-h-[400px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left font-medium">Timestamp</th>
              <th className="px-2 py-2 text-right font-medium">T.Ent</th>
              <th className="px-2 py-2 text-right font-medium">T.Sai</th>
              <th className="px-2 py-2 text-right font-medium">T.Ext</th>
              <th className="px-2 py-2 text-right font-medium">Vazão</th>
              <th className="px-2 py-2 text-right font-medium">UR1</th>
              <th className="px-2 py-2 text-right font-medium">UR2</th>
              <th className="px-2 py-2 text-right font-medium">UR3</th>
              <th className="px-2 py-2 text-right font-medium">UR4</th>
              <th className="px-2 py-2 text-right font-medium">UR5</th>
              <th className="px-2 py-2 text-right font-medium">Perif.</th>
              <th className="px-2 py-2 text-right font-medium">kW Total</th>
              <th className="px-3 py-2 text-right font-medium text-primary">kW/TR</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {sorted.map((r, idx) => (
              <tr key={`${r.timestamp}-${idx}`} className="border-b border-border/40 hover:bg-accent/20">
                <td className="px-3 py-1.5 text-foreground/90">{fmtTs(r.timestamp)}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.temp_entrada)}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.temp_saida)}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.temp_ext)}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.vazao, 1)}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.kw_ur1, 1)}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.kw_ur2, 1)}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.kw_ur3, 1)}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.kw_ur4, 1)}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.kw_ur5, 1)}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.kw_perifericos, 1)}</td>
                <td className="px-2 py-1.5 text-right text-foreground">{fmt(r.kw_total_planta, 1)}</td>
                <td className="px-3 py-1.5 text-right font-semibold text-primary">
                  {/* Corrigido: Usando a função fmt segura em vez de .toFixed direto */}
                  {fmt(r.eficiencia_kw_tr, 3)}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={13} className="py-8 text-center text-muted-foreground">
                  Nenhum registro no período selecionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}