"use client";

// Real, working exports (FR-52): dataset, data dictionary, and statistical
// summary generated client-side from the study schema + live data.

import type { Patient, StudyDefinition } from "./types";

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

export function buildDatasetCsv(study: StudyDefinition, patients: Patient[]): string {
  const fieldCols = study.visits.flatMap((v) =>
    v.sections.flatMap((s) => s.fields.map((f) => ({ visit: v, field: f })))
  );
  const header = [
    "patient_id",
    "site_region",
    "age",
    "sex",
    "consent_on_file",
    ...study.visits.map((v) => `${v.id}_status`),
    ...fieldCols.map((c) => `${c.visit.id}_${c.field.id}`),
  ];
  const rows = patients.map((p) => [
    p.id,
    p.region,
    p.age,
    p.sex,
    p.consent.captured ? "Y" : "N",
    ...study.visits.map((v) => p.visitRecords[v.id]?.status ?? ""),
    ...fieldCols.map((c) => p.visitRecords[c.visit.id]?.data[c.field.id] ?? ""),
  ]);
  return toCsv([header, ...rows]);
}

export function buildDictionaryCsv(study: StudyDefinition): string {
  const rows: unknown[][] = [["variable", "visit", "section", "label", "type", "unit", "allowed_values", "required"]];
  for (const v of study.visits) {
    for (const s of v.sections) {
      for (const f of s.fields) {
        rows.push([
          `${v.id}_${f.id}`,
          v.label,
          s.title,
          f.label,
          f.type,
          f.unit ?? "",
          f.options ? f.options.join("|") : f.min !== undefined || f.max !== undefined ? `${f.min ?? ""}-${f.max ?? ""}` : "",
          f.required ? "Y" : "N",
        ]);
      }
    }
  }
  return toCsv(rows);
}

export function buildSummaryCsv(study: StudyDefinition, patients: Patient[]): string {
  const rows: unknown[][] = [["metric", "visit", "field", "n", "mean", "min", "max"]];
  for (const v of study.visits) {
    for (const s of v.sections) {
      for (const f of s.fields) {
        if (f.type !== "number") continue;
        const values = patients
          .map((p) => p.visitRecords[v.id]?.data[f.id])
          .filter((x): x is number => typeof x === "number" && !Number.isNaN(x));
        if (values.length === 0) continue;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        rows.push([
          "numeric_summary",
          v.label,
          f.label,
          values.length,
          Math.round(mean * 100) / 100,
          Math.min(...values),
          Math.max(...values),
        ]);
      }
    }
  }
  rows.push(["enrolled_total", "", "", patients.length, "", "", ""]);
  return toCsv(rows);
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
