import { X } from "lucide-react";

export function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  if (!message) return null;
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-4 text-sm font-medium ${
        type === "success"
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
    </div>
  );
}
