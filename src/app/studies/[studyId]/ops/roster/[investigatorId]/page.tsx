import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip, visitStatusChip, paymentStatusChip } from "@/components/ui/StatusChip";
import { getStudyBundle } from "@/lib/studies";
import { getOverallStatus, getPaymentStatus } from "@/lib/status";
import { getPayoutSummary } from "@/lib/payouts";

export default async function InvestigatorDetailPage({
  params,
}: {
  params: Promise<{ studyId: string; investigatorId: string }>;
}) {
  const { studyId, investigatorId } = await params;
  const bundle = getStudyBundle(studyId);
  if (!bundle) notFound();
  const { study, investigators, patients } = bundle;
  const investigator = investigators.find((i) => i.id === investigatorId);
  if (!investigator) notFound();

  const mine = patients.filter((p) => p.investigatorId === investigator.id);
  const summary = getPayoutSummary(investigator, patients, study);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{investigator.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {investigator.qualification} · {investigator.siteCode} · {investigator.city}, {investigator.region} ·{" "}
            {investigator.mobile}
          </p>
        </div>
        {investigator.documentsSigned ? (
          <StatusChip tone="good">Docs signed</StatusChip>
        ) : (
          <StatusChip tone="bad">MOU unsigned — payouts blocked</StatusChip>
        )}
      </div>

      <Card>
        <CardHeader title="Patients" subtitle={`${mine.length} / ${investigator.patientCap} allocated`} />
        <CardBody className="space-y-2">
          {mine.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.id}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {p.age}
                  {p.sex} · {p.city}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {visitStatusChip(getOverallStatus(p, study))}
                {paymentStatusChip(getPaymentStatus(p, investigator, study))}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Payout summary" />
        <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Field label="Paid" value={String(summary.paidCount)} />
          <Field label="Payable" value={String(summary.payableCount)} />
          <Field label="Blocked (docs)" value={String(summary.blockedCount)} flag={summary.blockedCount > 0} />
          <Field label="In progress" value={String(summary.inProgressCount)} />
        </CardBody>
      </Card>
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
