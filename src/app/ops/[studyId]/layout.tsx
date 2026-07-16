"use client";

import { use } from "react";
import { PortalShell } from "@/components/shell/PortalShell";

export default function OpsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studyId: string }>;
}) {
  const { studyId } = use(params);
  return (
    <PortalShell
      role="ops"
      studyId={studyId}
      variant="sidebar"
      nav={[
        { href: `/ops/${studyId}/roster`, label: "Investigators" },
        { href: `/ops/${studyId}/queue`, label: "Action queue" },
        { href: `/ops/${studyId}/qc`, label: "QC review" },
        { href: `/ops/${studyId}/queries`, label: "Data queries" },
        { href: `/ops/${studyId}/payouts`, label: "Payouts" },
        { href: `/ops/${studyId}/reminders`, label: "Reminders" },
        { href: `/ops/${studyId}/tickets`, label: "Support tickets" },
        { href: `/ops/${studyId}/audit`, label: "Audit trail" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
