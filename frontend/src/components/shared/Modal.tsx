import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Modal({
  title,
  children,
  onSubmit,
  onClose,
  busy,
  submitLabel = "Enregistrer",
  cancelLabel = "Annuler",
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  onClose: () => void;
  busy: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  wide?: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-surface border border-line rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-auto animate-scale-in ${
          wide ? "w-full max-w-[580px]" : "w-full max-w-[480px]"
        }`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-ink m-0">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {children}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-muted hover:text-ink hover:bg-bg transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-green text-white hover:brightness-95 disabled:opacity-50 transition-all"
            >
              {busy ? "…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
