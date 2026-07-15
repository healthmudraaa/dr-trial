// Unified inbox for Ops (FR-37 action queue) — merges three distinct record types
// (QC-style attention flags, support tickets FR-35, data queries FR-15/41) into one
// view without conflating the underlying workflows. See plan §3 "one inbox taxonomy".
// Generic across studies: takes whichever study's patients/tickets/queries are passed in.

import { getAttentionItems } from "./status";
import type { DataQuery, Investigator, Patient, StudyDefinition, SupportTicket } from "./types";

export type InboxSource = "attention" | "ticket" | "query";

export interface InboxItem {
  id: string;
  source: InboxSource;
  investigatorId: string;
  investigatorName: string;
  patientId?: string;
  label: string;
  detail?: string;
  severity: "high" | "medium";
  createdAt?: string;
}

export function buildOpsInbox(
  study: StudyDefinition,
  patients: Patient[],
  tickets: SupportTicket[],
  queries: DataQuery[],
  investigators: Investigator[]
): InboxItem[] {
  const investigatorName = (id: string) => investigators.find((i) => i.id === id)?.name ?? id;
  const items: InboxItem[] = [];

  for (const patient of patients) {
    for (const attn of getAttentionItems(patient, study)) {
      if (attn.reason === "data_query_open") continue; // superseded by actual DataQuery records below
      items.push({
        id: `attn-${patient.id}-${attn.reason}`,
        source: "attention",
        investigatorId: patient.investigatorId,
        investigatorName: investigatorName(patient.investigatorId),
        patientId: patient.id,
        label: attn.label,
        severity: attn.severity,
      });
    }
  }

  for (const ticket of tickets) {
    if (ticket.status !== "open") continue;
    items.push({
      id: ticket.id,
      source: "ticket",
      investigatorId: ticket.investigatorId,
      investigatorName: investigatorName(ticket.investigatorId),
      patientId: ticket.patientId,
      label: ticket.subject,
      severity: "medium",
      createdAt: ticket.createdAt,
    });
  }

  for (const query of queries) {
    if (query.status !== "open") continue;
    items.push({
      id: query.id,
      source: "query",
      investigatorId: query.investigatorId,
      investigatorName: investigatorName(query.investigatorId),
      patientId: query.patientId,
      label: `Data query — ${query.category}`,
      detail: query.detail,
      severity: "medium",
      createdAt: query.createdAt,
    });
  }

  return items.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));
}
