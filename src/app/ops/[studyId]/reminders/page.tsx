import { notFound } from "next/navigation";
import { getStudyBundle } from "@/lib/studies";
import { RemindersList } from "@/components/ops/RemindersList";

export default async function RemindersPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = await params;
  const bundle = getStudyBundle(studyId);
  if (!bundle) notFound();
  const { study, patients, investigators } = bundle;

  return <RemindersList visits={study.visits} patients={patients} investigators={investigators} today="2026-07-15" />;
}
