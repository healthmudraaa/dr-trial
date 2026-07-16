"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { getStudy } from "@/lib/studies";
import { useDb } from "@/lib/store";
import { buildOpsInbox, type InboxSource } from "@/lib/inbox";

const SOURCE_LABEL: Record<InboxSource, string> = {
  attention: "QC flag",
  ticket: "Support ticket",
  query: "Data query",
};

export default function ActionQueuePage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const inbox = useMemo(() => {
    if (!study) return [];
    return buildOpsInbox(
      study,
      db.patients.filter((p) => p.studyId === studyId),
      db.tickets.filter((t) => t.studyId === studyId),
      db.queries.filter((q) => q.studyId === studyId),
      db.investigators.filter((i) => i.studyId === studyId)
    );
  }, [db, study, studyId]);
  if (!study) return null;

  return (
    <Card>
      <CardHeader
        title="Action queue"
        subtitle={`${inbox.length} open items across QC flags, support tickets, and data queries`}
      />
      <CardBody className="space-y-2">
        {inbox.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
          >
            <div>
              <div className="mb-1 flex items-center gap-2">
                <StatusChip tone={item.severity === "high" ? "bad" : "warn"}>{SOURCE_LABEL[item.source]}</StatusChip>
                <span className="text-xs text-slate-400">{item.investigatorName}</span>
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.label}</p>
              {item.detail && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>}
            </div>
            {item.patientId && (
              <Link
                href={`/ops/${studyId}/roster/${item.investigatorId}`}
                className="shrink-0 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
              >
                {item.patientId} ›
              </Link>
            )}
          </div>
        ))}
        {inbox.length === 0 && <p className="text-sm text-slate-400">Queue is clear.</p>}
      </CardBody>
    </Card>
  );
}
