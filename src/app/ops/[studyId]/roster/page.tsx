"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useDb } from "@/lib/store";

export default function RosterPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const db = useDb();
  const investigators = useMemo(() => db.investigators.filter((i) => i.studyId === studyId), [db.investigators, studyId]);

  return (
    <Card>
      <CardBody className="space-y-2">
        {investigators.map((inv) => {
          const enrolled = db.patients.filter((p) => p.investigatorId === inv.id && p.studyId === studyId).length;
          return (
            <Link
              key={inv.id}
              href={`/ops/${studyId}/roster/${inv.id}`}
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
