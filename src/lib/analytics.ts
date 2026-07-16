// Pure aggregate computations shared by the Sponsor and Client portals.
// Sponsor consumes ONLY these aggregates — never patient IDs, investigator
// names, or money (FR-46). Client additionally reads identified detail.

import type { Patient, StudyDefinition } from "./types";

export interface WeekPoint {
  week: string; // ISO date of week start
  cumulative: number;
}

export function enrolmentSeries(patients: Patient[]): WeekPoint[] {
  const dates = patients
    .map((p) => p.registeredAt ?? Object.values(p.visitRecords)[0]?.capturedAt)
    .filter((d): d is string => Boolean(d))
    .map((d) => d.slice(0, 10))
    .sort();
  if (dates.length === 0) return [];
  const points: WeekPoint[] = [];
  const start = new Date(dates[0]);
  const end = new Date("2026-07-16");
  let cursor = new Date(start);
  while (cursor <= end) {
    const weekEnd = cursor.toISOString().slice(0, 10);
    points.push({ week: weekEnd, cumulative: dates.filter((d) => d <= weekEnd).length });
    cursor = new Date(cursor.getTime() + 7 * 86400000);
  }
  return points;
}

export interface FunnelStage {
  label: string;
  count: number;
}

export function retentionFunnel(patients: Patient[], study: StudyDefinition): FunnelStage[] {
  const stages: FunnelStage[] = [{ label: "Registered", count: patients.length }];
  stages.push({ label: "Consent on file", count: patients.filter((p) => p.consent.captured).length });
  study.visits.forEach((v) => {
    stages.push({
      label: `${v.label.replace(/^Visit \d+ — /, "")} captured`,
      count: patients.filter((p) => p.visitRecords[v.id]?.locked).length,
    });
  });
  return stages;
}

export interface MixSlice {
  label: string;
  count: number;
}

export function classificationMix(patients: Patient[], study: StudyDefinition): MixSlice[] {
  if (!study.classify) return [];
  const counts = new Map<string, number>();
  for (const p of patients) {
    const c = study.classify(Object.fromEntries(Object.entries(p.visitRecords).map(([id, r]) => [id, r.data])));
    if (!c) continue;
    counts.set(c.label, (counts.get(c.label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => ({ label, count }));
}

export interface RegionRow {
  region: string;
  enrolled: number;
  completed: number;
}

export function regionPerformance(patients: Patient[], study: StudyDefinition): RegionRow[] {
  const byRegion = new Map<string, { enrolled: number; completed: number }>();
  for (const p of patients) {
    const row = byRegion.get(p.region) ?? { enrolled: 0, completed: 0 };
    row.enrolled += 1;
    if (study.visits.every((v) => p.visitRecords[v.id]?.locked)) row.completed += 1;
    byRegion.set(p.region, row);
  }
  return [...byRegion.entries()]
    .map(([region, r]) => ({ region, ...r }))
    .sort((a, b) => b.enrolled - a.enrolled);
}

export function meanVisitGapDays(patients: Patient[], study: StudyDefinition): number | null {
  if (study.visits.length < 2) return null;
  const [first, second] = study.visits;
  const gaps = patients
    .map((p) => {
      const a = p.visitRecords[first.id]?.capturedAt;
      const b = p.visitRecords[second.id]?.capturedAt;
      if (!a || !b) return null;
      return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
    })
    .filter((g): g is number => g !== null);
  if (gaps.length === 0) return null;
  return Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
}
