// Registry of every study configured on the platform. Onboarding a new study means
// adding one entry here backed by a studies/<id>.ts config — no new components.

import type { DataQuery, Investigator, Patient, StudyDefinition, SupportTicket } from "./types";
import {
  TOLERATE_HF,
  TOLERATE_HF_INVESTIGATORS,
  TOLERATE_HF_PATIENTS,
  TOLERATE_HF_QUERIES,
  TOLERATE_HF_TICKETS,
} from "@/studies/tolerate-hf";
import { DIABETES_POC, DIABETES_POC_INVESTIGATORS, DIABETES_POC_PATIENTS } from "@/studies/diabetes-poc";

interface StudyBundle {
  study: StudyDefinition;
  investigators: Investigator[];
  patients: Patient[];
  tickets: SupportTicket[];
  queries: DataQuery[];
}

const BUNDLES: Record<string, StudyBundle> = {
  [TOLERATE_HF.studyId]: {
    study: TOLERATE_HF,
    investigators: TOLERATE_HF_INVESTIGATORS,
    patients: TOLERATE_HF_PATIENTS,
    tickets: TOLERATE_HF_TICKETS,
    queries: TOLERATE_HF_QUERIES,
  },
  [DIABETES_POC.studyId]: {
    study: DIABETES_POC,
    investigators: DIABETES_POC_INVESTIGATORS,
    patients: DIABETES_POC_PATIENTS,
    tickets: [],
    queries: [],
  },
};

export const STUDIES: StudyDefinition[] = Object.values(BUNDLES).map((b) => b.study);

export function getStudyBundle(studyId: string): StudyBundle | undefined {
  return BUNDLES[studyId];
}

export function getStudy(studyId: string): StudyDefinition | undefined {
  return BUNDLES[studyId]?.study;
}
