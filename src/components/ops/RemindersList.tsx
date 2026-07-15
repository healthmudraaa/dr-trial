"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { daysBetween } from "@/lib/status";
import type { Investigator, Patient, VisitDef } from "@/lib/types";

// FR-40 prototype: trigger + monitor SMS/voice reminder campaigns for due/overdue
// follow-ups (FR-26 SMS, FR-27 voice escalation on no response). Generic across
// studies — a "due/overdue visit" is any visit whose VisitRecord.status says so,
// whichever visit in the study schedule that happens to be.

type CampaignState = "not_started" | "sms_sent" | "voice_escalated";

export function RemindersList({
  visits,
  patients,
  investigators,
  today,
}: {
  visits: VisitDef[]; // not the whole StudyDefinition — its `classify` fn can't cross to a Client Component
  patients: Patient[];
  investigators: Investigator[];
  today: string;
}) {
  const candidates = patients.flatMap((p) =>
    visits
      .filter((v) => {
        const status = p.visitRecords[v.id]?.status;
        return status === "due" || status === "overdue";
      })
      .map((v) => ({ patient: p, visit: v }))
  );

  const [states, setStates] = useState<Record<string, CampaignState>>({});
  const investigatorName = (id: string) => investigators.find((i) => i.id === id)?.name ?? id;

  function trigger(key: string) {
    setStates((prev) => ({ ...prev, [key]: "sms_sent" }));
    setTimeout(() => {
      setStates((prev) => (prev[key] === "sms_sent" ? { ...prev, [key]: "voice_escalated" } : prev));
    }, 1800);
  }

  return (
    <Card>
      <CardHeader title="Reminder campaigns" subtitle={`${candidates.length} visits due or overdue for follow-up`} />
      <CardBody className="space-y-2">
        {candidates.map(({ patient, visit }) => {
          const key = `${patient.id}-${visit.id}`;
          const state = states[key] ?? "not_started";
          const record = patient.visitRecords[visit.id];
          const gap = record?.scheduledFor ? daysBetween(record.scheduledFor, today) : null;
          return (
            <div
              key={key}
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
                {state === "not_started" && (
                  <Button variant="secondary" onClick={() => trigger(key)}>
                    Trigger SMS
                  </Button>
                )}
                {state === "sms_sent" && <StatusChip tone="info">SMS sent · awaiting response</StatusChip>}
                {state === "voice_escalated" && <StatusChip tone="warn">No response — voice call placed</StatusChip>}
              </div>
            </div>
          );
        })}
        {candidates.length === 0 && <p className="text-sm text-slate-400">No due or overdue follow-ups.</p>}
      </CardBody>
    </Card>
  );
}
