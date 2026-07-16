"use client";

import { use } from "react";
import { PortalShell } from "@/components/shell/PortalShell";

export default function SponsorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studyId: string }>;
}) {
  const { studyId } = use(params);
  return (
    <PortalShell
      role="sponsor"
      studyId={studyId}
      variant="sidebar"
      nav={[{ href: `/sponsor/${studyId}`, label: "Study overview" }]}
    >
      {children}
    </PortalShell>
  );
}
