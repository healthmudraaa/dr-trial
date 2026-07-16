"use client";

// FR-26/27/40: trigger SMS with automatic voice escalation on no response.
// Campaign events persist to the store's reminder log.

import { use, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { getStudy } from "@/lib/studies";
import { recordReminder, useDb } from "@/lib/store";
import { daysBetween } from "@/lib/status";

const TODAY = "2026-07-16";

export default function RemindersPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();

  const candidates = useMemo(() => {
    if (!study) return [];
    return db.patients
      .filter((p) => p.studyId === studyId)
      .flatMap((p) =>
        study.visits
          .filter((v) => {
            const status = p.visitRecords[v.id]?.status;
            return status === "due" || status === "overdue";
          })
          .map((v) => ({ patient: p, visit: v }))
      );
  }, [db.patients, study, studyId]);

  if (!study) return null;
  const investigatorName = (id: string) => db.investigators.find((i) => i.id === id)?.name ?? id;
  const lastEvent = (patientId: string, visitId: string) =>
    db.reminders.find((r) => r.studyId === studyId && r.patientId === patientId && r.visitId === visitId);

  return (
    <Card>
      <CardHeader
        title="Reminder campaigns"
        subtitle={`${candidates.length} visits due or overdue · SMS first, automated voice call if no response (FR-26/27)`}
      />
      <CardBody className="space-y-2">
        {candidates.map(({ patient, visit }) => {
          const record = patient.visitRecords[visit.id];
          const gap = record?.scheduledFor ? daysBetween(record.scheduledFor, TODAY) : null;
          const event = lastEvent(patient.id, visit.id);
          return (
            <div
              key={`${patient.id}-${visit.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {patient.id} · {visit.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {investigatorName(patient.investigatorId)} ·{" "}
                  {gap === null ? "no schedule yet" : gap > 0 ? `${gap} days overdue` : `due in ${Math.abs(gap)} days`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!event && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      recordReminder(studyId, patient.id, visit.id, "sms_sent");
                      setTimeout(() => recordReminder(studyId, patient.id, visit.id, "voice_escalated"), 2500);
                    }}
                  >
                    Trigger SMS
                  </Button>
                )}
                {event?.state === "sms_sent" && <StatusChip tone="info">SMS sent · awaiting response</StatusChip>}
                {event?.state === "voice_escalated" && (
                  <StatusChip tone="warn">No response — voice call placed</StatusChip>
                )}
                {event?.state === "responded" && <StatusChip tone="good">Patient responded</StatusChip>}
              </div>
            </div>
          );
        })}
        {candidates.length === 0 && <p className="text-sm text-slate-400">No due or overdue follow-ups.</p>}
      </CardBody>
    </Card>
  );
}
