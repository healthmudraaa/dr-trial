import { getPaymentStatus } from "./status";
import type { Investigator, Patient, StudyDefinition } from "./types";

export interface PayoutSummary {
  investigator: Investigator;
  paidCount: number;
  payableCount: number;
  blockedCount: number; // complete but docs unsigned — FR-05/38/54
  inProgressCount: number;
  payableAmount: number; // awaiting release, at study rate
  paidAmount: number; // already released
  blockedAmount: number; // what would be payable if docs were signed
  payablePatientIds: string[]; // what a release action pays out
}

export function getPayoutSummary(
  investigator: Investigator,
  patients: Patient[],
  study: Pick<StudyDefinition, "ratePerCompletedPatient" | "visits">
): PayoutSummary {
  const mine = patients.filter((p) => p.investigatorId === investigator.id);
  let paidCount = 0;
  let payableCount = 0;
  let blockedCount = 0;
  let inProgressCount = 0;
  const payablePatientIds: string[] = [];

  for (const patient of mine) {
    const status = getPaymentStatus(patient, investigator, study);
    if (status === "paid") paidCount++;
    else if (status === "payable") {
      payableCount++;
      payablePatientIds.push(patient.id);
    } else if (status === "blocked_docs") blockedCount++;
    else inProgressCount++;
  }

  return {
    investigator,
    paidCount,
    payableCount,
    blockedCount,
    inProgressCount,
    payableAmount: payableCount * study.ratePerCompletedPatient,
    paidAmount: paidCount * study.ratePerCompletedPatient,
    blockedAmount: blockedCount * study.ratePerCompletedPatient,
    payablePatientIds,
  };
}
