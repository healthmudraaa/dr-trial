"use client";

import { use } from "react";
import { DoctorLogin } from "@/components/auth/LoginScreens";

export default function DoctorLoginPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  return <DoctorLogin studyId={studyId} />;
}
