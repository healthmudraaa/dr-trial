"use client";

import { use } from "react";
import { PortalShell } from "@/components/shell/PortalShell";

export default function AdminPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studyId: string }>;
}) {
  const { studyId } = use(params);
  return (
    <PortalShell
      role="admin"
      studyId={studyId}
      variant="sidebar"
      nav={[{ href: `/admin/${studyId}`, label: "Settings & schema" }]}
    >
      {children}
    </PortalShell>
  );
}
