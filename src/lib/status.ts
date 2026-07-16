// Single canonical status engine — consumed by Investigator and Ops UIs alike so the
// two portals can never disagree on a patient's state, for ANY study (plan §3 "status
// vocabulary must be centralized"). Operates on the generic visitRecords shape, not a
// hardcoded visit1/visit2 pair.

import type { Investigator, Patient, PaymentStatus, VisitDef, VisitStatus } from "./types";

// These helpers only ever need a study's visit list, never its `classify` function —
// narrowing the param type means callers can pass a plain, function-free object
// (important: a full StudyDefinition can't cross the server/client boundary as a
// prop because `classify` isn't serializable).
type VisitSchedule = { visits: VisitDef[] };

export type AttentionReason =
  | "visit_overdue"
  | "consent_missing"
  | "data_query_open"
  | "missing_mandatory_fields"
  | "qc_query";

export interface AttentionItem {
  patientId: string;
  reason: AttentionReason;
  label: string;
  severity: "high" | "medium";
}

export function getAttentionItems(patient: Patient, study: VisitSchedule): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (!patient.consent.captured) {
    items.push({ patientId: patient.id, reason: "consent_missing", label: "Consent photo missing", severity: "high" });
  }

  for (const visit of study.visits) {
    const record = patient.visitRecords[visit.id];
    if (!record) continue;
    if (record.status === "overdue") {
      items.push({
        patientId: patient.id,
        reason: "visit_overdue",
        label: `${visit.label} overdue`,
        severity: "high",
      });
    }
    if (record.status === "missing_fields") {
      items.push({
        patientId: patient.id,
        reason: "missing_mandatory_fields",
        label: `${visit.label}: mandatory field missing`,
        severity: "medium",
      });
    }
    if (record.qcStatus === "query_raised") {
      items.push({
        patientId: patient.id,
        reason: "qc_query",
        label: `${visit.label}: QC raised a query — respond to proceed`,
        severity: "high",
      });
    }
  }

  if (patient.openDataQueries > 0) {
    items.push({
      patientId: patient.id,
      reason: "data_query_open",
      label: `${patient.openDataQueries} open data ${patient.openDataQueries === 1 ? "query" : "queries"}`,
      severity: "medium",
    });
  }

  return items;
}

// A single derived status across however many visits a study defines — lets list/filter
// UIs work the same whether a study has 2 visits (TOLERATE-HF) or 3 (diabetes-poc).
export function getOverallStatus(patient: Patient, study: VisitSchedule): VisitStatus {
  const records = study.visits.map((v) => patient.visitRecords[v.id]);
  if (records.some((r) => r?.status === "overdue")) return "overdue";
  if (records.some((r) => r?.status === "missing_fields")) return "missing_fields";
  if (records.every((r) => r?.locked)) return "captured";
  return "due";
}

// Complete = payable: every visit locked AND QC-approved by the CRO's QC
// department, consent on file, no open queries. QC approval is the payment gate.
export function isPatientComplete(patient: Patient, study: VisitSchedule): boolean {
  return (
    patient.consent.captured &&
    study.visits.every((v) => {
      const record = patient.visitRecords[v.id];
      return record?.locked && record.qcStatus === "approved";
    }) &&
    patient.openDataQueries === 0
  );
}

export function getPaymentStatus(patient: Patient, investigator: Investigator, study: VisitSchedule): PaymentStatus {
  if (patient.paymentReleasedAt) return "paid";
  if (!isPatientComplete(patient, study)) return "in_progress";
  if (!investigator.documentsSigned) return "blocked_docs"; // FR-05/FR-54 — would be payable but for the MOU
  return "payable"; // release handled by Ops ledger — FR-39
}

export function daysBetween(a: string, b: string): number {
  const DAY = 86400000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY);
}
