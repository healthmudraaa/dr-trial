// Generic, schema-driven domain model — shared across all portals and all studies.
// A study defines WHAT it captures (StudyDefinition.visits); nothing here is specific
// to any one therapeutic area. See plan §1 ("Generic data model").

export type FieldType = "number" | "text" | "select" | "date" | "boolean";

export interface CrfFieldDef {
  id: string;
  label: string;
  type: FieldType;
  unit?: string;
  options?: string[]; // for type === "select"
  min?: number; // for type === "number"
  max?: number;
  required?: boolean;
}

export interface CrfSection {
  id: string;
  title: string;
  fields: CrfFieldDef[];
}

export interface VisitDef {
  id: string;
  label: string;
  offsetDaysFromBaseline?: number; // e.g. 90 for a 90-day follow-up
  sections: CrfSection[];
}

export type FieldValue = string | number | boolean;

export type VisitStatus = "captured" | "due" | "overdue" | "missing_fields";

// QC lifecycle after a doctor submits a locked record: the CRO's QC department
// reviews it and either approves (which is what makes the patient payable) or
// raises a query back to the doctor. Absent until the record is submitted.
export type QcStatus = "pending_qc" | "approved" | "query_raised";

export interface VisitRecord {
  status: VisitStatus;
  scheduledFor?: string; // ISO date
  capturedAt?: string; // ISO datetime — when the record synced, drives "live" claims
  locked: boolean; // FR-15: final save locks the record
  qcStatus?: QcStatus; // set on submission; payment gates on "approved"
  rxImageUrl?: string; // prescription photo (FR-10)
  data: Record<string, FieldValue>; // keyed by CrfFieldDef.id
  supersededIds?: string[]; // FR-14: prior captures kept for audit, never deleted
}

export interface Classification {
  key: string;
  label: string;
}

export interface StudyDefinition {
  studyId: string;
  name: string;
  therapeuticArea: string;
  currency: string; // config field, not hardcoded (plan §6 country-readiness)
  currencySymbol: string;
  timezone: string; // e.g. "Asia/Kolkata"
  locale: string; // e.g. "en-IN"
  ratePerCompletedPatient: number;
  complianceRulesetId: string; // swappable per country later
  visits: VisitDef[];
  // Optional per-study derived classification (was the hardcoded "phenotype" union) —
  // most studies won't define one; TOLERATE-HF's stabilized/uncontrolled/intolerant
  // logic lives here instead of in the core type system.
  classify?: (visitData: Record<string, Record<string, FieldValue>>) => Classification | undefined;
}

export interface Investigator {
  id: string;
  studyId: string;
  name: string;
  qualification: string;
  siteCode: string;
  region: string;
  city: string;
  mobile: string;
  documentsSigned: boolean; // FR-04/FR-05 — gates payout
  patientCap: number; // FR-06 — per-study patient allocation
}

export interface Patient {
  id: string; // e.g. TH-042-P01
  studyId: string;
  investigatorId: string;
  age: number;
  sex: "M" | "F";
  region: string;
  city: string;
  consent: {
    captured: boolean;
    imageUrl?: string;
    capturedAt?: string;
  };
  visitRecords: Record<string, VisitRecord>; // keyed by VisitDef.id
  openDataQueries: number; // FR-15/41
}

export type PaymentStatus = "paid" | "payable" | "blocked_docs" | "in_progress";

// Three distinct Ops workflows the FRs repeatedly warn against conflating
// (plan §3 "one inbox taxonomy") — modeled as separate record types, unified
// only at the presentation layer in lib/inbox.ts.

export interface SupportTicket {
  id: string;
  studyId: string;
  investigatorId: string;
  patientId?: string;
  subject: string;
  createdAt: string;
  status: "open" | "resolved";
}

export interface DataQuery {
  id: string;
  studyId: string;
  patientId: string;
  investigatorId: string;
  visitId: string;
  category: string;
  detail: string;
  createdAt: string;
  status: "open" | "resolved";
}
