"use client";
import { ChevronDown, Plus, X, LogOut } from "lucide-react";
import { menu, menuGroups } from "@/lib/constants";
import type { Org } from "@/lib/api";
import type { Language } from "@/i18n/messages";

const menuMap = Object.fromEntries(menu.map(([k, v]) => [k, v]));

export function Sidebar({
  orgs,
  org,
  current,
  section,
  user,
  mobile,
  t,
  onSelectOrg,
  onSelectSection,
  onNewOrg,
  onCloseMobile,
  onLogout,
}: {
  orgs: Org[];
  org: string;
  current: Org | undefined;
  section: string;
  user: string;
  mobile: boolean;
  t: Record<string, string>;
  onSelectOrg: (id: string) => void;
  onSelectSection: (s: string) => void;
  onNewOrg: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
}) {
  const visibleSections = current
    ? menu
        .filter(
          ([key]) =>
            !["equipment", "rentals"].includes(key) ||
            current.enabled_modules.includes(
              key === "rentals" ? "rental" : "equipment"
            )
        )
        .map(([k]) => k)
    : [];

  return (
    <aside
      className={`fixed inset-y-0 start-0 z-30 w-[264px] bg-surface border-e border-line flex flex-col transition-transform duration-200 ${
        mobile ? "translate-x-0" : "max-md:-translate-x-full md:translate-x-0"
      } rtl:max-md:translate-x-full rtl:md:translate-x-0 ${mobile ? "rtl:translate-x-0" : ""}`}
    >
      {/* Brand */}
      <div className="h-[76px] px-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#087f5b] text-white grid place-items-center text-2xl font-extrabold">
          س
        </div>
        <div>
          <strong className="text-lg font-extrabold tracking-wider block">SL3TI</strong>
          <small className="text-muted text-xs block leading-none">سلعتي</small>
        </div>
        <button
          className="ms-auto md:hidden text-ink"
          onClick={onCloseMobile}
        >
          <X size={20} />
        </button>
      </div>

      {/* Workspace selector */}
      <div className="mx-3 p-3.5 border border-line rounded-xl bg-bg">
        <span className="text-[10px] font-extrabold tracking-widest text-muted uppercase">
          {t.workspace_label}
        </span>
        <div className="relative mt-1.5">
          <select
            aria-label="Organisation"
            value={org}
            onChange={(e) => onSelectOrg(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-ink font-bold text-sm appearance-none cursor-pointer pe-6"
          >
            {orgs.map((x) => (
              <option key={x.id} value={x.id}>{x.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute end-0 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
        <button
          onClick={onNewOrg}
          className="flex items-center gap-1.5 mt-2 text-green text-xs font-semibold bg-transparent border-0 p-0 cursor-pointer"
        >
          <Plus size={13} /> {t.new_space}
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 pt-5 pb-4 overflow-auto flex-1">
        {menuGroups.map((group) => {
          const items = group.items.filter((k) => (visibleSections as string[]).includes(k));
          if (!items.length) return null;
          return (
            <div key={group.label} className="mb-4">
              <span className="block px-3.5 pb-2 text-[10px] font-extrabold tracking-widest text-muted uppercase">
                {group.label}
              </span>
              {items.map((key) => {
                const Icon = menuMap[key];
                const active = section === key;
                return (
                  <button
                    key={key}
                    data-nav={key}
                    onClick={() => onSelectSection(key)}
                    className={`w-full flex items-center gap-3 border-0 px-3.5 py-2.5 rounded-lg text-start text-[13px] font-semibold my-0.5 transition-all cursor-pointer ${
                      active
                        ? "bg-pale text-green font-bold border-s-2 border-green"
                        : "bg-transparent text-muted hover:bg-bg hover:text-ink"
                    }`}
                  >
                    {Icon && <Icon size={18} />}
                    <span>{t[key as keyof typeof t] || key}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-line px-4 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#d9f0e5] text-[#087f5b] grid place-items-center font-extrabold text-sm flex-shrink-0">
          {user.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block text-xs truncate">{user}</strong>
          <small className="block text-[11px] text-muted capitalize">
            {current?.role}
          </small>
        </div>
        <button
          title={t.logout}
          onClick={onLogout}
          className="text-muted hover:text-ink transition-colors border-0 bg-transparent p-1"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
