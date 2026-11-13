"use client";
import { useState, useRef, useCallback } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { uploadItemImage, deleteItemImage } from "@/lib/api";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export function ImageUpload({
  itemId,
  orgId,
  currentImageUrl,
  onUploaded,
  onDeleted,
  disabled = false,
  t,
}: {
  itemId: string;
  orgId: string;
  currentImageUrl: string | null;
  onUploaded: (url: string) => void;
  onDeleted: () => void;
  disabled?: boolean;
  t: Record<string, string>;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError("");
      if (!ACCEPTED.includes(file.type)) {
        setError(t.invalid_file_type);
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(t.file_too_large);
        return;
      }
      setUploading(true);
      try {
        const result = await uploadItemImage(itemId, file, orgId);
        onUploaded(result.image_url);
      } catch (e) {
        setError(e instanceof Error ? e.message : t.upload_error);
      } finally {
        setUploading(false);
      }
    },
    [itemId, orgId, onUploaded, t]
  );

  const handleDelete = async () => {
    setUploading(true);
    try {
      await deleteItemImage(itemId, orgId);
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.upload_error);
    } finally {
      setUploading(false);
    }
  };

  if (disabled) {
    return (
      <div className="mt-4 border-2 border-dashed border-line rounded-xl p-6 text-center text-muted text-xs opacity-50">
        <Camera size={24} className="mx-auto mb-2 opacity-40" />
        <p>{t.image_after_save}</p>
      </div>
    );
  }

  if (currentImageUrl) {
    return (
      <div className="mt-4 relative group">
        <img
          src={currentImageUrl}
          alt=""
          className="w-full h-48 object-cover rounded-xl border border-line"
        />
        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="bg-white text-ink rounded-lg px-3 py-2 text-xs font-bold hover:bg-gray-100"
          >
            {t.upload_image}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading}
            className="bg-red-500 text-white rounded-lg px-3 py-2 text-xs font-bold hover:bg-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/50 rounded-xl flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-green" />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-green bg-pale"
            : "border-line hover:border-green/50 hover:bg-pale/50"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        {uploading ? (
          <Loader2 size={28} className="mx-auto animate-spin text-green" />
        ) : (
          <>
            <Camera size={28} className="mx-auto mb-2 text-muted" />
            <p className="text-xs text-muted">{t.drag_or_click}</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
