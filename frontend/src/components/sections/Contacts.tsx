"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";
import { FormField } from "@/components/shared/FormField";
import { post, del } from "@/lib/api";
import type { Contact } from "@/lib/api";

export function Contacts({
  contacts,
  kind,
  org,
  orgName,
  t,
  done,
  failed,
}: {
  contacts: Contact[];
  kind: "customer" | "supplier";
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

  const title = kind === "customer" ? t.customers : t.suppliers;

  async function deleteContact(id: string) {
    if (!window.confirm(t.confirm_delete)) return;
    try {
      await del("/contacts/" + kind + "/" + id, org);
      done(t.operation_saved);
    } catch (e) {
      failed(e);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={orgName.toUpperCase()}
        title={title}
        subtitle={title}
        action={
          <button
            onClick={() => { setValues({}); setForm(true); }}
            className="inline-flex items-center gap-2 bg-green text-white rounded-lg px-4 py-2.5 text-xs font-bold hover:brightness-95"
          >
            <Plus size={16} /> {t.new_contact}
          </button>
        }
      />
      <DataTable
        heads={[t.name, t.phone, t.email, t.address, "Actions"]}
        rows={contacts.map((x) => [
          <strong key={x.id} className="text-ink">{x.name}</strong>,
          x.phone || "—",
          x.email || "—",
          x.address || "—",
          <button
            key={x.id}
            onClick={() => deleteContact(x.id)}
            className="text-red-500 text-[11px] font-bold bg-transparent border-0 cursor-pointer hover:underline"
          >
            {t.delete}
          </button>,
        ])}
        emptyText={t.no_data}
      />
      {form && (
        <Modal
          title={t.new_contact}
          onClose={() => setForm(false)}
          onSubmit={async () => {
            setBusy(true);
            try {
              await post("/contacts/" + kind, { name: val("name"), phone: val("phone"), email: val("email"), address: val("address") }, org);
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
          <FormField label={t.phone} value={val("phone")} onChange={(v) => set("phone", v)} type="tel" required={false} />
          <FormField label={t.email} value={val("email")} onChange={(v) => set("email", v)} type="email" required={false} />
          <FormField label={t.address} value={val("address")} onChange={(v) => set("address", v)} required={false} />
        </Modal>
      )}
    </>
  );
}
