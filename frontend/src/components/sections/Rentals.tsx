"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Modal } from "@/components/shared/Modal";
import { FormField, FormSelect } from "@/components/shared/FormField";
import { post } from "@/lib/api";
import { date } from "@/lib/formatting";
import type { Asset, Contact, Rental } from "@/lib/api";

export function Rentals({
  rentals,
  assets,
  customers,
  org,
  orgName,
  t,
  done,
  failed,
}: {
  rentals: Rental[];
  assets: Asset[];
  customers: Contact[];
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
  const available = assets.filter((x) => x.status === "available");

  return (
    <>
      <PageHeader
        eyebrow={orgName.toUpperCase()}
        title={t.rentals}
        subtitle={t.rentals}
        action={
          <button
            onClick={() => { setValues({}); setForm(true); }}
            className="inline-flex items-center gap-2 bg-green text-white rounded-lg px-4 py-2.5 text-xs font-bold hover:brightness-95"
          >
            <Plus size={16} /> {t.new_rental}
          </button>
        }
      />
      <DataTable
        heads={[t.equipment, t.customers, t.start_date, t.expected_return, "Status", "Action"]}
        rows={rentals.map((x) => [
          assets.find((a) => a.id === x.asset_id)?.serial_number || "—",
          customers.find((c) => c.id === x.customer_id)?.name || "—",
          date(x.start_date),
          date(x.expected_return_date),
          <Badge key={x.id} value={x.overdue ? t.overdue : x.status} />,
          <div className="flex gap-1.5" key={x.id + "a"}>
            {x.status === "active" && (
              <button
                onClick={() => post("/rentals/" + x.id + "/return", {}, org).then(() => done(t.operation_saved)).catch(failed)}
                className="text-green text-[11px] font-bold bg-transparent border-0 cursor-pointer hover:underline"
              >
                {t.return_item}
              </button>
            )}
            {x.status === "reserved" && (
              <button
                onClick={() => post("/rentals/" + x.id + "/cancel", {}, org).then(() => done(t.operation_saved)).catch(failed)}
                className="text-red-500 text-[11px] font-bold bg-transparent border-0 cursor-pointer hover:underline"
              >
                {t.cancel_reservation}
              </button>
            )}
          </div>,
        ])}
        emptyText={t.no_data}
      />
      {form && (
        <Modal
          title={t.new_rental}
          onClose={() => setForm(false)}
          onSubmit={async () => {
            setBusy(true);
            try {
              await post("/rentals", {
                asset_id: val("asset_id"),
                customer_id: val("customer_id"),
                start_date: new Date(val("start_date")).toISOString(),
                expected_return_date: new Date(val("expected_return_date")).toISOString(),
                notes: val("notes"),
              }, org);
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
          <FormSelect label={t.equipment} value={val("asset_id")} onChange={(v) => set("asset_id", v)} options={available.map((x) => ({ id: x.id, name: x.serial_number }))} />
          <FormSelect label={t.customers} value={val("customer_id")} onChange={(v) => set("customer_id", v)} options={customers.map((x) => ({ id: x.id, name: x.name }))} />
          <FormField label={t.start_date} value={val("start_date")} onChange={(v) => set("start_date", v)} type="datetime-local" />
          <FormField label={t.expected_return} value={val("expected_return_date")} onChange={(v) => set("expected_return_date", v)} type="datetime-local" />
          <FormField label={t.notes} value={val("notes")} onChange={(v) => set("notes", v)} required={false} />
        </Modal>
      )}
    </>
  );
}
