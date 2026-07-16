"use client";

// Support centre (FR-35): raise and track tickets with the study Ops team.
// Distinct from data queries (FR-41) — those live on the patient record.

import { use, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { getStudy } from "@/lib/studies";
import { raiseTicket, useDb } from "@/lib/store";
import { getSession } from "@/lib/session";

export default function SupportPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const session = typeof window !== "undefined" ? getSession("dr", studyId) : null;
  const investigatorId = session?.userId ?? db.investigators.find((i) => i.studyId === studyId)?.id;
  const [subject, setSubject] = useState("");
  const [sent, setSent] = useState(false);

  const myTickets = useMemo(
    () => db.tickets.filter((t) => t.studyId === studyId && t.investigatorId === investigatorId),
    [db.tickets, studyId, investigatorId]
  );
  if (!study || !investigatorId) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Support</h2>

      <Card>
        <CardHeader title="Raise a ticket" subtitle="The study Ops team responds within one working day" />
        <CardBody className="space-y-3">
          <textarea
            className="min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            placeholder="Describe the issue — e.g. app problem, patient allocation, payment question…"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setSent(false);
            }}
          />
          <div className="flex items-center gap-3">
            <Button
              disabled={!subject.trim()}
              onClick={() => {
                raiseTicket(studyId, investigatorId, subject.trim());
                setSubject("");
                setSent(true);
              }}
            >
              Submit ticket
            </Button>
            {sent && <StatusChip tone="good">Ticket sent to Ops</StatusChip>}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Your tickets" />
        <CardBody className="space-y-2">
          {myTickets.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
            >
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t.subject}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.id} · {t.createdAt.slice(0, 10)}
                </p>
              </div>
              {t.status === "open" ? <StatusChip tone="warn">Open</StatusChip> : <StatusChip tone="good">Resolved</StatusChip>}
            </div>
          ))}
          {myTickets.length === 0 && <p className="text-sm text-slate-400">No tickets yet.</p>}
        </CardBody>
      </Card>
    </div>
  );
}
