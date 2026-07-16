"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import type { PayoutSummary } from "@/lib/payouts";

// The CRO releases honoraria from here — a patient only ever reaches "payable"
// after every visit is doctor-submitted, locked, and QC-approved (see lib/status.ts).
// The release action is local prototype state; a real build calls the payment rail
// and writes the ledger.
export function PayoutLedger({
  summaries,
  locale,
  currency,
}: {
  summaries: PayoutSummary[];
  locale: string;
  currency: string;
}) {
  const [released, setReleased] = useState<Record<string, boolean>>({});
  const currencyFmt = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });

  const totalPayable = summaries.reduce((sum, s) => sum + s.payableAmount, 0);
  const totalBlocked = summaries.reduce((sum, s) => sum + s.blockedAmount, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Payable — QC-approved, awaiting release
            </p>
            <p className="mt-1 text-2xl font-semibold text-teal-700 dark:text-teal-400">
              {currencyFmt.format(totalPayable)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Blocked value — MOU unsigned</p>
            <p className="mt-1 text-2xl font-semibold text-rose-600 dark:text-rose-400">
              {currencyFmt.format(totalBlocked)}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Payout ledger by investigator"
          subtitle="Payable = every visit doctor-submitted, locked, and QC-approved"
        />
        <CardBody className="space-y-2">
          {summaries.map((s) => {
            const isReleased = released[s.investigator.id] ?? false;
            return (
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
                  {s.payableAmount > 0 &&
                    (isReleased ? (
                      <StatusChip tone="good">Payout released</StatusChip>
                    ) : (
                      <Button onClick={() => setReleased((prev) => ({ ...prev, [s.investigator.id]: true }))}>
                        Release payout
                      </Button>
                    ))}
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
