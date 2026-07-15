"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import type { DataQuery, Investigator, VisitDef } from "@/lib/types";

// FR-41: route data queries to investigators and track resolution. This prototype
// tracks resolution locally — a real build persists status via the shared
// status/inbox services (plan §3), same source the Investigator's own
// "Needs attention" list reads from.
export function DataQueriesList({
  queries,
  investigators,
  visits,
}: {
  queries: DataQuery[];
  investigators: Investigator[];
  visits: VisitDef[];
}) {
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const investigatorName = (id: string) => investigators.find((i) => i.id === id)?.name ?? id;
  const visitLabel = (id: string) => visits.find((v) => v.id === id)?.label ?? id;

  return (
    <Card>
      <CardHeader title="Data queries" subtitle={`${queries.length} queries routed to investigators`} />
      <CardBody className="space-y-2">
        {queries.map((q) => {
          const isResolved = resolved[q.id] ?? false;
          return (
            <div
              key={q.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{q.id}</span>
                  <StatusChip tone="info">{q.category}</StatusChip>
                  {isResolved ? <StatusChip tone="good">Resolved</StatusChip> : <StatusChip tone="warn">Open</StatusChip>}
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-100">{q.detail}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {q.patientId} · {visitLabel(q.visitId)} · routed to {investigatorName(q.investigatorId)}
                </p>
              </div>
              {!isResolved && (
                <Button variant="secondary" onClick={() => setResolved((prev) => ({ ...prev, [q.id]: true }))}>
                  Mark resolved
                </Button>
              )}
            </div>
          );
        })}
        {queries.length === 0 && <p className="text-sm text-slate-400">No data queries for this study.</p>}
      </CardBody>
    </Card>
  );
}
