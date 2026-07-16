"use client";

// FR-52: real, working exports — dataset CSV, data dictionary, statistical
// summary — generated from the live schema + data on click.

import { use, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getStudy } from "@/lib/studies";
import { useDb } from "@/lib/store";
import { buildDatasetCsv, buildDictionaryCsv, buildSummaryCsv, downloadCsv } from "@/lib/csv";

export default function ClientExportsPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const patients = useMemo(() => db.patients.filter((p) => p.studyId === studyId), [db.patients, studyId]);
  if (!study) return null;

  const stamp = new Date().toISOString().slice(0, 10);
  const items = [
    {
      title: "Full dataset (CSV)",
      description: `Every patient row with tokenised IDs and all ${study.visits.length}-visit CRF values. ${patients.length} rows.`,
      action: () => downloadCsv(`${studyId}-dataset-${stamp}.csv`, buildDatasetCsv(study, patients)),
    },
    {
      title: "Data dictionary (CSV)",
      description: "Variable definitions: label, type, unit, allowed values/ranges, required flags — per visit and section.",
      action: () => downloadCsv(`${studyId}-dictionary-${stamp}.csv`, buildDictionaryCsv(study)),
    },
    {
      title: "Statistical summary (CSV)",
      description: "n / mean / min / max for every numeric field per visit, plus enrolment totals.",
      action: () => downloadCsv(`${studyId}-summary-${stamp}.csv`, buildSummaryCsv(study, patients)),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Exports"
        subtitle="Generated live from current study data — every export is audit-logged in production"
      />
      <CardBody className="space-y-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
            </div>
            <Button onClick={item.action}>Download</Button>
          </div>
        ))}
        <p className="pt-2 text-xs text-slate-400">
          CDISC (CDASH/SDTM) export mappings are on the roadmap for regulatory-submission-ready datasets.
        </p>
      </CardBody>
    </Card>
  );
}
