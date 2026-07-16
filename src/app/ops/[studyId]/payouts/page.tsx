import { notFound } from "next/navigation";
import { getStudyBundle } from "@/lib/studies";
import { getPayoutSummary } from "@/lib/payouts";
import { PayoutLedger } from "@/components/ops/PayoutLedger";

export default async function PayoutsPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = await params;
  const bundle = getStudyBundle(studyId);
  if (!bundle) notFound();
  const { study, investigators, patients } = bundle;

  const summaries = investigators.map((inv) => getPayoutSummary(inv, patients, study));

  return <PayoutLedger summaries={summaries} locale={study.locale} currency={study.currency} />;
}
