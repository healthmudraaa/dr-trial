import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { getStudyBundle } from "@/lib/studies";
import { getPayoutSummary } from "@/lib/payouts";

export default async function PayoutsPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = await params;
  const bundle = getStudyBundle(studyId);
  if (!bundle) notFound();
  const { study, investigators, patients } = bundle;

  const summaries = investigators.map((inv) => getPayoutSummary(inv, patients, study));
  const currencyFmt = new Intl.NumberFormat(study.locale, {
    style: "currency",
    currency: study.currency,
    maximumFractionDigits: 0,
  });

  const totalPayable = summaries.reduce((sum, s) => sum + s.payableAmount, 0);
  const totalBlocked = summaries.reduce((sum, s) => sum + s.blockedAmount, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total paid + payable</p>
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
        <CardHeader title="Payout ledger by investigator" />
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
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
