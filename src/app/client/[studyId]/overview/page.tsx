"use client";

// Client view (FR-47–52): everything the sponsor sees, PLUS identified detail
// and spend. The live-sync indicator in the header is the FR-47 commitment:
// this is the study as it happens, not a monthly PDF.

import { use, useMemo } from "react";
import { getStudy } from "@/lib/studies";
import { useDb } from "@/lib/store";
import { StudyAnalytics } from "@/components/analytics/StudyAnalytics";

export default function ClientOverviewPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const patients = useMemo(() => db.patients.filter((p) => p.studyId === studyId), [db.patients, studyId]);
  if (!study) return null;

  return <StudyAnalytics study={study} patients={patients} />;
}
