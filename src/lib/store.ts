"use client";

// Client-side persistent data layer for the product demo. Every action in every
// portal writes here (localStorage), so the full workflow is real within a
// browser: a doctor's submission appears in Ops QC, QC approval flips payment
// status, releasing a payout marks the doctor paid, admin rate changes move
// every money figure. A production deployment swaps this module for API calls —
// the mutation surface below is the API contract.

import { useEffect, useReducer, useRef } from "react";
import type {
  AuditEvent,
  DataQuery,
  FieldValue,
  Investigator,
  Patient,
  PayoutRelease,
  ReminderEvent,
  SupportTicket,
} from "./types";
import { getStudyBundle, STUDIES } from "./studies";

export interface StudySettingsOverride {
  ratePerCompletedPatient?: number;
  currency?: string;
  currencySymbol?: string;
  timezone?: string;
  locale?: string;
  complianceRulesetId?: string;
}

export interface Db {
  version: number;
  patients: Patient[];
  investigators: Investigator[];
  tickets: SupportTicket[];
  queries: DataQuery[];
  reminders: ReminderEvent[];
  payouts: PayoutRelease[];
  audit: AuditEvent[];
  docsSigned: Record<string, string[]>; // investigatorId -> signed doc ids (FR-04)
  settings: Record<string, StudySettingsOverride>; // studyId -> admin overrides
}

const STORAGE_KEY = "dr-trial-db-v1";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildSeed(): Db {
  const patients: Patient[] = [];
  const investigators: Investigator[] = [];
  const tickets: SupportTicket[] = [];
  const queries: DataQuery[] = [];
  const docsSigned: Record<string, string[]> = {};
  for (const study of STUDIES) {
    const bundle = getStudyBundle(study.studyId);
    if (!bundle) continue;
    patients.push(...clone(bundle.patients));
    investigators.push(...clone(bundle.investigators));
    tickets.push(...clone(bundle.tickets));
    queries.push(...clone(bundle.queries));
    for (const inv of bundle.investigators) {
      docsSigned[inv.id] = inv.documentsSigned ? ["mou", "ec_ack", "protocol_ack", "privacy"] : [];
    }
  }
  return {
    version: 1,
    patients,
    investigators,
    tickets,
    queries,
    reminders: [],
    payouts: [],
    audit: [],
    docsSigned,
    settings: {},
  };
}

let seedCache: Db | null = null;
function seed(): Db {
  if (!seedCache) seedCache = buildSeed();
  return seedCache;
}

let db: Db | null = null;
const listeners = new Set<() => void>();

function loadFromStorage(): Db {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Db;
      if (parsed.version === 1) return parsed;
    }
  } catch {
    // corrupted storage — fall back to seed
  }
  return clone(seed());
}

function persist() {
  if (typeof window === "undefined" || !db) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // quota exceeded — demo keeps working in-memory
  }
}

function notify() {
  for (const l of listeners) l();
}

export function getDb(): Db {
  if (typeof window === "undefined") return seed();
  if (!db) db = loadFromStorage();
  return db;
}

export function mutate(actor: string, studyId: string, action: string, fn: (draft: Db) => void) {
  const current = getDb();
  fn(current);
  current.audit.unshift({ at: new Date().toISOString(), studyId, actor, action });
  if (current.audit.length > 300) current.audit.length = 300;
  // Fresh references at every level components memoize on — without this,
  // useMemo([db.patients]) would serve stale lists after in-place mutations
  // (e.g. a QC approval not leaving the queue until reload).
  db = {
    ...current,
    patients: [...current.patients],
    investigators: [...current.investigators],
    tickets: [...current.tickets],
    queries: [...current.queries],
    reminders: [...current.reminders],
    payouts: [...current.payouts],
    audit: [...current.audit],
    docsSigned: { ...current.docsSigned },
    settings: { ...current.settings },
  };
  persist();
  notify();
}

export function resetDemoData() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  db = clone(seed());
  persist();
  notify();
}

// Hook: server render and first client render both use the seed (hydration-safe);
// after mount we swap to the persisted DB and subscribe to changes.
export function useDb(): Db {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const hydrated = useRef(false);
  useEffect(() => {
    hydrated.current = true;
    force();
    const listener = () => force();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return hydrated.current ? getDb() : seed();
}

// ---------- domain mutations (the future API surface) ----------

export function registerPatient(
  studyId: string,
  investigatorId: string,
  input: { age: number; sex: "M" | "F"; consentCaptured: boolean },
): string | undefined {
  const bundle = getStudyBundle(studyId);
  const study = bundle?.study;
  if (!study) return undefined;
  let newId: string | undefined;
  mutate("investigator", studyId, "Registered a new patient", (draft) => {
    const inv = draft.investigators.find((i) => i.id === investigatorId);
    if (!inv) return;
    const mine = draft.patients.filter((p) => p.investigatorId === investigatorId);
    const nextNum = mine.length + 1;
    const id = `${inv.siteCode}-P${String(nextNum).padStart(2, "0")}`;
    newId = id;
    const now = new Date();
    const visitRecords: Patient["visitRecords"] = {};
    study.visits.forEach((v, idx) => {
      const scheduled = new Date(now.getTime() + (v.offsetDaysFromBaseline ?? 0) * 86400000);
      visitRecords[v.id] = {
        status: idx === 0 ? "due" : "due",
        scheduledFor: scheduled.toISOString().slice(0, 10),
        locked: false,
        data: {},
      };
    });
    draft.patients.push({
      id,
      studyId,
      investigatorId,
      age: input.age,
      sex: input.sex,
      region: inv.region,
      city: inv.city,
      registeredAt: now.toISOString(),
      consent: input.consentCaptured
        ? { captured: true, capturedAt: now.toISOString() }
        : { captured: false },
      visitRecords,
      openDataQueries: 0,
    });
  });
  return newId;
}

export function submitVisit(
  studyId: string,
  patientId: string,
  visitId: string,
  data: Record<string, FieldValue>,
) {
  mutate("investigator", studyId, `Submitted ${visitId} for ${patientId} (locked, sent to QC)`, (draft) => {
    const patient = draft.patients.find((p) => p.id === patientId && p.studyId === studyId);
    if (!patient) return;
    patient.visitRecords[visitId] = {
      ...patient.visitRecords[visitId],
      status: "captured",
      capturedAt: new Date().toISOString(),
      locked: true,
      qcStatus: "pending_qc",
      data,
    };
  });
}

export function qcApprove(studyId: string, patientId: string, visitId: string) {
  mutate("qc", studyId, `QC approved ${visitId} for ${patientId}`, (draft) => {
    const patient = draft.patients.find((p) => p.id === patientId && p.studyId === studyId);
    const record = patient?.visitRecords[visitId];
    if (record) record.qcStatus = "approved";
  });
}

export function qcRaiseQuery(studyId: string, patientId: string, visitId: string, reason: string) {
  mutate("qc", studyId, `QC raised a query on ${visitId} for ${patientId}`, (draft) => {
    const patient = draft.patients.find((p) => p.id === patientId && p.studyId === studyId);
    const record = patient?.visitRecords[visitId];
    if (!patient || !record) return;
    record.qcStatus = "query_raised";
    patient.openDataQueries += 1;
    draft.queries.unshift({
      id: `DQ-${Math.floor(1000 + Math.random() * 9000)}`,
      studyId,
      patientId,
      investigatorId: patient.investigatorId,
      visitId,
      category: "QC",
      detail: reason,
      createdAt: new Date().toISOString(),
      status: "open",
    });
  });
}

export function answerQuery(studyId: string, queryId: string, response: string) {
  mutate("investigator", studyId, `Investigator answered query ${queryId}`, (draft) => {
    const query = draft.queries.find((q) => q.id === queryId);
    if (!query || query.status !== "open") return;
    query.status = "answered";
    query.doctorResponse = response;
  });
}

export function closeQuery(studyId: string, queryId: string) {
  mutate("qc", studyId, `Query ${queryId} closed`, (draft) => {
    const query = draft.queries.find((q) => q.id === queryId);
    if (!query || query.status === "resolved") return;
    query.status = "resolved";
    const patient = draft.patients.find((p) => p.id === query.patientId && p.studyId === studyId);
    if (patient) {
      patient.openDataQueries = Math.max(0, patient.openDataQueries - 1);
      const record = patient.visitRecords[query.visitId];
      if (record && record.qcStatus === "query_raised") record.qcStatus = "pending_qc"; // back to QC after resolution
    }
  });
}

export function signDocument(studyId: string, investigatorId: string, docId: string) {
  mutate("investigator", studyId, `Signed onboarding document: ${docId}`, (draft) => {
    const signed = draft.docsSigned[investigatorId] ?? [];
    if (!signed.includes(docId)) signed.push(docId);
    draft.docsSigned[investigatorId] = signed;
    const inv = draft.investigators.find((i) => i.id === investigatorId);
    if (inv) {
      inv.documentsSigned = ["mou", "ec_ack", "protocol_ack", "privacy"].every((d) => signed.includes(d));
    }
  });
}

export function releasePayout(studyId: string, investigatorId: string, patientIds: string[], amount: number) {
  mutate("cro", studyId, `Released payout for ${patientIds.length} patient(s)`, (draft) => {
    const now = new Date().toISOString();
    for (const pid of patientIds) {
      const patient = draft.patients.find((p) => p.id === pid && p.studyId === studyId);
      if (patient) patient.paymentReleasedAt = now;
    }
    draft.payouts.unshift({ studyId, investigatorId, patientIds, amount, releasedAt: now });
  });
}

export function raiseTicket(studyId: string, investigatorId: string, subject: string, patientId?: string) {
  mutate("investigator", studyId, "Raised a support ticket", (draft) => {
    draft.tickets.unshift({
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      studyId,
      investigatorId,
      patientId,
      subject,
      createdAt: new Date().toISOString(),
      status: "open",
    });
  });
}

export function resolveTicket(studyId: string, ticketId: string) {
  mutate("ops", studyId, `Resolved ticket ${ticketId}`, (draft) => {
    const ticket = draft.tickets.find((t) => t.id === ticketId);
    if (ticket) ticket.status = "resolved";
  });
}

export function recordReminder(studyId: string, patientId: string, visitId: string, state: ReminderEvent["state"]) {
  mutate("ops", studyId, `Reminder ${state} for ${patientId}/${visitId}`, (draft) => {
    draft.reminders.unshift({ studyId, patientId, visitId, state, at: new Date().toISOString() });
  });
}

export function updateStudySettings(studyId: string, override: StudySettingsOverride) {
  mutate("admin", studyId, "Updated study settings", (draft) => {
    draft.settings[studyId] = { ...draft.settings[studyId], ...override };
  });
}
