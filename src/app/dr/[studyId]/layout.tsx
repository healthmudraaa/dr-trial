"use client";

import { use } from "react";
import { PortalShell } from "@/components/shell/PortalShell";

export default function DoctorPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studyId: string }>;
}) {
  const { studyId } = use(params);
  return (
    <PortalShell
      role="dr"
      studyId={studyId}
      variant="topnav"
      nav={[
        { href: `/dr/${studyId}/dashboard`, label: "Dashboard" },
        { href: `/dr/${studyId}/patients`, label: "Patients" },
        { href: `/dr/${studyId}/onboarding`, label: "Onboarding" },
        { href: `/dr/${studyId}/support`, label: "Support" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
