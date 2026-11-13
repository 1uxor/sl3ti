"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Modal } from "@/components/shared/Modal";
import { FormField, FormSelect } from "@/components/shared/FormField";
import { post } from "@/lib/api";
import type { Asset, Item, Location as Loc } from "@/lib/api";

export function Equipment({
  assets,
  items,
  locations,
  org,
  orgName,
  t,
  done,
  failed,
}: {
  assets: Asset[];
  items: Item[];
  locations: Loc[];
  org: string;
  orgName: string;
  t: Record<string, string>;
  done: (m: string) => void;
  failed: (e: unknown) => void;
}) {
  const [form, setForm] = useState<"" | "asset" | "assign">("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const val = (k: string) => values[k] || "";
  const set = (k: string, v: string) => setValues((x) => ({ ...x, [k]: v }));
  const serialized = items.filter((x) => x.tracking_mode === "SERIALIZED");

  return (
    <>
      <PageHeader
        eyebrow={orgName.toUpperCase()}
        title={t.equipment}
        subtitle={t.equipment}
        action={
          <button
            onClick={() => { setValues({}); setForm("asset"); }}
            className="inline-flex items-center gap-2 bg-green text-white rounded-lg px-4 py-2.5 text-xs font-bold hover:brightness-95"
          >
            <Plus size={16} /> {t.new_equipment}
          </button>
        }
      />
      <DataTable
        heads={[t.serial_number, t.items, t.location, "Status", t.assignment, "Actions"]}
        rows={assets.map((x) => [
          <strong key={x.id} className="text-ink">{x.serial_number}</strong>,
          items.find((i) => i.id === x.item_id)?.name || "—",
          locations.find((p) => p.id === x.current_location_id)?.name || "—",
          <Badge key={x.id + "s"} value={x.status} />,
          x.assigned_to || "—",
          <div key={x.id + "a"} className="flex gap-1.5">
            {x.status === "available" && (
              <>
                <button
                  onClick={() => { set("asset_id", x.id); setForm("assign"); }}
                  className="text-green text-[11px] font-bold bg-transparent border-0 cursor-pointer hover:underline"
                >
                  {t.assign}
                </button>
                <button
                  onClick={() => post("/assets/" + x.id + "/maintenance", {}, org).then(() => done(t.operation_saved)).catch(failed)}
                  className="text-muted text-[11px] font-bold bg-transparent border-0 cursor-pointer hover:underline"
                >
                  {t.maintenance}
                </button>
              </>
            )}
            {x.status === "assigned" && (
              <button
                onClick={() => post("/assets/" + x.id + "/return", {}, org).then(() => done(t.operation_saved)).catch(failed)}
                className="text-green text-[11px] font-bold bg-transparent border-0 cursor-pointer hover:underline"
              >
                {t.return_item}
              </button>
            )}
            {x.status === "maintenance" && (
              <button
                onClick={() => post("/assets/" + x.id + "/available", {}, org).then(() => done(t.operation_saved)).catch(failed)}
                className="text-green text-[11px] font-bold bg-transparent border-0 cursor-pointer hover:underline"
              >
                {t.available}
              </button>
            )}
          </div>,
        ])}
        emptyText={t.no_data}
      />
      {form === "asset" && (
        <Modal
          title={t.new_equipment}
          onClose={() => setForm("")}
          onSubmit={async () => {
            setBusy(true);
            try {
              await post("/assets", { item_id: val("item_id"), serial_number: val("serial_number"), current_location_id: val("current_location_id") }, org);
              setForm("");
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
          <FormSelect label={t.items} value={val("item_id")} onChange={(v) => set("item_id", v)} options={serialized.map((x) => ({ id: x.id, name: x.name }))} />
          <FormField label={t.serial_number} value={val("serial_number")} onChange={(v) => set("serial_number", v)} />
          <FormSelect label={t.location} value={val("current_location_id")} onChange={(v) => set("current_location_id", v)} options={locations.map((x) => ({ id: x.id, name: x.name }))} />
        </Modal>
      )}
      {form === "assign" && (
        <Modal
          title={t.assign}
          onClose={() => setForm("")}
          onSubmit={async () => {
            setBusy(true);
            try {
              await post("/assets/" + val("asset_id") + "/assign", { person: val("person") }, org);
              setForm("");
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
          <FormField label={t.person_name} value={val("person")} onChange={(v) => set("person", v)} />
        </Modal>
      )}
    </>
  );
}
