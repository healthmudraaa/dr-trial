import { redirect } from "next/navigation";

export default async function ClientIndex({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = await params;
  redirect(`/client/${studyId}/overview`);
}
