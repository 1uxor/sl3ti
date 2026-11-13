import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
      <div>
        {eyebrow && (
          <span className="text-[10px] font-extrabold tracking-widest text-muted uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-ink mt-1 mb-1 leading-tight">
          {title}
        </h1>
        <p className="text-sm text-muted m-0">{subtitle}</p>
      </div>
      {action && <div className="flex gap-2 flex-wrap">{action}</div>}
    </div>
  );
}
