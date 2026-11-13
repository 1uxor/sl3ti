"use client";
import { useState } from "react";
import { Plus, Upload, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchToolbar } from "@/components/shared/SearchToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Modal } from "@/components/shared/Modal";
import { FormField, FormSelect } from "@/components/shared/FormField";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ItemImage } from "@/components/shared/ItemImage";
import { money } from "@/lib/formatting";
import { post, patch, del, uploadCsv, downloadCsv } from "@/lib/api";
import type { Item } from "@/lib/api";

export function Items({
  items,
  total,
  categories,
  org,
  orgName,
  t,
  done,
  failed,
}: {
  items: Item[];
  total: number;
  categories: { id: string; name: string }[];
  org: string;
  orgName: string;
  t: Record<string, string>;
  done: (m: string) => void;
  failed: (e: unknown) => void;
}) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<"" | "item" | "edit_item" | "category" | "upload_image">("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);

  const val = (k: string) => values[k] || "";
  const set = (k: string, v: string) => setValues((x) => ({ ...x, [k]: v }));

  const filtered = items.filter(
    (x) => (x.name + " " + x.sku).toLowerCase().includes(search.toLowerCase())
  );

  function editItem(x: Item) {
    setValues({
      id: x.id,
      name: x.name,
      sku: x.sku,
      category_id: x.category_id || "",
      description: x.description,
      purchase_price: String(x.purchase_price),
      sale_price: String(x.sale_price),
      low_stock_threshold: String(x.low_stock_threshold),
      image_url: x.image_url || "",
    });
    setForm("edit_item");
  }

  async function createItem() {
    setBusy(true);
    try {
      const result = await post<{ id: string }>(
        "/items",
        {
          name: val("name"),
          sku: val("sku"),
          category_id: val("category_id") || null,
          tracking_mode: val("tracking_mode") || "BULK",
          purchase_price: val("purchase_price") || 0,
          sale_price: val("sale_price") || 0,
          low_stock_threshold: val("low_stock_threshold") || 0,
        },
        org
      );
      setCreatedItemId(result.id);
      setForm("upload_image");
      done(t.operation_saved);
    } catch (e) {
      failed(e);
    } finally {
      setBusy(false);
    }
  }

  async function saveItem() {
    setBusy(true);
    try {
      await patch(
        "/items/" + val("id"),
        {
          name: val("name"),
          sku: val("sku"),
          category_id: val("category_id") || null,
          description: val("description"),
          purchase_price: val("purchase_price"),
          sale_price: val("sale_price"),
          low_stock_threshold: val("low_stock_threshold"),
        },
        org
      );
      setForm("");
      done(t.item_modified);
    } catch (e) {
      failed(e);
    } finally {
      setBusy(false);
    }
  }

  async function archiveItem(x: Item) {
    if (!window.confirm(t.confirm_archive)) return;
    try {
      await patch("/items/" + x.id, { is_active: false }, org);
      done(t.item_archived);
    } catch (e) {
      failed(e);
    }
  }

  async function deleteItem(x: Item) {
    if (!window.confirm(t.confirm_delete)) return;
    try {
      await del("/items/" + x.id, org);
      done(t.item_deleted);
    } catch (e) {
      failed(e);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={orgName.toUpperCase()}
        title={t.items}
        subtitle={t.items}
        action={
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setValues({}); setForm("item"); }}
              className="inline-flex items-center gap-2 bg-green text-white rounded-lg px-4 py-2.5 text-xs font-bold hover:brightness-95"
            >
              <Plus size={16} /> {t.new_item}
            </button>
            <button
              onClick={() => { setValues({}); setForm("category"); }}
              className="inline-flex items-center gap-2 border border-line bg-surface text-ink rounded-lg px-4 py-2.5 text-xs font-bold hover:bg-bg"
            >
              {t.category}
            </button>
            <label className="inline-flex items-center gap-2 border border-line bg-surface text-ink rounded-lg px-4 py-2.5 text-xs font-bold hover:bg-bg cursor-pointer">
              <Upload size={14} /> {t.import_csv}
              <input
                hidden
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f)
                    uploadCsv(f, org)
                      .then(() => done(t.operation_saved))
                      .catch(failed);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              onClick={() => downloadCsv("/items.csv", org, "items.csv").catch(failed)}
              className="inline-flex items-center gap-2 border border-line bg-surface text-ink rounded-lg px-4 py-2.5 text-xs font-bold hover:bg-bg"
            >
              <Download size={14} /> {t.export_csv}
            </button>
          </div>
        }
      />

      <SearchToolbar
        value={search}
        onChange={setSearch}
        placeholder={t.search_items}
        count={total}
        countLabel={t.item_count}
      />

      <DataTable
        heads={["", t.items, t.sku, t.tracking_mode, t.purchase_price, "Status", "Actions"]}
        rows={filtered.map((x) => [
          <ItemImage key={x.id} url={x.image_url} size={36} />,
          <strong key={x.id} className="text-ink">{x.name}</strong>,
          x.sku,
          <Badge key={x.id + "b"} value={x.tracking_mode} />,
          money(x.purchase_price),
          x.is_active ? t.active : t.archived,
          <div key={x.id + "a"} className="flex gap-1.5">
            <button
              onClick={() => editItem(x)}
              className="text-green text-[11px] font-bold bg-transparent border-0 cursor-pointer hover:underline"
            >
              {t.edit}
            </button>
            {x.is_active && (
              <button
                onClick={() => archiveItem(x)}
                className="text-muted text-[11px] font-bold bg-transparent border-0 cursor-pointer hover:underline"
              >
                {t.archive}
              </button>
            )}
            {!x.is_active && (
              <button
                onClick={() => deleteItem(x)}
                className="text-red-500 text-[11px] font-bold bg-transparent border-0 cursor-pointer hover:underline"
              >
                {t.delete}
              </button>
            )}
          </div>,
        ])}
        emptyText={t.no_data}
      />

      {/* Create item modal */}
      {form === "item" && (
        <Modal
          title={t.new_item}
          onClose={() => setForm("")}
          onSubmit={createItem}
          busy={busy}
          submitLabel={t.save}
          cancelLabel={t.cancel}
        >
          <FormField label={t.name} value={val("name")} onChange={(v) => set("name", v)} />
          <FormField label={t.sku} value={val("sku")} onChange={(v) => set("sku", v)} />
          <FormSelect
            label={t.category}
            value={val("category_id")}
            onChange={(v) => set("category_id", v)}
            options={categories}
            placeholder={t.no_category}
            required={false}
          />
          <FormSelect
            label={t.tracking_mode}
            value={val("tracking_mode") || "BULK"}
            onChange={(v) => set("tracking_mode", v)}
            options={[
              { id: "BULK", name: t.bulk },
              { id: "SERIALIZED", name: t.serialized },
            ]}
          />
          <FormField
            label={t.purchase_price}
            value={val("purchase_price")}
            onChange={(v) => set("purchase_price", v)}
            type="number"
            required={false}
          />
          <FormField
            label={t.sale_price}
            value={val("sale_price")}
            onChange={(v) => set("sale_price", v)}
            type="number"
            required={false}
          />
          <FormField
            label={t.low_stock_threshold}
            value={val("low_stock_threshold")}
            onChange={(v) => set("low_stock_threshold", v)}
            type="number"
            required={false}
          />
          <ImageUpload
            itemId=""
            orgId={org}
            currentImageUrl={null}
            onUploaded={() => {}}
            onDeleted={() => {}}
            disabled
            t={t}
          />
        </Modal>
      )}

      {/* Upload image after create */}
      {form === "upload_image" && createdItemId && (
        <Modal
          title={t.add_image}
          onClose={() => { setForm(""); setCreatedItemId(null); }}
          onSubmit={() => { setForm(""); setCreatedItemId(null); }}
          busy={false}
          submitLabel="OK"
          cancelLabel={t.cancel}
        >
          <p className="text-sm text-muted mb-2">{t.upload_image}</p>
          <ImageUpload
            itemId={createdItemId}
            orgId={org}
            currentImageUrl={null}
            onUploaded={(url) => {
              done(t.upload_success);
              set("image_url", url);
            }}
            onDeleted={() => {}}
            t={t}
          />
        </Modal>
      )}

      {/* Edit item modal */}
      {form === "edit_item" && (
        <Modal
          title={t.edit_item}
          onClose={() => setForm("")}
          onSubmit={saveItem}
          busy={busy}
          submitLabel={t.save}
          cancelLabel={t.cancel}
        >
          <ImageUpload
            itemId={val("id")}
            orgId={org}
            currentImageUrl={val("image_url") || null}
            onUploaded={(url) => {
              set("image_url", url);
              done(t.upload_success);
            }}
            onDeleted={() => {
              set("image_url", "");
              done(t.operation_saved);
            }}
            t={t}
          />
          <FormField label={t.name} value={val("name")} onChange={(v) => set("name", v)} />
          <FormField label={t.sku} value={val("sku")} onChange={(v) => set("sku", v)} />
          <FormSelect
            label={t.category}
            value={val("category_id")}
            onChange={(v) => set("category_id", v)}
            options={categories}
            placeholder={t.no_category}
            required={false}
          />
          <FormField
            label={t.description}
            value={val("description")}
            onChange={(v) => set("description", v)}
            required={false}
          />
          <FormField
            label={t.purchase_price}
            value={val("purchase_price")}
            onChange={(v) => set("purchase_price", v)}
            type="number"
          />
          <FormField
            label={t.sale_price}
            value={val("sale_price")}
            onChange={(v) => set("sale_price", v)}
            type="number"
          />
          <FormField
            label={t.low_stock_threshold}
            value={val("low_stock_threshold")}
            onChange={(v) => set("low_stock_threshold", v)}
            type="number"
          />
        </Modal>
      )}

      {/* Category modal */}
      {form === "category" && (
        <Modal
          title={t.category}
          onClose={() => setForm("")}
          onSubmit={async () => {
            setBusy(true);
            try {
              await post("/categories", { name: val("name") }, org);
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
          <FormField label={t.name} value={val("name")} onChange={(v) => set("name", v)} />
        </Modal>
      )}
    </>
  );
}
