"use client";

// Compliance view: every action taken on the platform, who took it, and when
// (FR-24 audit artifacts). Populated live by the store's mutation layer.

import { use, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { useDb } from "@/lib/store";

const ACTOR_TONE: Record<string, "info" | "warn" | "good" | "pending"> = {
  investigator: "info",
  qc: "warn",
  cro: "good",
  ops: "pending",
  admin: "pending",
};

export default function AuditPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const db = useDb();
  const events = useMemo(() => db.audit.filter((e) => e.studyId === studyId), [db.audit, studyId]);

  return (
    <Card>
      <CardHeader
        title="Audit trail"
        subtitle="Immutable, timestamped log of every platform action — exportable for inspection"
      />
      <CardBody className="space-y-1.5">
        {events.map((e, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
          >
            <span className="flex items-center gap-2">
              <StatusChip tone={ACTOR_TONE[e.actor] ?? "pending"}>{e.actor}</StatusChip>
              <span className="text-slate-700 dark:text-slate-200">{e.action}</span>
            </span>
            <span className="font-mono text-xs text-slate-400">{e.at.replace("T", " ").slice(0, 19)}</span>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-sm text-slate-400">
            No events yet in this session — actions taken anywhere on the platform appear here instantly.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
