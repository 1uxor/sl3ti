"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";
import { FormField } from "@/components/shared/FormField";
import { post, del } from "@/lib/api";
import type { Location as Loc } from "@/lib/api";

export function Locations({
  locations,
  org,
  orgName,
  t,
  done,
  failed,
}: {
  locations: Loc[];
  org: string;
  orgName: string;
  t: Record<string, string>;
  done: (m: string) => void;
  failed: (e: unknown) => void;
}) {
  const [form, setForm] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const val = (k: string) => values[k] || "";
  const set = (k: string, v: string) => setValues((x) => ({ ...x, [k]: v }));

  async function deleteLocation(id: string) {
    if (!window.confirm(t.confirm_delete)) return;
    try {
      await del("/locations/" + id, org);
      done(t.operation_saved);
    } catch (e) {
      failed(e);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={orgName.toUpperCase()}
        title={t.locations}
        subtitle={t.locations}
        action={
          <button
            onClick={() => { setValues({}); setForm(true); }}
            className="inline-flex items-center gap-2 bg-green text-white rounded-lg px-4 py-2.5 text-xs font-bold hover:brightness-95"
          >
            <Plus size={16} /> {t.new_location}
          </button>
        }
      />
      <DataTable
        heads={[t.name, t.location_type, "Status", "Actions"]}
        rows={locations.map((x) => [
          <strong key={x.id} className="text-ink">{x.name}</strong>,
          x.type,
          t.active,
          <button
            key={x.id}
            onClick={() => deleteLocation(x.id)}
            className="text-red-500 text-[11px] font-bold bg-transparent border-0 cursor-pointer hover:underline"
          >
            {t.delete}
          </button>,
        ])}
        emptyText={t.no_data}
      />
      {form && (
        <Modal
          title={t.new_location}
          onClose={() => setForm(false)}
          onSubmit={async () => {
            setBusy(true);
            try {
              await post("/locations", { name: val("name"), type: val("type") || "warehouse", description: val("description") }, org);
              setForm(false);
              done(t.operation_saved);
            } catch (e) {
              failed(e);
            } finally {
              setBusy(false);
            }
          }}
          busy={busy}
          submitLabel={t.save}
          cancelLabel={t.cancel}
        >
          <FormField label={t.name} value={val("name")} onChange={(v) => set("name", v)} />
          <FormField label={t.location_type} value={val("type")} onChange={(v) => set("type", v)} required={false} />
          <FormField label={t.description} value={val("description")} onChange={(v) => set("description", v)} required={false} />
        </Modal>
      )}
    </>
  );
}
