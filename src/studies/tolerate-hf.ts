// TOLERATE-HF — HFrEF GDMT registry. This is ONE configured study on the DR Trial
// platform, not the platform itself — every field below is data, not a hardcoded
// type. A structurally different study (diabetes-poc.ts) proves the same engine
// (CaptureFlow, Dashboard, Ops pages) works without any HFrEF-specific code paths.

import type {
  CrfSection,
  Investigator,
  Patient,
  StudyDefinition,
  DataQuery,
  SupportTicket,
} from "@/lib/types";

function clinicalSections(): CrfSection[] {
  return [
    {
      id: "vitals_labs",
      title: "Vitals & labs",
      fields: [
        { id: "lvef", label: "LVEF", type: "number", unit: "%", min: 10, max: 80, required: true },
        {
          id: "nyha",
          label: "NYHA class",
          type: "select",
          options: ["I", "II", "III", "IV"],
          required: true,
        },
        { id: "ntprobnp", label: "NT-proBNP", type: "number", unit: "pg/mL", min: 0, max: 15000, required: true },
        {
          id: "potassium",
          label: "Potassium",
          type: "number",
          unit: "mmol/L",
          min: 3.5,
          max: 5.5,
          required: true,
        },
      ],
    },
    {
      id: "gdmt",
      title: "GDMT therapy (four pillars)",
      fields: [
        { id: "arni", label: "ARNI / ACEi / ARB", type: "boolean" },
        { id: "beta_blocker", label: "Beta-blocker", type: "boolean" },
        { id: "mra", label: "MRA", type: "boolean" },
        { id: "sglt2i", label: "SGLT2i", type: "boolean" },
      ],
    },
  ];
}

export const TOLERATE_HF: StudyDefinition = {
  studyId: "tolerate-hf",
  name: "TOLERATE-HF — HFrEF GDMT Registry",
  therapeuticArea: "Cardiology",
  currency: "INR",
  currencySymbol: "₹",
  timezone: "Asia/Kolkata",
  locale: "en-IN",
  ratePerCompletedPatient: 3000,
  complianceRulesetId: "in-ich-gcp-v1",
  visits: [
    { id: "baseline", label: "Visit 1 — Baseline", offsetDaysFromBaseline: 0, sections: clinicalSections() },
    { id: "followup", label: "Visit 2 — Follow-up", offsetDaysFromBaseline: 90, sections: clinicalSections() },
  ],
  classify: (visitData) => {
    const baseline = visitData["baseline"];
    if (!baseline) return undefined;
    const pillarsOn = ["arni", "beta_blocker", "mra", "sglt2i"].filter((k) => baseline[k] === true).length;
    if (pillarsOn >= 3) return { key: "stabilized", label: "Stabilized" };
    if (baseline.nyha === "III" || baseline.nyha === "IV") return { key: "uncontrolled", label: "Uncontrolled" };
    return { key: "intolerant", label: "Intolerant to ≥1 pillar" };
  },
};

export const TOLERATE_HF_INVESTIGATORS: Investigator[] = [
  {
    id: "inv-001",
    studyId: "tolerate-hf",
    name: "Dr. Anjali Rao",
    qualification: "DM Cardiology",
    siteCode: "TH-042",
    region: "South",
    city: "Bengaluru",
    mobile: "+91 98450 XXXXX",
    documentsSigned: true,
    patientCap: 20,
  },
  {
    id: "inv-002",
    studyId: "tolerate-hf",
    name: "Dr. Vikram Nair",
    qualification: "DM Cardiology",
    siteCode: "TH-017",
    region: "South",
    city: "Kochi",
    mobile: "+91 94470 XXXXX",
    documentsSigned: true,
    patientCap: 20,
  },
  {
    id: "inv-003",
    studyId: "tolerate-hf",
    name: "Dr. Meera Iyer",
    qualification: "MD · DNB Cardiology",
    siteCode: "TH-088",
    region: "West",
    city: "Pune",
    mobile: "+91 98220 XXXXX",
    documentsSigned: false, // FR-04/05/54: payout stays blocked until MOU is signed
    patientCap: 20,
  },
  {
    id: "inv-004",
    studyId: "tolerate-hf",
    name: "Dr. Rajesh Khanna",
    qualification: "DM Cardiology",
    siteCode: "TH-103",
    region: "North",
    city: "New Delhi",
    mobile: "+91 98100 XXXXX",
    documentsSigned: true,
    patientCap: 20,
  },
];

export const TOLERATE_HF_PATIENTS: Patient[] = [
  {
    id: "TH-042-P01",
    studyId: "tolerate-hf",
    investigatorId: "inv-001",
    age: 61,
    sex: "M",
    region: "South",
    city: "Bengaluru",
    consent: { captured: true, capturedAt: "2026-04-02T09:14:00+05:30" },
    visitRecords: {
      baseline: {
        status: "captured",
        capturedAt: "2026-04-02T09:20:11+05:30",
        locked: true,
        data: { lvef: 32, nyha: "II", ntprobnp: 1450, potassium: 4.4, arni: true, beta_blocker: true, mra: true, sglt2i: false },
      },
      followup: { status: "due", scheduledFor: "2026-07-01", locked: false, data: {} },
    },
    openDataQueries: 0,
  },
  {
    id: "TH-042-P02",
    studyId: "tolerate-hf",
    investigatorId: "inv-001",
    age: 68,
    sex: "F",
    region: "South",
    city: "Bengaluru",
    consent: { captured: true, capturedAt: "2026-03-20T11:02:00+05:30" },
    visitRecords: {
      baseline: {
        status: "captured",
        capturedAt: "2026-03-20T11:10:44+05:30",
        locked: true,
        data: { lvef: 28, nyha: "III", ntprobnp: 2600, potassium: 4.1, arni: true, beta_blocker: true, mra: false, sglt2i: false },
      },
      followup: { status: "overdue", scheduledFor: "2026-06-18", locked: false, data: {} },
    },
    openDataQueries: 1,
  },
  {
    id: "TH-042-P03",
    studyId: "tolerate-hf",
    investigatorId: "inv-001",
    age: 54,
    sex: "M",
    region: "South",
    city: "Bengaluru",
    consent: { captured: false },
    visitRecords: {
      baseline: {
        status: "missing_fields",
        capturedAt: "2026-06-30T16:41:02+05:30",
        locked: false,
        data: { nyha: "II", ntprobnp: 1800, beta_blocker: true, sglt2i: true },
      },
      followup: { status: "due", locked: false, data: {} },
    },
    openDataQueries: 0,
  },
  {
    id: "TH-042-P04",
    studyId: "tolerate-hf",
    investigatorId: "inv-001",
    age: 72,
    sex: "F",
    region: "South",
    city: "Bengaluru",
    consent: { captured: true, capturedAt: "2026-02-10T08:30:00+05:30" },
    visitRecords: {
      baseline: {
        status: "captured",
        capturedAt: "2026-02-10T08:36:19+05:30",
        locked: true,
        data: { lvef: 40, nyha: "I", ntprobnp: 900, potassium: 4.6, arni: true, beta_blocker: true, mra: true, sglt2i: true },
      },
      followup: {
        status: "captured",
        capturedAt: "2026-05-12T10:02:55+05:30",
        locked: true,
        data: { lvef: 45, nyha: "I", ntprobnp: 610, potassium: 4.5, arni: true, beta_blocker: true, mra: true, sglt2i: true },
      },
    },
    openDataQueries: 0,
  },
  {
    id: "TH-017-P01",
    studyId: "tolerate-hf",
    investigatorId: "inv-002",
    age: 58,
    sex: "M",
    region: "South",
    city: "Kochi",
    consent: { captured: true, capturedAt: "2026-01-15T10:00:00+05:30" },
    visitRecords: {
      baseline: {
        status: "captured",
        capturedAt: "2026-01-15T10:05:00+05:30",
        locked: true,
        data: { lvef: 38, nyha: "II", ntprobnp: 1100, potassium: 4.3, arni: true, beta_blocker: true, mra: true, sglt2i: true },
      },
      followup: {
        status: "captured",
        capturedAt: "2026-04-16T09:40:00+05:30",
        locked: true,
        data: { lvef: 44, nyha: "I", ntprobnp: 520, potassium: 4.2, arni: true, beta_blocker: true, mra: true, sglt2i: true },
      },
    },
    openDataQueries: 0,
  },
  {
    id: "TH-017-P02",
    studyId: "tolerate-hf",
    investigatorId: "inv-002",
    age: 63,
    sex: "F",
    region: "South",
    city: "Kochi",
    consent: { captured: true, capturedAt: "2026-05-01T08:20:00+05:30" },
    visitRecords: {
      baseline: {
        status: "captured",
        capturedAt: "2026-05-01T08:26:00+05:30",
        locked: true,
        data: { lvef: 26, nyha: "III", ntprobnp: 2900, potassium: 4.0, arni: true, beta_blocker: false, mra: false, sglt2i: false },
      },
      followup: { status: "due", scheduledFor: "2026-07-30", locked: false, data: {} },
    },
    openDataQueries: 0,
  },
  {
    id: "TH-017-P03",
    studyId: "tolerate-hf",
    investigatorId: "inv-002",
    age: 70,
    sex: "M",
    region: "South",
    city: "Kochi",
    consent: { captured: true, capturedAt: "2026-03-05T12:00:00+05:30" },
    visitRecords: {
      baseline: {
        status: "captured",
        capturedAt: "2026-03-05T12:08:00+05:30",
        locked: true,
        data: { lvef: 31, nyha: "III", ntprobnp: 2100, potassium: 4.2, arni: false, beta_blocker: true, mra: false, sglt2i: true },
      },
      followup: { status: "overdue", scheduledFor: "2026-06-03", locked: false, data: {} },
    },
    openDataQueries: 2,
  },
  {
    id: "TH-088-P01",
    studyId: "tolerate-hf",
    investigatorId: "inv-003",
    age: 66,
    sex: "F",
    region: "West",
    city: "Pune",
    consent: { captured: true, capturedAt: "2026-02-20T09:00:00+05:30" },
    visitRecords: {
      baseline: {
        status: "captured",
        capturedAt: "2026-02-20T09:10:00+05:30",
        locked: true,
        data: { lvef: 36, nyha: "II", ntprobnp: 1300, potassium: 4.4, arni: true, beta_blocker: true, mra: true, sglt2i: false },
      },
      followup: {
        status: "captured",
        capturedAt: "2026-05-22T09:30:00+05:30",
        locked: true,
        data: { lvef: 42, nyha: "I", ntprobnp: 700, potassium: 4.3, arni: true, beta_blocker: true, mra: true, sglt2i: false },
      },
    },
    openDataQueries: 0,
  },
  {
    id: "TH-088-P02",
    studyId: "tolerate-hf",
    investigatorId: "inv-003",
    age: 59,
    sex: "M",
    region: "West",
    city: "Pune",
    consent: { captured: false },
    visitRecords: {
      baseline: { status: "missing_fields", locked: false, data: {} },
      followup: { status: "due", locked: false, data: {} },
    },
    openDataQueries: 0,
  },
  {
    id: "TH-103-P01",
    studyId: "tolerate-hf",
    investigatorId: "inv-004",
    age: 64,
    sex: "M",
    region: "North",
    city: "New Delhi",
    consent: { captured: true, capturedAt: "2026-01-28T11:00:00+05:30" },
    visitRecords: {
      baseline: {
        status: "captured",
        capturedAt: "2026-01-28T11:05:00+05:30",
        locked: true,
        data: { lvef: 39, nyha: "II", ntprobnp: 1050, potassium: 4.3, arni: true, beta_blocker: true, mra: true, sglt2i: true },
      },
      followup: {
        status: "captured",
        capturedAt: "2026-04-29T10:15:00+05:30",
        locked: true,
        data: { lvef: 46, nyha: "I", ntprobnp: 480, potassium: 4.4, arni: true, beta_blocker: true, mra: true, sglt2i: true },
      },
    },
    openDataQueries: 0,
  },
  {
    id: "TH-103-P02",
    studyId: "tolerate-hf",
    investigatorId: "inv-004",
    age: 71,
    sex: "F",
    region: "North",
    city: "New Delhi",
    consent: { captured: true, capturedAt: "2026-04-10T09:00:00+05:30" },
    visitRecords: {
      baseline: {
        status: "captured",
        capturedAt: "2026-04-10T09:12:00+05:30",
        locked: true,
        data: { lvef: 29, nyha: "III", ntprobnp: 2400, potassium: 4.1, arni: false, beta_blocker: true, mra: false, sglt2i: false },
      },
      followup: { status: "overdue", scheduledFor: "2026-07-09", locked: false, data: {} },
    },
    openDataQueries: 1,
  },
  {
    id: "TH-103-P03",
    studyId: "tolerate-hf",
    investigatorId: "inv-004",
    age: 55,
    sex: "M",
    region: "North",
    city: "New Delhi",
    consent: { captured: true, capturedAt: "2026-05-20T08:45:00+05:30" },
    visitRecords: {
      baseline: {
        status: "captured",
        capturedAt: "2026-05-20T08:52:00+05:30",
        locked: true,
        data: { lvef: 34, nyha: "II", ntprobnp: 1500, potassium: 4.2, arni: true, beta_blocker: true, mra: false, sglt2i: true },
      },
      followup: { status: "due", scheduledFor: "2026-08-18", locked: false, data: {} },
    },
    openDataQueries: 0,
  },
];

export const TOLERATE_HF_TICKETS: SupportTicket[] = [
  {
    id: "TCK-101",
    studyId: "tolerate-hf",
    investigatorId: "inv-002",
    patientId: "TH-017-P03",
    subject: "Unable to upload prescription photo — app times out on 4G",
    createdAt: "2026-07-12T14:20:00+05:30",
    status: "open",
  },
  {
    id: "TCK-102",
    studyId: "tolerate-hf",
    investigatorId: "inv-004",
    subject: "Request to increase patient allocation beyond 20",
    createdAt: "2026-07-10T09:05:00+05:30",
    status: "resolved",
  },
];

export const TOLERATE_HF_QUERIES: DataQuery[] = [
  {
    id: "DQ-501",
    studyId: "tolerate-hf",
    patientId: "TH-042-P02",
    investigatorId: "inv-001",
    visitId: "baseline",
    category: "Lab value",
    detail: "NT-proBNP entered as 2600 pg/mL — please confirm units and re-verify against lab report.",
    createdAt: "2026-06-25T10:00:00+05:30",
    status: "open",
  },
  {
    id: "DQ-502",
    studyId: "tolerate-hf",
    patientId: "TH-017-P03",
    investigatorId: "inv-002",
    visitId: "baseline",
    category: "GDMT",
    detail: "ARNI/ACEi/ARB marked as not on drug with no documented contraindication — please clarify.",
    createdAt: "2026-06-20T15:30:00+05:30",
    status: "open",
  },
  {
    id: "DQ-503",
    studyId: "tolerate-hf",
    patientId: "TH-017-P03",
    investigatorId: "inv-002",
    visitId: "baseline",
    category: "Consent",
    detail: "Consent photo timestamp is 6 days after visit date — please confirm sequence.",
    createdAt: "2026-06-22T11:10:00+05:30",
    status: "open",
  },
  {
    id: "DQ-504",
    studyId: "tolerate-hf",
    patientId: "TH-103-P02",
    investigatorId: "inv-004",
    visitId: "baseline",
    category: "Follow-up",
    detail: "Visit 2 is 9 days overdue with no reminder response logged — confirm patient contactability.",
    createdAt: "2026-07-08T08:00:00+05:30",
    status: "open",
  },
];
