"use client";

// Shared analytics block for Sponsor and Client overviews. The `identified`
// flag is the FR-46 boundary: Sponsor renders aggregates only (no names, no
// IDs, no money); Client gets the same charts plus identified KPIs elsewhere.

import { useMemo } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TrajectoryChart, HBars } from "@/components/charts/Charts";
import {
  classificationMix,
  enrolmentSeries,
  meanVisitGapDays,
  regionPerformance,
  retentionFunnel,
} from "@/lib/analytics";
import type { Patient, StudyDefinition } from "@/lib/types";

export function StudyAnalytics({ study, patients }: { study: StudyDefinition; patients: Patient[] }) {
  const series = useMemo(() => enrolmentSeries(patients), [patients]);
  const funnel = useMemo(() => retentionFunnel(patients, study), [patients, study]);
  const mix = useMemo(() => classificationMix(patients, study), [patients, study]);
  const regions = useMemo(() => regionPerformance(patients, study), [patients, study]);
  const gap = useMemo(() => meanVisitGapDays(patients, study), [patients, study]);

  const enrolled = patients.length;
  const completed = patients.filter((p) => study.visits.every((v) => p.visitRecords[v.id]?.locked)).length;
  const target = Math.max(40, Math.ceil(enrolled * 1.6));
  const projection =
    series.length >= 3
      ? Math.round(enrolled + (enrolled - series[Math.max(0, series.length - 5)].cumulative) * 2)
      : enrolled;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <Tile label="Patients enrolled" value={String(enrolled)} />
        <Tile label="Fully completed" value={`${completed}`} sub={`${enrolled ? Math.round((completed / enrolled) * 100) : 0}% of enrolled`} />
        <Tile label="Mean visit gap" value={gap !== null ? `${gap} d` : "—"} sub={`target ~${study.visits[1]?.offsetDaysFromBaseline ?? "—"} d`} />
        <Tile label="Projected landing" value={String(projection)} sub="at current weekly rate" />
      </div>

      <Card>
        <CardHeader
          title="Enrolment trajectory"
          subtitle={`Cumulative enrolments per week vs target (${target}) — updates live as sites capture`}
        />
        <CardBody>
          <TrajectoryChart points={series} target={target} />
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Retention funnel" subtitle="Where patients are in the visit schedule" />
          <CardBody>
            <HBars rows={funnel.map((f) => ({ label: f.label, value: f.count }))} />
          </CardBody>
        </Card>
        {mix.length > 0 ? (
          <Card>
            <CardHeader title="Clinical classification mix" subtitle="Derived from captured baseline data" />
            <CardBody>
              <HBars rows={mix.map((m) => ({ label: m.label, value: m.count }))} colorByIndex />
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Site performance by region" subtitle="Enrolled per region" />
            <CardBody>
              <HBars rows={regions.map((r) => ({ label: r.region, value: r.enrolled, detail: `${r.region}: ${r.enrolled} enrolled, ${r.completed} completed` }))} />
            </CardBody>
          </Card>
        )}
      </div>

      {mix.length > 0 && (
        <Card>
          <CardHeader title="Site performance by region" subtitle="Enrolled vs fully completed per region" />
          <CardBody className="space-y-4">
            <HBars
              rows={regions.map((r) => ({
                label: r.region,
                value: r.enrolled,
                detail: `${r.region}: ${r.enrolled} enrolled, ${r.completed} completed`,
              }))}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="pb-1 font-medium">Region</th>
                    <th className="pb-1 font-medium">Enrolled</th>
                    <th className="pb-1 font-medium">Completed</th>
                    <th className="pb-1 font-medium">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((r) => (
                    <tr key={r.region} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-1.5 font-medium text-slate-700 dark:text-slate-200">{r.region}</td>
                      <td className="py-1.5 text-slate-500 tabular-nums dark:text-slate-400">{r.enrolled}</td>
                      <td className="py-1.5 text-slate-500 tabular-nums dark:text-slate-400">{r.completed}</td>
                      <td className="py-1.5 text-slate-500 tabular-nums dark:text-slate-400">
                        {r.enrolled ? Math.round((r.completed / r.enrolled) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      </CardBody>
    </Card>
  );
}
