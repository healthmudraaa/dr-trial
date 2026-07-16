import { redirect } from "next/navigation";

export default async function OpsIndex({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = await params;
  redirect(`/ops/${studyId}/roster`);
}
