"use client";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { post } from "@/lib/api";

export function OnboardPage({
  done,
  failed,
  error,
  user,
  compact = false,
  t,
}: {
  done: () => void;
  failed: (e: unknown) => void;
  error: string;
  user: string;
  compact?: boolean;
  t: Record<string, string>;
}) {
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [type, setType] = useState("commerce");
  const [busy, setBusy] = useState(false);

  const templates: [string, string, string][] = [
    ["commerce", t.commerce, t.products_stock],
    ["equipment", t.equipment, t.individual_assets],
    ["rental", t.rentals, t.rental_assets],
    ["custom", t.other, t.flexible],
  ];

  return (
    <div className={compact ? "py-3" : "min-h-screen flex items-center justify-center p-8"}>
      <div className="w-full max-w-[650px] bg-surface border border-line rounded-2xl p-8 shadow-card mx-auto">
        <span className="text-[10px] font-extrabold tracking-widest text-muted uppercase">
          {t.new_workspace}
        </span>
        <h1 className="text-3xl font-bold tracking-tight mt-2 mb-1 text-ink">
          {t.welcome}, {user.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted mb-6">{t.workspace_prompt}</p>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          {templates.map(([id, label, sub]) => (
            <button
              key={id}
              onClick={() => setType(id)}
              className={`border rounded-xl p-3.5 text-start flex flex-col gap-2 transition-all cursor-pointer ${
                type === id
                  ? "border-green bg-pale"
                  : "border-line bg-surface hover:border-green/30"
              }`}
            >
              <Building2 size={22} className="text-green" />
              <strong className="text-xs text-ink">{label}</strong>
              <small className="text-[10px] text-muted">{sub}</small>
            </button>
          ))}
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await post("/organizations", {
                name,
                business_type: type,
                main_location: place,
              });
              done();
            } catch (e) {
              failed(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block text-xs font-bold text-ink mt-3.5">
            {t.org_name}
            <input
              required
              minLength={2}
              className="block w-full border border-line rounded-lg bg-surface text-ink px-3 py-2.5 mt-1.5 outline-none text-sm focus:border-green focus:ring-2 focus:ring-pale"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Atlas Commerce"
            />
          </label>
          <label className="block text-xs font-bold text-ink mt-3.5">
            {t.main_location}
            <input
              required
              minLength={2}
              className="block w-full border border-line rounded-lg bg-surface text-ink px-3 py-2.5 mt-1.5 outline-none text-sm focus:border-green focus:ring-2 focus:ring-pale"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Ex. Magasin principal"
            />
          </label>
          <button
            className="mt-5 px-5 py-3 rounded-lg text-sm font-bold bg-green text-white hover:brightness-95 disabled:opacity-50"
            disabled={busy}
          >
            {t.create_workspace} →
          </button>
        </form>
      </div>
    </div>
  );
}
