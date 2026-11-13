"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Modal } from "@/components/shared/Modal";
import { FormField, FormSelect } from "@/components/shared/FormField";
import { useData } from "@/hooks/useData";
import { post } from "@/lib/api";
import type { Org } from "@/lib/api";

export function Team({
  org,
  current,
  orgName,
  t,
  done,
  failed,
}: {
  org: string;
  current: Org;
  orgName: string;
  t: Record<string, string>;
  done: (m: string) => void;
  failed: (e: unknown) => void;
}) {
  const members = useData<{ id: string; full_name: string; email: string; role: string }[]>("/members", org);
  const [form, setForm] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const val = (k: string) => values[k] || "";
  const set = (k: string, v: string) => setValues((x) => ({ ...x, [k]: v }));

  return (
    <>
      <PageHeader
        eyebrow={orgName.toUpperCase()}
        title={t.team}
        subtitle={t.team}
        action={
          ["owner", "admin"].includes(current.role) ? (
            <button
              onClick={() => { setValues({}); setForm(true); }}
              className="inline-flex items-center gap-2 bg-green text-white rounded-lg px-4 py-2.5 text-xs font-bold hover:brightness-95"
            >
              <Plus size={16} /> {t.add_member}
            </button>
          ) : undefined
        }
      />
      <DataTable
        heads={[t.name, t.email, t.role]}
        rows={(members.data || []).map((x) => [
          x.full_name,
          x.email,
          <Badge key={x.id} value={x.role} />,
        ])}
        emptyText={t.no_data}
      />
      {form && (
        <Modal
          title={t.add_member}
          onClose={() => setForm(false)}
          onSubmit={async () => {
            setBusy(true);
            try {
              await post("/members", { email: val("email"), role: val("role") }, org);
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
          <FormField label={t.email} value={val("email")} onChange={(v) => set("email", v)} type="email" />
          <FormSelect
            label={t.role}
            value={val("role")}
            onChange={(v) => set("role", v)}
            options={[
              { id: "admin", name: "Admin" },
              { id: "manager", name: "Manager" },
              { id: "staff", name: "Staff" },
              { id: "viewer", name: "Viewer" },
            ]}
          />
        </Modal>
      )}
    </>
  );
}
