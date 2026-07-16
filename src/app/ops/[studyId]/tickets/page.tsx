"use client";

import { use, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { resolveTicket, useDb } from "@/lib/store";

export default function TicketsPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const db = useDb();
  const tickets = useMemo(() => db.tickets.filter((t) => t.studyId === studyId), [db.tickets, studyId]);
  const investigatorName = (id: string) => db.investigators.find((i) => i.id === id)?.name ?? id;

  return (
    <Card>
      <CardHeader
        title="Support tickets"
        subtitle={`${tickets.filter((t) => t.status === "open").length} open · raised by investigators (FR-35)`}
      />
      <CardBody className="space-y-2">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
          >
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t.subject}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.id} · {investigatorName(t.investigatorId)}
                {t.patientId && ` · ${t.patientId}`} · {t.createdAt.slice(0, 10)}
              </p>
            </div>
            {t.status === "open" ? (
              <Button variant="secondary" onClick={() => resolveTicket(studyId, t.id)}>
                Mark resolved
              </Button>
            ) : (
              <StatusChip tone="good">Resolved</StatusChip>
            )}
          </div>
        ))}
        {tickets.length === 0 && <p className="text-sm text-slate-400">No tickets.</p>}
      </CardBody>
    </Card>
  );
}
