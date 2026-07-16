import { notFound } from "next/navigation";
import { getStudyBundle } from "@/lib/studies";
import { QcReviewList, type QcItem } from "@/components/ops/QcReviewList";

export default async function QcReviewPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = await params;
  const bundle = getStudyBundle(studyId);
  if (!bundle) notFound();
  const { study, patients, investigators } = bundle;

  const investigatorName = (id: string) => investigators.find((i) => i.id === id)?.name ?? id;

  const items: QcItem[] = patients.flatMap((p) =>
    study.visits
      .filter((v) => {
        const record = p.visitRecords[v.id];
        return record?.locked && record.qcStatus === "pending_qc";
      })
      .map((v) => ({
        patientId: p.id,
        investigatorName: investigatorName(p.investigatorId),
        visitId: v.id,
        capturedAt: p.visitRecords[v.id].capturedAt,
        data: p.visitRecords[v.id].data,
      }))
  );

  return <QcReviewList items={items} visits={study.visits} />;
}
