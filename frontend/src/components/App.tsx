"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, post, type Org, type Item, type Balance, type Movement, type Summary, type Asset, type Rental, type Contact, type Location } from "@/lib/api";
import { messages, type Language } from "@/i18n/messages";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Spinner } from "@/components/shared/Spinner";
import { Toast } from "@/components/shared/Toast";
import { AuthPage } from "@/components/auth/AuthPage";
import { OnboardPage } from "@/components/onboard/OnboardPage";
import { Dashboard } from "@/components/sections/Dashboard";
import { Items } from "@/components/sections/Items";
import { Inventory } from "@/components/sections/Inventory";
import { Movements } from "@/components/sections/Movements";
import { Locations } from "@/components/sections/Locations";
import { Contacts } from "@/components/sections/Contacts";
import { Equipment } from "@/components/sections/Equipment";
import { Rentals } from "@/components/sections/Rentals";
import { Reports } from "@/components/sections/Reports";
import { Team } from "@/components/sections/Team";
import { Settings } from "@/components/sections/Settings";
import { useData } from "@/hooks/useData";

export function App() {
  const qc = useQueryClient();
  const [user, setUser] = useState<{ full_name: string; preferred_language: string } | null | undefined>(undefined);
  const [org, setOrg] = useState("");
  const [section, setSection] = useState("dashboard");
  const [lang, setLang] = useState<Language>("fr");
  const [dark, setDark] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const orgs = useQuery<Org[]>({
    queryKey: ["orgs", user?.full_name],
    queryFn: () => api("/organizations"),
    enabled: !!user,
  });

  const current = orgs.data?.find((x) => x.id === org);

  // Data hooks
  const items = useData<{ data: Item[]; total: number }>("/items?page_size=100", org);
  const locations = useData<Location[]>("/locations", org);
  const categories = useData<{ id: string; name: string }[]>("/categories", org);
  const balances = useData<Balance[]>("/inventory/balances", org);
  const movements = useData<{ data: Movement[]; total: number }>("/movements?page_size=100", org);
  const summary = useData<Summary>("/dashboard/summary", org);
  const assets = useData<Asset[]>("/assets", org, !!current?.enabled_modules.includes("equipment"));
  const rentals = useData<Rental[]>("/rentals", org, !!current?.enabled_modules.includes("rental"));
  const customers = useData<Contact[]>("/contacts/customer", org);
  const suppliers = useData<Contact[]>("/contacts/supplier", org);

  useEffect(() => {
    api<{ full_name: string; preferred_language: string }>("/auth/me")
      .then((x) => { setUser(x); setLang((x.preferred_language as Language) || "fr"); })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (orgs.data?.length && !orgs.data.some((x) => x.id === org)) {
      setOrg(orgs.data[0].id);
      setSection("dashboard");
    }
  }, [orgs.data, org]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.classList.toggle("dark", dark);
  }, [lang, dark]);

  const t = messages[lang];

  function done(message: string) {
    setNotice(message);
    setError("");
    qc.invalidateQueries();
    setTimeout(() => setNotice(""), 4000);
  }

  function failed(e: unknown) {
    setError(e instanceof Error ? e.message : "Erreur");
  }

  // Loading states
  if (user === undefined) return <Spinner text={t.loading_app} />;
  if (!user) return <AuthPage onSuccess={(x) => { setUser(x); setLang((x.preferred_language as Language) || "fr"); }} failed={failed} error={error} t={t} />;
  if (orgs.isLoading) return <Spinner text={t.loading_spaces} />;
  if (!orgs.data?.length) return <OnboardPage done={() => { orgs.refetch(); done(t.space_created); }} failed={failed} error={error} user={user.full_name} t={t} />;

  const loading = [items, locations, balances, movements, summary].some((x) => x.isLoading);
  const hasError = [items, locations, balances, movements, summary].some((x) => x.isError);
  const orgName = current?.name || "";

  return (
    <div className="flex min-h-screen">
      <Sidebar
        orgs={orgs.data}
        org={org}
        current={current}
        section={section}
        user={user.full_name}
        mobile={mobile}
        t={t}
        onSelectOrg={(id) => { setOrg(id); setSection("dashboard"); setMobile(false); }}
        onSelectSection={(s) => { setSection(s); setMobile(false); setError(""); }}
        onNewOrg={() => setSection("new_org")}
        onCloseMobile={() => setMobile(false)}
        onLogout={async () => {
          try { await post("/auth/logout", {}); setUser(null); setOrg(""); } catch (e) { failed(e); }
        }}
      />

      {mobile && (
        <div
          className="fixed inset-0 bg-black/35 z-20 md:hidden"
          onClick={() => setMobile(false)}
        />
      )}

      <main className="md:ms-[264px] w-full md:w-[calc(100%-264px)] min-w-0">
        <Topbar
          section={section}
          user={user.full_name}
          lang={lang}
          dark={dark}
          t={t}
          onToggleMobile={() => setMobile(true)}
          onLang={setLang}
          onDark={() => setDark(!dark)}
        />

        <div className="max-w-[1500px] mx-auto px-5 md:px-10 py-8 pb-20">
          {notice && <Toast message={notice} type="success" onClose={() => setNotice("")} />}
          {error && <Toast message={error} type="error" onClose={() => setError("")} />}

          {section === "new_org" ? (
            <OnboardPage
              compact
              done={() => { orgs.refetch(); setSection("dashboard"); done(t.space_created); }}
              failed={failed}
              error=""
              user={user.full_name}
              t={t}
            />
          ) : !current ? (
            <div className="text-center py-10 text-muted text-sm">{t.select_workspace}</div>
          ) : loading ? (
            <Spinner text={t.loading_data} />
          ) : hasError ? (
            <div className="text-center py-10 text-muted text-sm">{t.api_error}</div>
          ) : (
            <>
              {section === "dashboard" && (
                <Dashboard
                  summary={summary.data}
                  balances={balances.data || []}
                  orgName={orgName}
                  t={t}
                  onNewReceipt={() => setSection("inventory")}
                  onViewMovements={() => document.querySelector<HTMLButtonElement>('[data-nav="movements"]')?.click()}
                />
              )}
              {section === "items" && (
                <Items
                  items={items.data?.data || []}
                  total={items.data?.total || 0}
                  categories={categories.data || []}
                  org={org}
                  orgName={orgName}
                  t={t}
                  done={done}
                  failed={failed}
                />
              )}
              {section === "inventory" && (
                <Inventory
                  balances={balances.data || []}
                  items={items.data?.data || []}
                  locations={locations.data || []}
                  org={org}
                  orgName={orgName}
                  t={t}
                  done={done}
                  failed={failed}
                />
              )}
              {section === "movements" && (
                <Movements
                  movements={movements.data?.data || []}
                  locations={locations.data || []}
                  orgName={orgName}
                  t={t}
                />
              )}
              {section === "locations" && (
                <Locations
                  locations={locations.data || []}
                  org={org}
                  orgName={orgName}
                  t={t}
                  done={done}
                  failed={failed}
                />
              )}
              {section === "customers" && (
                <Contacts
                  contacts={customers.data || []}
                  kind="customer"
                  org={org}
                  orgName={orgName}
                  t={t}
                  done={done}
                  failed={failed}
                />
              )}
              {section === "suppliers" && (
                <Contacts
                  contacts={suppliers.data || []}
                  kind="supplier"
                  org={org}
                  orgName={orgName}
                  t={t}
                  done={done}
                  failed={failed}
                />
              )}
              {section === "equipment" && (
                <Equipment
                  assets={assets.data || []}
                  items={items.data?.data || []}
                  locations={locations.data || []}
                  org={org}
                  orgName={orgName}
                  t={t}
                  done={done}
                  failed={failed}
                />
              )}
              {section === "rentals" && (
                <Rentals
                  rentals={rentals.data || []}
                  assets={assets.data || []}
                  customers={customers.data || []}
                  org={org}
                  orgName={orgName}
                  t={t}
                  done={done}
                  failed={failed}
                />
              )}
              {section === "reports" && (
                <Reports
                  summary={summary.data}
                  items={items.data?.data || []}
                  balances={balances.data || []}
                  org={org}
                  orgName={orgName}
                  t={t}
                  failed={failed}
                />
              )}
              {section === "team" && (
                <Team
                  org={org}
                  current={current}
                  orgName={orgName}
                  t={t}
                  done={done}
                  failed={failed}
                />
              )}
              {section === "settings" && (
                <Settings
                  org={org}
                  current={current}
                  user={user.full_name}
                  t={t}
                  done={done}
                  failed={failed}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
