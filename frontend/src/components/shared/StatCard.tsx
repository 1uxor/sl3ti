import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  subtitle,
  Icon,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card p-5 min-h-[136px] flex flex-col justify-between">
      <div className="flex items-center justify-between text-muted text-xs font-semibold">
        <span>{label}</span>
        <div className="w-9 h-9 rounded-xl bg-pale text-green flex items-center justify-center">
          <Icon size={20} />
        </div>
      </div>
      <div>
        <strong className="block text-3xl font-bold tracking-tight text-ink mt-2">
          {String(value)}
        </strong>
        {subtitle && (
          <small className="text-muted text-[11px]">{subtitle}</small>
        )}
      </div>
    </div>
  );
}
