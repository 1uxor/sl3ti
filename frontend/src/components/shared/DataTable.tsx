import type { ReactNode } from "react";

export function DataTable({
  heads,
  rows,
  emptyText = "Aucune donnée pour le moment.",
}: {
  heads: string[];
  rows: ReactNode[][];
  emptyText?: string;
}) {
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card overflow-auto">
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr>
            {heads.map((h) => (
              <th
                key={h}
                className="text-start text-[10px] tracking-wider uppercase text-muted font-extrabold px-5 py-3.5 bg-bg border-b border-line"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((cells, i) => (
              <tr key={i} className="hover:bg-bg/50 transition-colors">
                {cells.map((c, j) => (
                  <td
                    key={j}
                    className="px-5 py-4 border-b border-line text-xs text-muted last:[&:last-child]:border-b-0"
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={heads.length}
                className="text-center py-10 text-muted text-sm"
              >
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
