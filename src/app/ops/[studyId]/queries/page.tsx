"use client";

// FR-41 query lifecycle: open (doctor must respond) → answered (doctor replied,
// QC/DM closes) → resolved (record returns to QC review).

import { use, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { getStudy } from "@/lib/studies";
import { closeQuery, useDb } from "@/lib/store";

export default function DataQueriesPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const queries = useMemo(() => db.queries.filter((q) => q.studyId === studyId), [db.queries, studyId]);
  if (!study) return null;

  const visitLabel = (id: string) => study.visits.find((v) => v.id === id)?.label ?? id;
  const investigatorName = (id: string) => db.investigators.find((i) => i.id === id)?.name ?? id;

  return (
    <Card>
      <CardHeader
        title="Data queries"
        subtitle={`${queries.filter((q) => q.status !== "resolved").length} active · ${queries.length} total`}
      />
      <CardBody className="space-y-2">
        {queries.map((q) => (
          <div
            key={q.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
          >
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{q.id}</span>
                <StatusChip tone="info">{q.category}</StatusChip>
                {q.status === "open" && <StatusChip tone="bad">Open — with investigator</StatusChip>}
                {q.status === "answered" && <StatusChip tone="warn">Answered — review response</StatusChip>}
                {q.status === "resolved" && <StatusChip tone="good">Resolved</StatusChip>}
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-100">{q.detail}</p>
              {q.doctorResponse && (
                <p className="mt-1 rounded bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  Investigator: {q.doctorResponse}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {q.patientId} · {visitLabel(q.visitId)} · {investigatorName(q.investigatorId)} ·{" "}
                {q.createdAt.slice(0, 10)}
              </p>
            </div>
            {q.status === "answered" && (
              <Button onClick={() => closeQuery(studyId, q.id)}>Accept & close — back to QC</Button>
            )}
          </div>
        ))}
        {queries.length === 0 && <p className="text-sm text-slate-400">No data queries for this study.</p>}
      </CardBody>
    </Card>
  );
}
