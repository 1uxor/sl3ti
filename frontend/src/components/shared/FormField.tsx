export function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block text-xs font-bold text-ink mt-3.5 mb-0">
      {label}
      <input
        className="block w-full border border-line rounded-lg bg-surface text-ink px-3 py-2.5 mt-1.5 outline-none text-sm focus:border-green focus:ring-2 focus:ring-pale transition-colors"
        type={type}
        step={type === "number" ? "any" : undefined}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <small className="text-muted text-[10px] mt-1 block">{hint}</small>}
    </label>
  );
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Choisir…",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-bold text-ink mt-3.5 mb-0">
      {label}
      <select
        className="block w-full border border-line rounded-lg bg-surface text-ink px-3 py-2.5 mt-1.5 outline-none text-sm focus:border-green focus:ring-2 focus:ring-pale transition-colors"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
    </label>
  );
}
