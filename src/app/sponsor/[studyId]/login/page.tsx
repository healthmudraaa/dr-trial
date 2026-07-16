"use client";

import { use } from "react";
import { StaffLogin } from "@/components/auth/LoginScreens";

export default function SponsorLoginPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  return <StaffLogin studyId={studyId} role="sponsor" roleLabel="Sponsor" />;
}
