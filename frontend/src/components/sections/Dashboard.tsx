"use client";
import { BarChart3, Boxes, ClipboardList, Package, Plus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { money, date } from "@/lib/formatting";
import type { Balance, Summary } from "@/lib/api";

export function Dashboard({
  summary,
  balances,
  orgName,
  t,
  onNewReceipt,
  onViewMovements,
}: {
  summary: Summary | undefined;
  balances: Balance[];
  orgName: string;
  t: Record<string, string>;
  onNewReceipt: () => void;
  onViewMovements: () => void;
}) {
  const stats = [
    { label: t.active_items, value: summary?.total_items || 0, Icon: Package, subtitle: t.real_time_data },
    { label: t.total_quantity, value: summary?.total_quantity || 0, Icon: Boxes, subtitle: t.real_time_data },
    { label: t.estimated_value, value: money(summary?.estimated_value), Icon: BarChart3, subtitle: t.purchase_cost_conf },
    { label: t.low_stock, value: summary?.low_stock.length || 0, Icon: ClipboardList, subtitle: t.real_time_data },
  ];

  const chartData = Object.values(
    balances.reduce(
      (acc, b) => {
        const x = acc[b.item_id] || { name: b.item_name, quantity: 0 };
        x.quantity += Number(b.quantity);
        acc[b.item_id] = x;
        return acc;
      },
      {} as Record<string, { name: string; quantity: number }>
    )
  ).slice(0, 8);

  return (
    <>
      <PageHeader
        eyebrow={orgName.toUpperCase()}
        title={t.overview}
        subtitle={`${t.overview} — ${orgName}`}
        action={
          <button
            onClick={onNewReceipt}
            className="inline-flex items-center gap-2 bg-green text-white rounded-lg px-4 py-2.5 text-xs font-bold hover:brightness-95 transition-all"
          >
            <Plus size={16} /> {t.new_receipt}
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* Charts + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-5 mb-5">
        <div className="bg-surface border border-line rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink m-0">{t.stock_by_item}</h2>
            <span className="text-[11px] text-muted">{t.quantities}</span>
          </div>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="quantity" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-muted text-sm">{t.no_chart_data}</div>
          )}
        </div>

        <div className="bg-surface border border-line rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink m-0">{t.stock_alerts}</h2>
            <span className="text-[11px] text-muted">
              {summary?.low_stock.length || 0} {t.item_count}
            </span>
          </div>
          {summary?.low_stock.length ? (
            summary.low_stock.slice(0, 6).map((x) => (
              <div
                key={x.id}
                className="flex items-center gap-2.5 border-b border-line py-3 text-xs last:border-b-0"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <strong className="text-ink flex-1">{x.name}</strong>
                <span className="text-muted">
                  {x.quantity} / {x.threshold}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted text-sm">{t.no_alerts}</div>
          )}
        </div>
      </div>

      {/* Recent movements */}
      <div className="bg-surface border border-line rounded-2xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-ink m-0">{t.recent_movements}</h2>
          <button
            onClick={onViewMovements}
            className="text-green text-xs font-bold bg-transparent border-0 cursor-pointer hover:underline"
          >
            {t.view_all}
          </button>
        </div>
        <DataTable
          heads={[t.items, "Type", t.quantity, "Date"]}
          rows={(summary?.recent_movements || []).map((x) => [
            x.item_name,
            <Badge key={x.id} value={x.movement_type} />,
            x.quantity,
            date(x.created_at),
          ])}
          emptyText={t.no_data}
        />
      </div>
    </>
  );
}
