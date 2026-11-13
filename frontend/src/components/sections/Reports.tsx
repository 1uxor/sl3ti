"use client";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { money } from "@/lib/formatting";
import type { Balance, Item, Summary } from "@/lib/api";

export function Reports({
  summary,
  items,
  balances,
  org,
  orgName,
  t,
  failed,
}: {
  summary: Summary | undefined;
  items: Item[];
  balances: Balance[];
  org: string;
  orgName: string;
  t: Record<string, string>;
  failed: (e: unknown) => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow={orgName.toUpperCase()}
        title={t.reports}
        subtitle={t.reports}
        action={
          <button
            onClick={() => {
              fetch("/api/v1/reports/stock.csv", {
                headers: { "X-Organization-ID": org },
              })
                .then((r) => r.blob())
                .then((blob) => {
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "stock.csv";
                  a.click();
                  URL.revokeObjectURL(a.href);
                })
                .catch(failed);
            }}
            className="inline-flex items-center gap-2 bg-green text-white rounded-lg px-4 py-2.5 text-xs font-bold hover:brightness-95"
          >
            <Download size={16} /> {t.export_csv}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-surface border border-line rounded-2xl shadow-card p-5">
          <span className="text-xs text-muted font-semibold">{t.total_value}</span>
          <strong className="block text-2xl font-bold text-ink mt-2">
            {money(summary?.estimated_value)}
          </strong>
          <small className="text-muted text-[11px]">{summary?.valuation_method}</small>
        </div>
        <div className="bg-surface border border-line rounded-2xl shadow-card p-5">
          <span className="text-xs text-muted font-semibold">{t.restock_items}</span>
          <strong className="block text-2xl font-bold text-ink mt-2">
            {summary?.low_stock.length || 0}
          </strong>
        </div>
      </div>

      <DataTable
        heads={[t.items, t.locations, t.total_quantity, t.estimated_value]}
        rows={items.map((x) => {
          const itemBalances = balances.filter((b) => b.item_id === x.id);
          const qty = itemBalances.reduce((a, b) => a + Number(b.quantity), 0);
          return [
            x.name,
            itemBalances.map((b) => b.location_name).join(", ") || "—",
            qty,
            money(qty * Number(x.purchase_price)),
          ];
        })}
        emptyText={t.no_data}
      />
    </>
  );
}
