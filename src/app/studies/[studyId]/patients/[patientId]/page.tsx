import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip, paymentStatusChip } from "@/components/ui/StatusChip";
import { CaptureFlow } from "@/components/investigator/CaptureFlow";
import { getStudyBundle } from "@/lib/studies";
import { getPaymentStatus } from "@/lib/status";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ studyId: string; patientId: string }>;
}) {
  const { studyId, patientId } = await params;
  const bundle = getStudyBundle(studyId);
  if (!bundle) notFound();
  const { study, investigators, patients } = bundle;
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) notFound();
  const investigator = investigators.find((i) => i.id === patient.investigatorId) ?? investigators[0];

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
        </CardBody>
      </Card>

      {study.visits.map((visit) => {
        const record = patient.visitRecords[visit.id];
        if (record?.locked) {
          return (
            <Card key={visit.id}>
              <CardHeader title={visit.label} subtitle={`Captured ${record.capturedAt?.slice(0, 10)} · locked`} />
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
          <CaptureFlow key={visit.id} patientId={patient.id} visit={visit} initialData={record?.data} />
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
