"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { visitStatusChip } from "@/components/ui/StatusChip";
import { getOverallStatus } from "@/lib/status";
import { cn } from "@/lib/cn";
import type { Patient, VisitDef, VisitStatus } from "@/lib/types";

const STATUS_FILTERS: Array<VisitStatus | "all"> = ["all", "captured", "due", "overdue", "missing_fields"];

export function PatientsFilterList({
  studyId,
  visits,
  patients,
}: {
  studyId: string;
  visits: VisitDef[]; // not the whole StudyDefinition — its `classify` fn can't cross to a Client Component
  patients: Patient[];
}) {
  const [status, setStatus] = useState<VisitStatus | "all">("all");

  const filtered = useMemo(
    () => patients.filter((p) => status === "all" || getOverallStatus(p, { visits }) === status),
    [patients, status, visits]
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Follow-up status</p>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt}
              onClick={() => setStatus(opt)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize",
                status === opt
                  ? "bg-teal-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {opt.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardBody className="space-y-2">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/dr/${studyId}/patients/${p.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.id}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {p.age}
                  {p.sex} · {p.city}
                </p>
              </div>
              {visitStatusChip(getOverallStatus(p, { visits }))}
            </Link>
          ))}
          {filtered.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No patients match this filter.</p>}
        </CardBody>
      </Card>
    </div>
  );
}
