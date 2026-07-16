import { notFound } from "next/navigation";
import { getStudyBundle } from "@/lib/studies";
import { DataQueriesList } from "@/components/ops/DataQueriesList";

export default async function DataQueriesPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = await params;
  const bundle = getStudyBundle(studyId);
  if (!bundle) notFound();
  const { study, queries, investigators } = bundle;

  return <DataQueriesList queries={queries} investigators={investigators} visits={study.visits} />;
}
