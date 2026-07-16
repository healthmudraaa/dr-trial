"use client";

// FR-51: what the client pays — honoraria (accrued/released), platform fee
// context, per-investigator lines. Read-only for the client role.

import { use, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { getStudy } from "@/lib/studies";
import { useDb } from "@/lib/store";

export default function ClientSpendPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();

  const data = useMemo(() => {
    if (!study) return null;
    const rate = db.settings[studyId]?.ratePerCompletedPatient ?? study.ratePerCompletedPatient;
    const patients = db.patients.filter((p) => p.studyId === studyId);
    const completed = patients.filter((p) => study.visits.every((v) => p.visitRecords[v.id]?.locked));
    const released = patients.filter((p) => p.paymentReleasedAt).length;
    const perInvestigator = db.investigators
      .filter((i) => i.studyId === studyId)
      .map((inv) => {
        const mine = patients.filter((p) => p.investigatorId === inv.id);
        const done = mine.filter((p) => study.visits.every((v) => p.visitRecords[v.id]?.locked)).length;
        return { inv, done, accrued: done * rate };
      });
    return { rate, patients, completed, released, perInvestigator };
  }, [db, study, studyId]);

  if (!study || !data) return null;
  const currencyFmt = new Intl.NumberFormat(study.locale, {
    style: "currency",
    currency: db.settings[studyId]?.currency ?? study.currency,
    maximumFractionDigits: 0,
  });

  const accruedTotal = data.completed.length * data.rate;
  const releasedTotal = data.released * data.rate;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Honoraria accrued" value={currencyFmt.format(accruedTotal)} sub={`${data.completed.length} completed patients × ${currencyFmt.format(data.rate)}`} />
        <Tile label="Released to investigators" value={currencyFmt.format(releasedTotal)} sub={`${data.released} patients paid out`} />
        <Tile label="Accrued, not yet released" value={currencyFmt.format(accruedTotal - releasedTotal)} sub="pending QC / release" />
      </div>

      <Card>
        <CardHeader title="Spend by investigator" subtitle="Honoraria accrue only on fully completed, QC-visible patients" />
        <CardBody className="space-y-2">
          {data.perInvestigator.map(({ inv, done, accrued }) => (
            <div
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-4 py-2.5 text-sm dark:border-slate-800"
            >
              <span className="text-slate-700 dark:text-slate-200">
                {inv.name} <span className="text-xs text-slate-400">({inv.siteCode})</span>
              </span>
              <span className="flex items-center gap-4">
                <span className="text-xs text-slate-400">{done} completed</span>
                <span className="font-mono font-semibold">{currencyFmt.format(accrued)}</span>
              </span>
            </div>
          ))}
        </CardBody>
      </Card>

      <p className="text-xs text-slate-400">
        Honoraria only — CRO service &amp; platform fees are invoiced separately per the study agreement.
      </p>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-teal-700 dark:text-teal-400">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      </CardBody>
    </Card>
  );
}
