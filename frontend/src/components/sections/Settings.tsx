"use client";
import { useState } from "react";
import { patch } from "@/lib/api";
import type { Org } from "@/lib/api";

export function Settings({
  org,
  current,
  user,
  t,
  done,
  failed,
}: {
  org: string;
  current: Org;
  user: string;
  t: Record<string, string>;
  done: (m: string) => void;
  failed: (e: unknown) => void;
}) {
  const [tab, setTab] = useState<"modules" | "org" | "profile">("modules");
  const isAdmin = ["owner", "admin"].includes(current.role);

  const tabs = [
    { key: "modules" as const, label: t.modules },
    ...(isAdmin ? [{ key: "org" as const, label: t.organization }] : []),
    { key: "profile" as const, label: t.profile },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">{t.settings}</h1>
        <p className="text-sm text-muted">{t.settings}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line mb-6">
        {tabs.map((x) => (
          <button
            key={x.key}
            onClick={() => setTab(x.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors bg-transparent cursor-pointer ${
              tab === x.key
                ? "border-green text-green"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {/* Modules */}
      {tab === "modules" && (
        <div className="bg-surface border border-line rounded-2xl shadow-card p-6 max-w-[620px]">
          <h2 className="text-base font-bold text-ink mb-1">{t.modules}</h2>
          <p className="text-xs text-muted mb-4">{t.modules_desc}</p>
          {["commerce", "equipment", "rental"].map((mod) => (
            <label
              key={mod}
              className="flex items-center gap-3 border-t border-line py-4 text-sm font-semibold cursor-pointer"
            >
              <div
                onClick={async () => {
                  if (!isAdmin) return;
                  const checked = !current.enabled_modules.includes(mod);
                  let modules = checked
                    ? [...current.enabled_modules, mod]
                    : current.enabled_modules.filter((y) => y !== mod);
                  if (modules.includes("rental") && !modules.includes("equipment"))
                    modules.push("equipment");
                  if (mod === "equipment" && !checked)
                    modules = modules.filter((y) => y !== "rental");
                  try {
                    await patch("/organizations/current/modules", { enabled_modules: modules }, org);
                    done(t.operation_saved);
                  } catch (err) {
                    failed(err);
                  }
                }}
                className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${
                  current.enabled_modules.includes(mod) ? "bg-green" : "bg-line"
                } ${!isAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    current.enabled_modules.includes(mod) ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="text-ink">
                {mod === "commerce" ? t.commerce : mod === "equipment" ? t.equipment : t.rentals}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Organization */}
      {tab === "org" && isAdmin && (
        <div className="bg-surface border border-line rounded-2xl shadow-card p-6 max-w-[620px]">
          <h2 className="text-base font-bold text-ink mb-1">{t.organization}</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const nameInput = (e.currentTarget.elements.namedItem("org_name") as HTMLInputElement).value;
              try {
                await patch("/organizations/current", { name: nameInput }, org);
                done(t.operation_saved);
              } catch (err) {
                failed(err);
              }
            }}
          >
            <label className="block text-xs font-bold text-ink mt-3.5">
              {t.name}
              <input
                className="block w-full border border-line rounded-lg bg-surface text-ink px-3 py-2.5 mt-1.5 outline-none text-sm focus:border-green focus:ring-2 focus:ring-pale"
                name="org_name"
                required
                minLength={2}
                defaultValue={current.name}
              />
            </label>
            <button className="mt-4 px-5 py-2.5 rounded-lg text-sm font-bold bg-green text-white hover:brightness-95">
              {t.rename}
            </button>
          </form>
        </div>
      )}

      {/* Profile */}
      {tab === "profile" && (
        <div className="bg-surface border border-line rounded-2xl shadow-card p-6 max-w-[620px]">
          <h2 className="text-base font-bold text-ink mb-1">{t.profile}</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const body: Record<string, string> = {};
              const n = (f.elements.namedItem("profile_name") as HTMLInputElement).value;
              if (n && n !== user) body.full_name = n;
              const cp = (f.elements.namedItem("current_password") as HTMLInputElement).value;
              const np = (f.elements.namedItem("new_password") as HTMLInputElement).value;
              if (np) {
                if (!cp) {
                  failed(new Error(t.current_password));
                  return;
                }
                body.current_password = cp;
                body.new_password = np;
              }
              if (!Object.keys(body).length) return;
              try {
                await patch("/auth/me", body);
                done(t.operation_saved);
              } catch (err) {
                failed(err);
              }
            }}
          >
            <label className="block text-xs font-bold text-ink mt-3.5">
              {t.full_name}
              <input
                className="block w-full border border-line rounded-lg bg-surface text-ink px-3 py-2.5 mt-1.5 outline-none text-sm focus:border-green focus:ring-2 focus:ring-pale"
                name="profile_name"
                defaultValue={user}
              />
            </label>
            <label className="block text-xs font-bold text-ink mt-3.5">
              {t.current_password}
              <input
                className="block w-full border border-line rounded-lg bg-surface text-ink px-3 py-2.5 mt-1.5 outline-none text-sm focus:border-green focus:ring-2 focus:ring-pale"
                name="current_password"
                type="password"
              />
            </label>
            <label className="block text-xs font-bold text-ink mt-3.5">
              {t.new_password}
              <input
                className="block w-full border border-line rounded-lg bg-surface text-ink px-3 py-2.5 mt-1.5 outline-none text-sm focus:border-green focus:ring-2 focus:ring-pale"
                name="new_password"
                type="password"
                minLength={10}
              />
              <small className="text-muted text-[10px] mt-1 block">{t.password_hint}</small>
            </label>
            <button className="mt-4 px-5 py-2.5 rounded-lg text-sm font-bold bg-green text-white hover:brightness-95">
              {t.update_profile}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
