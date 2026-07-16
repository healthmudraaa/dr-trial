"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getStudy } from "@/lib/studies";
import { useDb } from "@/lib/store";
import { getSession } from "@/lib/session";
import { PatientsFilterList } from "@/components/investigator/PatientsFilterList";

export default function PatientsPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const session = typeof window !== "undefined" ? getSession("dr", studyId) : null;
  const investigatorId = session?.userId ?? db.investigators.find((i) => i.studyId === studyId)?.id;
  const mine = useMemo(
    () => db.patients.filter((p) => p.studyId === studyId && p.investigatorId === investigatorId),
    [db.patients, studyId, investigatorId]
  );
  if (!study) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Patients ({mine.length})</h2>
        <Link href={`/dr/${studyId}/patients/new`}>
          <Button>+ Register new patient</Button>
        </Link>
      </div>
      <PatientsFilterList studyId={studyId} visits={study.visits} patients={mine} />
    </div>
  );
}
