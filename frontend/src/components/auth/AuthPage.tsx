"use client";
import { useState } from "react";
import { Package, BarChart3, Shield, Eye, EyeOff } from "lucide-react";
import { post } from "@/lib/api";
import { authSchema } from "@/lib/constants";

export function AuthPage({
  onSuccess,
  failed,
  error,
  t,
}: {
  onSuccess: (x: { full_name: string; preferred_language: string }) => void;
  failed: (e: unknown) => void;
  error: string;
  t: Record<string, string>;
}) {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const parsed = authSchema.parse({ email, password });
      const r = await post<{ user: { full_name: string; preferred_language: string } }>(
        register ? "/auth/register" : "/auth/login",
        { ...parsed, ...(register ? { full_name: fullName } : {}) }
      );
      onSuccess(r.user);
    } catch (e) {
      failed(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[48%_52%] bg-surface">
      {/* Left side */}
      <div className="hidden md:flex flex-col justify-center bg-[#075a46] text-white px-[12%] py-[8%] relative overflow-hidden">
        <div className="absolute w-[520px] h-[520px] border border-white/10 rounded-full -bottom-[280px] -right-[180px] shadow-[0_0_0_90px_rgba(255,255,255,0.025),0_0_0_180px_rgba(255,255,255,0.02)]" />
        <div className="flex items-center gap-3 mb-14">
          <div className="w-9 h-9 rounded-xl bg-white text-[#075a46] grid place-items-center text-2xl font-extrabold">
            س
          </div>
          <div>
            <strong className="text-lg font-extrabold tracking-wider block">SL3TI</strong>
            <small className="text-[#add6c9] text-xs block">سلعتي</small>
          </div>
        </div>
        <h1 className="text-[clamp(42px,5vw,70px)] font-bold tracking-tighter leading-none m-0">
          {t.manage_simply}
          <br />
          <em className="text-[#83dcaa] not-italic">{t.simply}</em>
        </h1>
        <p className="text-lg leading-relaxed text-[#c1e2d7] max-w-[390px] mt-4">
          {t.tagline}
        </p>
        <div className="flex gap-3 flex-wrap mt-8">
          {([
            [Package, t.articles] as const,
            [BarChart3, t.clear_view] as const,
            [Shield, t.protected_data] as const,
          ] as const).map(([Icon, label], i) => (
            <div
              key={i}
              className="flex items-center gap-2 border border-white/20 rounded-lg px-3.5 py-2.5 text-[11px]"
            >
              <Icon size={15} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center justify-center p-8 min-h-screen md:min-h-0">
        <div className="w-full max-w-[390px]">
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-6 md:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#087f5b] text-white grid place-items-center text-2xl font-extrabold">
              س
            </div>
            <strong className="text-lg font-extrabold tracking-wider">SL3TI</strong>
          </div>

          <span className="text-[10px] font-extrabold tracking-widest text-muted uppercase">
            {t.welcome_sl3ti}
          </span>
          <h2 className="text-3xl font-bold tracking-tight mt-3 mb-1 text-ink">
            {register ? t.create_account : t.welcome_back}
          </h2>
          <p className="text-sm text-muted mb-7">
            {register ? t.register_prompt : t.login_prompt}
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            {register && (
              <label className="block text-xs font-bold text-ink mt-3.5">
                {t.full_name}
                <input
                  className="block w-full border border-line rounded-lg bg-surface text-ink px-3 py-2.5 mt-1.5 outline-none text-sm focus:border-green focus:ring-2 focus:ring-pale"
                  required
                  minLength={2}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>
            )}
            <label className="block text-xs font-bold text-ink mt-3.5">
              {t.email}
              <input
                className="block w-full border border-line rounded-lg bg-surface text-ink px-3 py-2.5 mt-1.5 outline-none text-sm focus:border-green focus:ring-2 focus:ring-pale"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-xs font-bold text-ink mt-3.5 relative">
              {t.new_password || "Password"}
              <div className="relative">
                <input
                  className="block w-full border border-line rounded-lg bg-surface text-ink px-3 py-2.5 pe-10 mt-1.5 outline-none text-sm focus:border-green focus:ring-2 focus:ring-pale"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={10}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink bg-transparent border-0 p-0 mt-0.5"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <small className="text-muted text-[10px] mt-1 block">{t.password_min}</small>
            </label>
            <button
              className="w-full mt-5 px-5 py-3 rounded-lg text-sm font-bold bg-green text-white hover:brightness-95 disabled:opacity-50 transition-all"
              disabled={busy}
            >
              {busy ? t.loading : register ? t.register : t.login} →
            </button>
          </form>
          <button
            onClick={() => setRegister(!register)}
            className="block mx-auto mt-5 text-green text-sm font-bold bg-transparent border-0 cursor-pointer hover:underline"
          >
            {register ? t.already_account : t.no_account}
          </button>
        </div>
      </div>
    </div>
  );
}
