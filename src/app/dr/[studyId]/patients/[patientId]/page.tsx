"use client";

import { use, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip, paymentStatusChip, qcStatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { RxCaptureWizard } from "@/components/investigator/RxCaptureWizard";
import { getStudy } from "@/lib/studies";
import { answerQuery, submitVisit, useDb } from "@/lib/store";
import { getPaymentStatus } from "@/lib/status";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ studyId: string; patientId: string }>;
}) {
  const { studyId, patientId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const [responses, setResponses] = useState<Record<string, string>>({});

  const patient = useMemo(
    () => db.patients.find((p) => p.id === patientId && p.studyId === studyId),
    [db.patients, patientId, studyId]
  );
  const investigator = useMemo(
    () => db.investigators.find((i) => i.id === patient?.investigatorId),
    [db.investigators, patient?.investigatorId]
  );
  const openQueries = useMemo(
    () => db.queries.filter((q) => q.patientId === patientId && q.studyId === studyId && q.status !== "resolved"),
    [db.queries, patientId, studyId]
  );

  if (!study || !patient || !investigator) {
    return <p className="text-sm text-slate-500">Patient not found.</p>;
  }

  const classification = study.classify?.(
    Object.fromEntries(Object.entries(patient.visitRecords).map(([id, r]) => [id, r.data]))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{patient.id}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {patient.age}
            {patient.sex} · {patient.city}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {classification && <StatusChip tone="info">{classification.label}</StatusChip>}
          {paymentStatusChip(getPaymentStatus(patient, investigator, study))}
        </div>
      </div>

      <Card>
        <CardHeader title="Demographics & consent" />
        <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Field label="Age / Sex" value={`${patient.age} · ${patient.sex === "M" ? "Male" : "Female"}`} />
          <Field label="Region" value={`${patient.city} · ${patient.region}`} />
          <Field
            label="Consent photo"
            value={patient.consent.captured ? "On file" : "Missing"}
            flag={!patient.consent.captured}
          />
          <Field label="Registered" value={patient.registeredAt?.slice(0, 10) ?? "—"} />
        </CardBody>
      </Card>

      {openQueries.length > 0 && (
        <Card>
          <CardHeader
            title="Queries on this patient"
            subtitle="Respond to QC/data-management queries — resolution sends the record back to QC"
          />
          <CardBody className="space-y-3">
            {openQueries.map((q) => (
              <div key={q.id} className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-900/50 dark:bg-rose-950/20">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">{q.id}</span>
                  <StatusChip tone="info">{q.category}</StatusChip>
                  {q.status === "answered" ? (
                    <StatusChip tone="warn">Answered — awaiting QC close</StatusChip>
                  ) : (
                    <StatusChip tone="bad">Open — needs your response</StatusChip>
                  )}
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-100">{q.detail}</p>
                {q.status === "open" && (
                  <div className="mt-2 flex flex-wrap items-end gap-2">
                    <textarea
                      className="min-h-14 w-full max-w-lg rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Your clarification / correction…"
                      value={responses[q.id] ?? ""}
                      onChange={(e) => setResponses((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    />
                    <Button
                      disabled={!(responses[q.id] ?? "").trim()}
                      onClick={() => answerQuery(studyId, q.id, responses[q.id])}
                    >
                      Send response
                    </Button>
                  </div>
                )}
                {q.doctorResponse && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Your response: {q.doctorResponse}</p>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {study.visits.map((visit) => {
        const record = patient.visitRecords[visit.id];
        if (record?.locked) {
          return (
            <Card key={visit.id}>
              <CardHeader
                title={visit.label}
                subtitle={`Captured ${record.capturedAt?.slice(0, 10)} · locked — edits need a data query`}
                action={record.qcStatus ? qcStatusChip(record.qcStatus) : undefined}
              />
              <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                {visit.sections
                  .flatMap((s) => s.fields)
                  .map((f) => (
                    <Field
                      key={f.id}
                      label={f.label}
                      value={
                        f.type === "boolean"
                          ? record.data[f.id]
                            ? "Yes"
                            : "No"
                          : `${record.data[f.id] ?? "—"}${f.unit && record.data[f.id] !== undefined ? ` ${f.unit}` : ""}`
                      }
                    />
                  ))}
              </CardBody>
            </Card>
          );
        }
        return (
          <RxCaptureWizard
            key={visit.id}
            patientId={patient.id}
            visit={visit}
            onSubmit={(data) => submitVisit(studyId, patient.id, visit.id, data)}
          />
        );
      })}
    </div>
  );
}

function Field({ label, value, flag }: { label: string; value: string; flag?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={flag ? "font-semibold text-rose-600 dark:text-rose-400" : "font-semibold text-slate-800 dark:text-slate-100"}>
        {value}
      </p>
    </div>
  );
}
