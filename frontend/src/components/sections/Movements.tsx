"use client";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/Badge";
import { date } from "@/lib/formatting";
import type { Location, Movement } from "@/lib/api";

export function Movements({
  movements,
  locations,
  orgName,
  t,
}: {
  movements: Movement[];
  locations: Location[];
  orgName: string;
  t: Record<string, string>;
}) {
  return (
    <>
      <PageHeader
        eyebrow={orgName.toUpperCase()}
        title={t.movements}
        subtitle={t.movements}
      />
      <DataTable
        heads={[t.items, "Type", t.quantity, t.source_location, t.destination_location, t.reference, "Date"]}
        rows={movements.map((x) => [
          x.item_name,
          <Badge key={x.id} value={x.movement_type} />,
          x.quantity,
          locations.find((p) => p.id === x.source_location_id)?.name || "—",
          locations.find((p) => p.id === x.destination_location_id)?.name || "—",
          x.reference || "—",
          date(x.created_at),
        ])}
        emptyText={t.no_data}
      />
    </>
  );
}
