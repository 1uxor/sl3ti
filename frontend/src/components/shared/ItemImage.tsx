import { Package } from "lucide-react";

export function ItemImage({
  url,
  size = 40,
}: {
  url: string | null;
  size?: number;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="rounded-lg object-cover border border-line flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-lg bg-pale text-green flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <Package size={size * 0.5} />
    </div>
  );
}
