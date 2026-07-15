// Second study, deliberately different from TOLERATE-HF: different therapeutic area,
// different visit count/cadence, different fields, no classification function, and a
// different country/currency/timezone — this is what proves the platform is a
// schema-driven engine and not HFrEF logic wearing a config file.

import type { CrfSection, Investigator, Patient, StudyDefinition } from "@/lib/types";

function glycemicSections(): CrfSection[] {
  return [
    {
      id: "glycemic_control",
      title: "Glycemic control",
      fields: [
        { id: "hba1c", label: "HbA1c", type: "number", unit: "%", min: 4, max: 14, required: true },
        {
          id: "fasting_glucose",
          label: "Fasting glucose",
          type: "number",
          unit: "mg/dL",
          min: 50,
          max: 400,
          required: true,
        },
        { id: "bmi", label: "BMI", type: "number", unit: "kg/m²", min: 15, max: 60, required: true },
        { id: "hypo_episodes", label: "Hypoglycemic episodes since last visit", type: "number", min: 0, max: 30 },
      ],
    },
  ];
}

export const DIABETES_POC: StudyDefinition = {
  studyId: "diabetes-poc",
  name: "T2D Glycemic Control — POC Registry",
  therapeuticArea: "Endocrinology",
  currency: "USD",
  currencySymbol: "$",
  timezone: "America/New_York",
  locale: "en-US",
  ratePerCompletedPatient: 500,
  complianceRulesetId: "us-fda-21cfr11-v1",
  visits: [
    { id: "screening", label: "Visit 1 — Screening", offsetDaysFromBaseline: 0, sections: glycemicSections() },
    { id: "month3", label: "Visit 2 — Month 3", offsetDaysFromBaseline: 90, sections: glycemicSections() },
    { id: "month6", label: "Visit 3 — Month 6", offsetDaysFromBaseline: 180, sections: glycemicSections() },
  ],
  // No classify() — most studies won't need a derived phenotype-style classification.
};

export const DIABETES_POC_INVESTIGATORS: Investigator[] = [
  {
    id: "inv-101",
    studyId: "diabetes-poc",
    name: "Dr. Sarah Chen",
    qualification: "MD Endocrinology",
    siteCode: "DP-01",
    region: "Northeast",
    city: "Boston",
    mobile: "+1 617 555 0110",
    documentsSigned: true,
    patientCap: 15,
  },
  {
    id: "inv-102",
    studyId: "diabetes-poc",
    name: "Dr. Michael Ortiz",
    qualification: "MD Endocrinology",
    siteCode: "DP-02",
    region: "Midwest",
    city: "Chicago",
    mobile: "+1 312 555 0142",
    documentsSigned: true,
    patientCap: 15,
  },
];

export const DIABETES_POC_PATIENTS: Patient[] = [
  {
    id: "DP-01-P01",
    studyId: "diabetes-poc",
    investigatorId: "inv-101",
    age: 49,
    sex: "F",
    region: "Northeast",
    city: "Boston",
    consent: { captured: true, capturedAt: "2026-03-01T09:00:00-05:00" },
    visitRecords: {
      screening: {
        status: "captured",
        capturedAt: "2026-03-01T09:10:00-05:00",
        locked: true,
        data: { hba1c: 8.9, fasting_glucose: 172, bmi: 31.2, hypo_episodes: 0 },
      },
      month3: {
        status: "captured",
        capturedAt: "2026-05-30T09:05:00-04:00",
        locked: true,
        data: { hba1c: 7.6, fasting_glucose: 138, bmi: 30.4, hypo_episodes: 1 },
      },
      month6: { status: "due", scheduledFor: "2026-08-28", locked: false, data: {} },
    },
    openDataQueries: 0,
  },
  {
    id: "DP-01-P02",
    studyId: "diabetes-poc",
    investigatorId: "inv-101",
    age: 57,
    sex: "M",
    region: "Northeast",
    city: "Boston",
    consent: { captured: true, capturedAt: "2026-02-10T08:30:00-05:00" },
    visitRecords: {
      screening: {
        status: "captured",
        capturedAt: "2026-02-10T08:40:00-05:00",
        locked: true,
        data: { hba1c: 9.4, fasting_glucose: 190, bmi: 34.0, hypo_episodes: 0 },
      },
      month3: { status: "overdue", scheduledFor: "2026-05-11", locked: false, data: {} },
      month6: { status: "due", scheduledFor: "2026-08-09", locked: false, data: {} },
    },
    openDataQueries: 1,
  },
  {
    id: "DP-02-P01",
    studyId: "diabetes-poc",
    investigatorId: "inv-102",
    age: 62,
    sex: "M",
    region: "Midwest",
    city: "Chicago",
    consent: { captured: false },
    visitRecords: {
      screening: { status: "missing_fields", locked: false, data: { fasting_glucose: 165 } },
      month3: { status: "due", locked: false, data: {} },
      month6: { status: "due", locked: false, data: {} },
    },
    openDataQueries: 0,
  },
];
