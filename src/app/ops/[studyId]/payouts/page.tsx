"use client";

// Payout ledger — payable requires every visit doctor-submitted, locked, and
// QC-approved. Releasing writes a persistent ledger entry and marks each
// patient paid, which the doctor sees immediately on their dashboard.

import { use, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { getStudy } from "@/lib/studies";
import { releasePayout, useDb } from "@/lib/store";
import { getPayoutSummary } from "@/lib/payouts";

export default function PayoutsPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();

  const rate = db.settings[studyId]?.ratePerCompletedPatient ?? study?.ratePerCompletedPatient ?? 0;
  const currency = db.settings[studyId]?.currency ?? study?.currency ?? "INR";

  const summaries = useMemo(() => {
    if (!study) return [];
    const patients = db.patients.filter((p) => p.studyId === studyId);
    return db.investigators
      .filter((i) => i.studyId === studyId)
      .map((inv) => getPayoutSummary(inv, patients, { ratePerCompletedPatient: rate, visits: study.visits }));
  }, [db.patients, db.investigators, study, studyId, rate]);

  const releases = useMemo(() => db.payouts.filter((p) => p.studyId === studyId), [db.payouts, studyId]);

  if (!study) return null;

  const currencyFmt = new Intl.NumberFormat(study.locale, { style: "currency", currency, maximumFractionDigits: 0 });
  const totalPayable = summaries.reduce((sum, s) => sum + s.payableAmount, 0);
  const totalPaid = summaries.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalBlocked = summaries.reduce((sum, s) => sum + s.blockedAmount, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Payable — awaiting release</p>
            <p className="mt-1 text-2xl font-semibold text-teal-700 dark:text-teal-400">
              {currencyFmt.format(totalPayable)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Released to date</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {currencyFmt.format(totalPaid)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Blocked — MOU unsigned</p>
            <p className="mt-1 text-2xl font-semibold text-rose-600 dark:text-rose-400">
              {currencyFmt.format(totalBlocked)}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Payout ledger by investigator"
          subtitle={`Rate: ${currencyFmt.format(rate)} per completed, QC-approved patient`}
        />
        <CardBody className="space-y-2">
          {summaries.map((s) => (
            <div
              key={s.investigator.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.investigator.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {s.paidCount} paid · {s.payableCount} payable · {s.inProgressCount} in progress
                  {s.blockedCount > 0 && ` · ${s.blockedCount} blocked`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {currencyFmt.format(s.payableAmount)}
                </span>
                {s.blockedCount > 0 && <StatusChip tone="bad">MOU unsigned</StatusChip>}
                {s.payableAmount > 0 && (
                  <Button
                    onClick={() =>
                      releasePayout(studyId, s.investigator.id, s.payablePatientIds, s.payableAmount)
                    }
                  >
                    Release {currencyFmt.format(s.payableAmount)}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Release history" subtitle="Persistent ledger of every disbursement" />
        <CardBody className="space-y-2">
          {releases.map((r, i) => {
            const inv = db.investigators.find((x) => x.id === r.investigatorId);
            return (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-4 py-2.5 text-sm dark:border-slate-800"
              >
                <span className="text-slate-700 dark:text-slate-200">
                  {inv?.name ?? r.investigatorId} — {r.patientIds.join(", ")}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono font-semibold">{currencyFmt.format(r.amount)}</span>
                  <span className="text-xs text-slate-400">{r.releasedAt.slice(0, 10)}</span>
                </span>
              </div>
            );
          })}
          {releases.length === 0 && <p className="text-sm text-slate-400">No payouts released yet.</p>}
        </CardBody>
      </Card>
    </div>
  );
}
