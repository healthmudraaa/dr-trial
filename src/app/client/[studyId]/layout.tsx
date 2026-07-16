"use client";

import { use } from "react";
import { PortalShell } from "@/components/shell/PortalShell";

export default function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studyId: string }>;
}) {
  const { studyId } = use(params);
  return (
    <PortalShell
      role="client"
      studyId={studyId}
      variant="sidebar"
      nav={[
        { href: `/client/${studyId}/overview`, label: "Overview" },
        { href: `/client/${studyId}/investigators`, label: "Investigators" },
        { href: `/client/${studyId}/patients`, label: "Patients" },
        { href: `/client/${studyId}/spend`, label: "Study spend" },
        { href: `/client/${studyId}/exports`, label: "Exports" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
