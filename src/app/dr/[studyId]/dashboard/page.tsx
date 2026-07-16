"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { paymentStatusChip, StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { getStudy } from "@/lib/studies";
import { useDb } from "@/lib/store";
import { getSession } from "@/lib/session";
import { getAttentionItems, getPaymentStatus } from "@/lib/status";

export default function DashboardPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const session = typeof window !== "undefined" ? getSession("dr", studyId) : null;

  const investigator = useMemo(
    () => db.investigators.find((i) => i.id === session?.userId) ?? db.investigators.find((i) => i.studyId === studyId),
    [db.investigators, session?.userId, studyId]
  );
  const mine = useMemo(
    () => db.patients.filter((p) => p.studyId === studyId && p.investigatorId === investigator?.id),
    [db.patients, studyId, investigator?.id]
  );

  if (!study || !investigator) return null;

  const visitCounts = study.visits.map((v) => ({
    visit: v,
    count: mine.filter((p) => p.visitRecords[v.id]?.locked).length,
  }));

  const attentionByPatient = mine
    .map((p) => ({ patient: p, items: getAttentionItems(p, study) }))
    .filter((x) => x.items.length > 0);

  const rate = db.settings[studyId]?.ratePerCompletedPatient ?? study.ratePerCompletedPatient;
  const paymentCounts = mine.reduce(
    (acc, p) => {
      acc[getPaymentStatus(p, investigator, study)] += 1;
      return acc;
    },
    { paid: 0, payable: 0, blocked_docs: 0, in_progress: 0 } as Record<string, number>
  );
  const earned = paymentCounts.paid * rate;
  const pendingAmount = paymentCounts.payable * rate;

  const currencyFmt = new Intl.NumberFormat(study.locale, {
    style: "currency",
    currency: db.settings[studyId]?.currency ?? study.currency,
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-6">
      {!investigator.documentsSigned && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
          <span>
            <span className="font-semibold">Onboarding incomplete</span> — payouts stay blocked until all study
            documents are e-signed (FR-05).
          </span>
          <Link href={`/dr/${studyId}/onboarding`}>
            <Button>Complete onboarding</Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Enrolment</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {mine.length}
              <span className="text-base font-normal text-slate-400"> / {investigator.patientCap}</span>
            </p>
            <ProgressBar value={mine.length} max={investigator.patientCap} className="mt-3" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Visits captured</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {visitCounts.map(({ visit, count }, i) => (
                <span key={visit.id}>
                  {i > 0 && <span className="mx-1 text-slate-300">·</span>}
                  {count} <span className="font-normal text-slate-400">{visit.label.replace(/^Visit \d+ — /, "")}</span>
                </span>
              ))}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Honorarium</p>
            <p className="mt-1 text-2xl font-semibold text-teal-700 dark:text-teal-400">{currencyFmt.format(earned)}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              paid · {currencyFmt.format(pendingAmount)} approved &amp; awaiting release
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/dr/${studyId}/patients/new`}>
          <Button>+ Register new patient</Button>
        </Link>
        <Link href={`/dr/${studyId}/patients`}>
          <Button variant="secondary">View all patients</Button>
        </Link>
      </div>

      <Card>
        <CardHeader title="Needs attention" subtitle="Consent, overdue visits, QC queries, and open data queries" />
        <CardBody className="space-y-2">
          {attentionByPatient.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Nothing needs attention right now.</p>
          )}
          {attentionByPatient.map(({ patient, items }) => (
            <Link
              key={patient.id}
              href={`/dr/${studyId}/patients/${patient.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{patient.id}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{items.map((i) => i.label).join(" · ")}</p>
              </div>
              <span className="text-slate-300">›</span>
            </Link>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Your patients" subtitle="Per-patient study status" />
        <CardBody className="space-y-2">
          {mine.map((p) => {
            const classification = study.classify?.(
              Object.fromEntries(Object.entries(p.visitRecords).map(([id, r]) => [id, r.data]))
            );
            return (
              <Link
                key={p.id}
                href={`/dr/${studyId}/patients/${p.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.id}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {p.age}
                    {p.sex} · {p.city}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {classification && <StatusChip tone="info">{classification.label}</StatusChip>}
                  {paymentStatusChip(getPaymentStatus(p, investigator, study))}
                </div>
              </Link>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
