"use client";

// QC department queue — decisions persist: approving flips the record to
// approved (and the patient toward payable); raising a query creates a real
// DataQuery the doctor must answer, and the record returns here once resolved.

import { use, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { getStudy } from "@/lib/studies";
import { qcApprove, qcRaiseQuery, useDb } from "@/lib/store";

export default function QcReviewPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftOpen, setDraftOpen] = useState<Record<string, boolean>>({});

  const items = useMemo(() => {
    if (!study) return [];
    return db.patients
      .filter((p) => p.studyId === studyId)
      .flatMap((p) =>
        study.visits
          .filter((v) => {
            const record = p.visitRecords[v.id];
            return record?.locked && record.qcStatus === "pending_qc";
          })
          .map((v) => ({
            patient: p,
            visit: v,
            record: p.visitRecords[v.id],
            investigatorName: db.investigators.find((i) => i.id === p.investigatorId)?.name ?? p.investigatorId,
          }))
      );
  }, [db.patients, db.investigators, study, studyId]);

  if (!study) return null;

  return (
    <Card>
      <CardHeader
        title="QC review queue"
        subtitle={`${items.length} submission${items.length === 1 ? "" : "s"} awaiting review — approval releases the record toward payment`}
      />
      <CardBody className="space-y-3">
        {items.map(({ patient, visit, record, investigatorName }) => {
          const k = `${patient.id}-${visit.id}`;
          return (
            <div key={k} className="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {patient.id} · {visit.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {investigatorName} · submitted {record.capturedAt?.slice(0, 10) ?? "—"}
                    {!patient.consent.captured && " · ⚠ consent photo missing"}
                  </p>
                </div>
                <StatusChip tone="warn">Awaiting QC</StatusChip>
              </div>

              <div className="mb-3 flex flex-wrap items-start gap-4">
                <div className="flex h-28 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-center text-[10px] text-slate-400 dark:border-slate-700">
                  Rx photo
                  <br />
                  (on file)
                </div>
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {visit.sections
                    .flatMap((s) => s.fields)
                    .map((f) => (
                      <div key={f.id}>
                        <p className="text-xs text-slate-400">{f.label}</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          {f.type === "boolean"
                            ? record.data[f.id]
                              ? "Yes"
                              : "No"
                            : `${record.data[f.id] ?? "—"}${f.unit && record.data[f.id] !== undefined ? ` ${f.unit}` : ""}`}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => qcApprove(studyId, patient.id, visit.id)}>
                    Approve — release for payment
                  </Button>
                  <Button variant="secondary" onClick={() => setDraftOpen((prev) => ({ ...prev, [k]: !prev[k] }))}>
                    Raise data query
                  </Button>
                </div>
                {draftOpen[k] && (
                  <div className="flex flex-wrap items-end gap-2">
                    <textarea
                      className="min-h-16 w-full max-w-lg rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Describe what the investigator needs to clarify or correct…"
                      value={drafts[k] ?? ""}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [k]: e.target.value }))}
                    />
                    <Button
                      disabled={!(drafts[k] ?? "").trim()}
                      onClick={() => {
                        qcRaiseQuery(studyId, patient.id, visit.id, drafts[k].trim());
                        setDraftOpen((prev) => ({ ...prev, [k]: false }));
                      }}
                    >
                      Send query
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className="text-sm text-slate-400">No submissions awaiting QC. 🎉</p>}
      </CardBody>
    </Card>
  );
}
