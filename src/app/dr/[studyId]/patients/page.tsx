import { notFound } from "next/navigation";
import { getStudyBundle } from "@/lib/studies";
import { PatientsFilterList } from "@/components/investigator/PatientsFilterList";

export default async function PatientsPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = await params;
  const bundle = getStudyBundle(studyId);
  if (!bundle) notFound();
  const { study, investigators, patients } = bundle;
  const investigator = investigators[0];
  const mine = patients.filter((p) => p.investigatorId === investigator.id);

  return <PatientsFilterList studyId={studyId} visits={study.visits} patients={mine} />;
}
