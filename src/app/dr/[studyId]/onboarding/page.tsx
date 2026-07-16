"use client";

// Investigator onboarding (FR-02/03/04/05): profile, study explainer, and
// one-time e-signature of study documents. Signing all required documents is
// what unblocks payouts — visible immediately in the dashboard and Ops ledger.

import { use, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { getStudy } from "@/lib/studies";
import { signDocument, useDb } from "@/lib/store";
import { getSession } from "@/lib/session";
import { ONBOARDING_DOCS } from "@/lib/types";

export default function OnboardingPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const session = typeof window !== "undefined" ? getSession("dr", studyId) : null;
  const investigator = useMemo(
    () => db.investigators.find((i) => i.id === session?.userId) ?? db.investigators.find((i) => i.studyId === studyId),
    [db.investigators, session?.userId, studyId]
  );
  if (!study || !investigator) return null;

  const signed = db.docsSigned[investigator.id] ?? [];
  const allSigned = ONBOARDING_DOCS.filter((d) => d.required).every((d) => signed.includes(d.id));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Study onboarding</h2>
        {allSigned ? (
          <StatusChip tone="good">Onboarding complete — payouts enabled</StatusChip>
        ) : (
          <StatusChip tone="warn">Incomplete — payouts blocked (FR-05)</StatusChip>
        )}
      </div>

      <Card>
        <CardHeader title="Your profile" subtitle="Verified at invitation (FR-02)" />
        <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Field label="Name" value={investigator.name} />
          <Field label="Qualification" value={investigator.qualification} />
          <Field label="Site" value={`${investigator.siteCode} · ${investigator.city}`} />
          <Field label="Mobile" value={investigator.mobile} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Study explainer"
          subtitle="Watch once before enrolling your first patient (FR-03)"
        />
        <CardBody className="space-y-3">
          <div className="flex aspect-video items-center justify-center rounded-lg bg-slate-900 text-white">
            <div className="text-center">
              <p className="text-3xl">▶</p>
              <p className="mt-1 text-sm text-slate-300">{study.name} — protocol walkthrough (4:32)</p>
            </div>
          </div>
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3 dark:text-slate-300">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{study.visits.length} visits per patient</p>
              {study.visits.map((v) => v.label).join(" → ")}
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="font-semibold text-slate-800 dark:text-slate-100">What you capture</p>
              Prescription photo per visit — AI digitises, you verify.
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Honorarium</p>
              {study.currencySymbol}
              {(db.settings[studyId]?.ratePerCompletedPatient ?? study.ratePerCompletedPatient).toLocaleString(study.locale)}{" "}
              per completed, QC-approved patient.
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Study documents — e-signature"
          subtitle="Signed once; every signature is timestamped in the audit trail (FR-04)"
        />
        <CardBody className="space-y-2">
          {ONBOARDING_DOCS.map((doc) => {
            const isSigned = signed.includes(doc.id);
            return (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{doc.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {doc.required ? "Required" : "Optional"} · PDF · e-sign
                  </p>
                </div>
                {isSigned ? (
                  <StatusChip tone="good">Signed</StatusChip>
                ) : (
                  <Button onClick={() => signDocument(studyId, investigator.id, doc.id)}>Review & e-sign</Button>
                )}
              </div>
            );
          })}
          {!allSigned && (
            <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">
              Your honoraria accrue as you complete patients but stay blocked until every required document is
              signed (FR-05/FR-54). The Ops team sees the same status.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}
