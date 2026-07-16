"use client";

// Patient registration (FR-06/07/08/09): demographics → eligibility prompt (soft
// warning, not a hard block) → consent photo → register. The patient gets a
// tokenised study ID; no name/phone/address is ever collected into study data.

import { use, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getStudy } from "@/lib/studies";
import { registerPatient, useDb } from "@/lib/store";
import { getSession } from "@/lib/session";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950";

export default function RegisterPatientPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const router = useRouter();
  const session = typeof window !== "undefined" ? getSession("dr", studyId) : null;
  const investigator = useMemo(
    () => db.investigators.find((i) => i.id === session?.userId) ?? db.investigators.find((i) => i.studyId === studyId),
    [db.investigators, session?.userId, studyId]
  );

  const [step, setStep] = useState<"details" | "consent" | "done">("details");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"M" | "F" | "">("");
  const [eligibilityChecks, setEligibilityChecks] = useState<Record<string, boolean>>({});
  const [consentUrl, setConsentUrl] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);
  const consentInput = useRef<HTMLInputElement>(null);

  if (!study || !investigator) return null;

  const atCap =
    db.patients.filter((p) => p.studyId === studyId && p.investigatorId === investigator.id).length >=
    investigator.patientCap;

  const eligibility = [
    { id: "adult", label: "Adult patient (≥18 years)" },
    { id: "dx", label: `Confirmed ${study.therapeuticArea === "Cardiology" ? "HFrEF diagnosis (LVEF ≤ 45%, ≥3 months)" : "diagnosis per protocol"}` },
    { id: "followup", label: "Patient expected to be available for follow-up visits" },
    { id: "informed", label: "Patient informed about the study and willing to consent" },
  ];
  const uncheckedCount = eligibility.filter((e) => !eligibilityChecks[e.id]).length;

  function proceedToConsent() {
    setStep("consent");
  }

  function completeRegistration() {
    registerPatient(studyId, investigator!.id, {
      age: Number(age),
      sex: sex as "M" | "F",
      consentCaptured: Boolean(consentUrl),
    });
    const mine = [...db.patients.filter((p) => p.studyId === studyId && p.investigatorId === investigator!.id)];
    setNewId(`${investigator!.siteCode}-P${String(mine.length + 1).padStart(2, "0")}`);
    setStep("done");
  }

  if (atCap && step === "details") {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            You have reached your {investigator.patientCap}-patient allocation for this study (FR-06). Contact the
            study team via Support if you believe you should have additional allocation.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Register new patient</h2>

      {step === "details" && (
        <Card>
          <CardHeader
            title="Step 1 — Demographics & eligibility"
            subtitle="No name, phone, or address is collected — the patient receives a tokenised study ID (FR-08)"
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Age *</span>
                <input className={inputClass} type="number" min={18} max={110} value={age} onChange={(e) => setAge(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sex *</span>
                <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as "M" | "F")}>
                  <option value="">—</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </label>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                Eligibility confirmation (FR-09)
              </p>
              <div className="space-y-2">
                {eligibility.map((e) => (
                  <label key={e.id} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4"
                      checked={eligibilityChecks[e.id] ?? false}
                      onChange={(ev) => setEligibilityChecks((prev) => ({ ...prev, [e.id]: ev.target.checked }))}
                    />
                    {e.label}
                  </label>
                ))}
              </div>
              {uncheckedCount > 0 && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                  {uncheckedCount} eligibility item(s) unconfirmed — you can still proceed (soft check per FR-09),
                  but unconfirmed eligibility may lead to a QC query later.
                </p>
              )}
            </div>

            <Button disabled={!age || !sex} onClick={proceedToConsent}>
              Continue to consent
            </Button>
          </CardBody>
        </Card>
      )}

      {step === "consent" && (
        <Card>
          <CardHeader
            title="Step 2 — Consent photo"
            subtitle="Photograph the signed paper consent form (FR-07). Stored against the tokenised ID, visible only to the CRO — never to sponsor/client."
          />
          <CardBody className="space-y-4">
            <input
              ref={consentInput}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setConsentUrl(URL.createObjectURL(f));
              }}
            />
            {consentUrl ? (
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={consentUrl}
                  alt="Consent form"
                  className="max-h-48 w-40 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                />
                <Button variant="secondary" onClick={() => consentInput.current?.click()}>
                  Retake photo
                </Button>
              </div>
            ) : (
              <Button onClick={() => consentInput.current?.click()}>📷 Photograph signed consent</Button>
            )}
            <div className="flex flex-wrap gap-3">
              <Button disabled={!consentUrl} onClick={completeRegistration}>
                Register patient
              </Button>
              <Button variant="secondary" onClick={completeRegistration}>
                Register without consent (flagged for follow-up)
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {step === "done" && (
        <Card>
          <CardBody className="space-y-3 text-center">
            <p className="text-3xl">✅</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Patient registered</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tokenised study ID: <span className="font-mono font-semibold">{newId}</span>
              <br />
              Baseline visit is now due — capture the first prescription when ready. Follow-up auto-scheduled per
              protocol (FR-25).
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => router.push(`/dr/${studyId}/patients`)}>Go to patients</Button>
              <Button variant="secondary" onClick={() => { setStep("details"); setAge(""); setSex(""); setConsentUrl(null); setEligibilityChecks({}); }}>
                Register another
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
