export function Spinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 min-h-[60vh] text-muted text-sm">
      <div className="w-5 h-5 border-2 border-line border-t-green rounded-full animate-spin" />
      {text && <span>{text}</span>}
    </div>
  );
}
