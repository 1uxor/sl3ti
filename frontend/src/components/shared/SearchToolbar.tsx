import { Search } from "lucide-react";

export function SearchToolbar({
  value,
  onChange,
  placeholder,
  count,
  countLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  count?: number;
  countLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 border border-line rounded-xl bg-surface px-4 py-3 mb-4 text-muted">
      <Search size={18} />
      <input
        className="border-0 bg-transparent outline-none flex-1 min-w-0 text-ink text-xs"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {count !== undefined && (
        <span className="text-[11px] whitespace-nowrap">
          {count} {countLabel}
        </span>
      )}
    </div>
  );
}
