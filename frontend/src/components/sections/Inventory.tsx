"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";
import { FormField, FormSelect } from "@/components/shared/FormField";
import { post } from "@/lib/api";
import type { Balance, Item, Location } from "@/lib/api";

type MovementKind = "receipt" | "issue" | "transfer" | "adjustment";

export function Inventory({
  balances,
  items,
  locations,
  org,
  orgName,
  t,
  done,
  failed,
}: {
  balances: Balance[];
  items: Item[];
  locations: Location[];
  org: string;
  orgName: string;
  t: Record<string, string>;
  done: (m: string) => void;
  failed: (e: unknown) => void;
}) {
  const [form, setForm] = useState<"" | MovementKind>("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const val = (k: string) => values[k] || "";
  const set = (k: string, v: string) => setValues((x) => ({ ...x, [k]: v }));
  const bulkItems = items.filter((x) => x.tracking_mode === "BULK" && x.is_active);

  const titles: Record<MovementKind, string> = {
    receipt: t.stock_receipt,
    issue: t.stock_issue,
    transfer: t.stock_transfer,
    adjustment: t.stock_adjustment,
  };

  async function submitMovement(kind: MovementKind) {
    setBusy(true);
    try {
      const path =
        kind === "adjustment"
          ? "/inventory/adjustments"
          : "/inventory/" + kind + "s";
      const body =
        kind === "adjustment"
          ? {
              item_id: val("item_id"),
              location_id: val("location_id"),
              counted_quantity: val("counted_quantity"),
              reason: val("reason"),
            }
          : {
              item_id: val("item_id"),
              source_location_id: val("source_location_id") || null,
              destination_location_id: val("destination_location_id") || null,
              quantity: val("quantity"),
              reference: val("reference"),
              note: val("note"),
            };
      await post(path, body, org, crypto.randomUUID());
      setForm("");
      setValues({});
      done(t.operation_saved);
    } catch (e) {
      failed(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={orgName.toUpperCase()}
        title={t.inventory}
        subtitle={t.inventory}
        action={
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setValues({}); setForm("receipt"); }}
              className="inline-flex items-center gap-2 bg-green text-white rounded-lg px-4 py-2.5 text-xs font-bold hover:brightness-95"
            >
              <Plus size={16} /> {t.receipt}
            </button>
            {(["issue", "transfer", "adjustment"] as const).map((k) => (
              <button
                key={k}
                onClick={() => { setValues({}); setForm(k); }}
                className="inline-flex items-center gap-2 border border-line bg-surface text-ink rounded-lg px-4 py-2.5 text-xs font-bold hover:bg-bg"
              >
                {t[k]}
              </button>
            ))}
          </div>
        }
      />

      <DataTable
        heads={[t.items, t.sku, t.location, t.quantity]}
        rows={balances.map((x) => [
          <strong key={x.item_id} className="text-ink">{x.item_name}</strong>,
          x.sku,
          x.location_name,
          <strong
            key={x.location_id}
            className={
              Number(x.quantity) <= 0
                ? "text-red-500"
                : "text-ink"
            }
          >
            {x.quantity}
          </strong>,
        ])}
        emptyText={t.no_data}
      />

      {form && (
        <Modal
          title={titles[form]}
          onClose={() => setForm("")}
          onSubmit={() => submitMovement(form)}
          busy={busy}
          submitLabel={t.save}
          cancelLabel={t.cancel}
          wide
        >
          <FormSelect
            label={t.items}
            value={val("item_id")}
            onChange={(v) => set("item_id", v)}
            options={bulkItems.map((x) => ({ id: x.id, name: x.name }))}
            placeholder={t.choose}
          />
          {["issue", "transfer"].includes(form) && (
            <FormSelect
              label={t.source_location}
              value={val("source_location_id")}
              onChange={(v) => set("source_location_id", v)}
              options={locations.map((x) => ({ id: x.id, name: x.name }))}
              placeholder={t.choose}
            />
          )}
          {["receipt", "transfer"].includes(form) && (
            <FormSelect
              label={t.destination_location}
              value={val("destination_location_id")}
              onChange={(v) => set("destination_location_id", v)}
              options={locations.map((x) => ({ id: x.id, name: x.name }))}
              placeholder={t.choose}
            />
          )}
          {form === "adjustment" && (
            <FormSelect
              label={t.location}
              value={val("location_id")}
              onChange={(v) => set("location_id", v)}
              options={locations.map((x) => ({ id: x.id, name: x.name }))}
              placeholder={t.choose}
            />
          )}
          <FormField
            label={form === "adjustment" ? t.counted_quantity : t.quantity}
            value={val(form === "adjustment" ? "counted_quantity" : "quantity")}
            onChange={(v) => set(form === "adjustment" ? "counted_quantity" : "quantity", v)}
            type="number"
          />
          {form === "adjustment" ? (
            <FormField label={t.reason} value={val("reason")} onChange={(v) => set("reason", v)} />
          ) : (
            <>
              <FormField
                label={t.reference}
                value={val("reference")}
                onChange={(v) => set("reference", v)}
                required={false}
              />
              <FormField
                label={t.note}
                value={val("note")}
                onChange={(v) => set("note", v)}
                required={false}
              />
            </>
          )}
        </Modal>
      )}
    </>
  );
}
