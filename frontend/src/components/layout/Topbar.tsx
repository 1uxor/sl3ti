"use client";
import { Menu, Moon, Sun } from "lucide-react";
import type { Language } from "@/i18n/messages";

export function Topbar({
  section,
  user,
  lang,
  dark,
  t,
  onToggleMobile,
  onLang,
  onDark,
}: {
  section: string;
  user: string;
  lang: Language;
  dark: boolean;
  t: Record<string, string>;
  onToggleMobile: () => void;
  onLang: (l: Language) => void;
  onDark: () => void;
}) {
  return (
    <header className="h-[76px] md:h-[68px] border-b border-line bg-surface flex items-center justify-between px-5 md:px-10 sticky top-0 z-20">
      <button
        className="md:hidden text-ink bg-transparent border-0 p-1"
        aria-label="Menu"
        onClick={onToggleMobile}
      >
        <Menu size={22} />
      </button>
      <div className="text-sm font-semibold text-ink">
        Sl3ti{" "}
        <span className="text-muted mx-2">/</span>{" "}
        <span className="text-ink">
          {section === "new_org"
            ? t.new_workspace
            : t[section as keyof typeof t] || section}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <select
          aria-label="Language"
          value={lang}
          onChange={(e) => onLang(e.target.value as Language)}
          className="border-0 bg-transparent text-muted font-bold text-xs cursor-pointer outline-none"
        >
          <option value="fr">FR</option>
          <option value="ar">العربية</option>
          <option value="en">EN</option>
        </select>
        <button
          title="Toggle theme"
          onClick={onDark}
          className="border-0 bg-transparent text-muted hover:text-ink transition-colors p-1"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="w-8 h-8 rounded-full bg-[#d9f0e5] text-[#087f5b] grid place-items-center font-extrabold text-xs">
          {user.slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
