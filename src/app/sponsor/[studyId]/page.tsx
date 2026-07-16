"use client";

// Sponsor view (FR-42–46): live, de-identified aggregates ONLY. No patient IDs,
// no investigator names, no payment figures render in this portal — the same
// boundary a production API enforces server-side.

import { use, useMemo } from "react";
import { getStudy } from "@/lib/studies";
import { useDb } from "@/lib/store";
import { StudyAnalytics } from "@/components/analytics/StudyAnalytics";

export default function SponsorOverviewPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const patients = useMemo(() => db.patients.filter((p) => p.studyId === studyId), [db.patients, studyId]);
  if (!study) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        De-identified view — patient identifiers, investigator identities, and study spend are not visible to the
        sponsor role (FR-46). Data streams in live as sites capture.
      </div>
      <StudyAnalytics study={study} patients={patients} />
    </div>
  );
}
