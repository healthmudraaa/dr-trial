import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getStudyBundle } from "@/lib/studies";

export default async function RosterPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = await params;
  const bundle = getStudyBundle(studyId);
  if (!bundle) notFound();
  const { investigators, patients } = bundle;

  return (
    <Card>
      <CardBody className="space-y-2">
        {investigators.map((inv) => {
          const enrolled = patients.filter((p) => p.investigatorId === inv.id).length;
          return (
            <Link
              key={inv.id}
              href={`/studies/${studyId}/ops/roster/${inv.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{inv.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {inv.qualification} · {inv.siteCode} · {inv.city}, {inv.region}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ProgressBar value={enrolled} max={inv.patientCap} className="w-24" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {enrolled}/{inv.patientCap}
                </span>
              </div>
              {inv.documentsSigned ? (
                <StatusChip tone="good">Docs signed</StatusChip>
              ) : (
                <StatusChip tone="bad">MOU unsigned</StatusChip>
              )}
            </Link>
          );
        })}
      </CardBody>
    </Card>
  );
}
