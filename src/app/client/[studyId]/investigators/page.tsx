"use client";

// FR-49: investigator list with identities visible to the client, per-site
// enrolment/completion and spend.

import { use, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { getStudy } from "@/lib/studies";
import { useDb } from "@/lib/store";

export default function ClientInvestigatorsPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();

  const rows = useMemo(() => {
    if (!study) return [];
    const rate = db.settings[studyId]?.ratePerCompletedPatient ?? study.ratePerCompletedPatient;
    return db.investigators
      .filter((i) => i.studyId === studyId)
      .map((inv) => {
        const mine = db.patients.filter((p) => p.investigatorId === inv.id && p.studyId === studyId);
        const completed = mine.filter((p) => study.visits.every((v) => p.visitRecords[v.id]?.locked)).length;
        return { inv, enrolled: mine.length, completed, spend: completed * rate };
      })
      .sort((a, b) => b.enrolled - a.enrolled);
  }, [db, study, studyId]);

  if (!study) return null;
  const currencyFmt = new Intl.NumberFormat(study.locale, {
    style: "currency",
    currency: db.settings[studyId]?.currency ?? study.currency,
    maximumFractionDigits: 0,
  });

  return (
    <Card>
      <CardHeader title="Investigators" subtitle={`${rows.length} active sites`} />
      <CardBody className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400">
              <th className="pb-2 font-medium">Investigator</th>
              <th className="pb-2 font-medium">Site</th>
              <th className="pb-2 font-medium">Enrolled</th>
              <th className="pb-2 font-medium">Completed</th>
              <th className="pb-2 font-medium">Completion</th>
              <th className="pb-2 text-right font-medium">Spend (completed)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ inv, enrolled, completed, spend }) => (
              <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{inv.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{inv.qualification}</p>
                </td>
                <td className="py-2.5 text-slate-500 dark:text-slate-400">
                  {inv.siteCode} · {inv.city}
                </td>
                <td className="py-2.5 tabular-nums">{enrolled}</td>
                <td className="py-2.5 tabular-nums">{completed}</td>
                <td className="py-2.5 tabular-nums">{enrolled ? Math.round((completed / enrolled) * 100) : 0}%</td>
                <td className="py-2.5 text-right font-mono font-semibold">{currencyFmt.format(spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
