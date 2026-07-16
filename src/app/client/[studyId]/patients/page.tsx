"use client";

// FR-50: patient-level record comparison — first vs latest visit, change in key
// numeric fields, and status at a glance. Patients stay tokenised even here.

import { use, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { visitStatusChip } from "@/components/ui/StatusChip";
import { getStudy } from "@/lib/studies";
import { useDb } from "@/lib/store";
import { getOverallStatus } from "@/lib/status";
import { cn } from "@/lib/cn";

export default function ClientPatientsPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const [investigatorFilter, setInvestigatorFilter] = useState<string>("all");

  const investigators = useMemo(() => db.investigators.filter((i) => i.studyId === studyId), [db.investigators, studyId]);
  const patients = useMemo(
    () =>
      db.patients.filter(
        (p) => p.studyId === studyId && (investigatorFilter === "all" || p.investigatorId === investigatorFilter)
      ),
    [db.patients, studyId, investigatorFilter]
  );

  if (!study) return null;

  const firstVisit = study.visits[0];
  const lastVisit = study.visits[study.visits.length - 1];
  const compareFields = firstVisit.sections
    .flatMap((s) => s.fields)
    .filter((f) => f.type === "number")
    .slice(0, 2);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Site:</span>
        <button
          onClick={() => setInvestigatorFilter("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            investigatorFilter === "all" ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          )}
        >
          All
        </button>
        {investigators.map((inv) => (
          <button
            key={inv.id}
            onClick={() => setInvestigatorFilter(inv.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              investigatorFilter === inv.id
                ? "bg-teal-700 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {inv.siteCode}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title={`Patients (${patients.length})`}
          subtitle={`Change from ${firstVisit.label} to ${lastVisit.label} for key measures`}
        />
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="pb-2 font-medium">Patient</th>
                <th className="pb-2 font-medium">Age/Sex</th>
                <th className="pb-2 font-medium">Status</th>
                {compareFields.map((f) => (
                  <th key={f.id} className="pb-2 font-medium">
                    Δ {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => {
                const status = getOverallStatus(p, study);
                return (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2.5 font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">{p.id}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">
                      {p.age}
                      {p.sex}
                    </td>
                    <td className="py-2.5">{visitStatusChip(status)}</td>
                    {compareFields.map((f) => {
                      const a = p.visitRecords[firstVisit.id]?.data[f.id];
                      const b = p.visitRecords[lastVisit.id]?.data[f.id];
                      if (typeof a !== "number" || typeof b !== "number") {
                        return (
                          <td key={f.id} className="py-2.5 text-slate-300 dark:text-slate-600">
                            —
                          </td>
                        );
                      }
                      const delta = Math.round((b - a) * 10) / 10;
                      // deliberately neutral: whether a rise or fall is "good" is
                      // measure-specific (e.g. LVEF up = good, NT-proBNP down = good)
                      return (
                        <td key={f.id} className="py-2.5 font-medium text-slate-700 tabular-nums dark:text-slate-200">
                          {delta > 0 ? "+" : ""}
                          {delta}
                          {f.unit ? ` ${f.unit}` : ""}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
