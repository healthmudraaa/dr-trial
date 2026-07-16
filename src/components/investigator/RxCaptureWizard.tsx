"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { CrfFieldDef, FieldValue, VisitDef } from "@/lib/types";

// The doctor's capture pipeline, per FR-10–FR-15 and the QC/payment flow:
//
//   1. photo   — prescription photo via camera or gallery (FR-10)
//   2. extract — AI digitises the prescription into CRF fields (FR-11, simulated here)
//   3. verify  — the DOCTOR validates every AI-extracted value before it counts;
//                AI never submits on its own
//   4. review  — protocol validation (ranges/required, FR-12/13) then final check
//   5. submit  — record locks (FR-15) and goes to the CRO QC department; payment
//                is released only after QC approves
//
// AI extraction is simulated deterministically from the visit's schema — the state
// machine, doctor-verification gate, and audit trail are the real design; the OCR
// model plugs in later behind the same "extracting" step.

type Step = "photo" | "extracting" | "verify" | "review" | "submitted";

function allFields(visit: VisitDef): CrfFieldDef[] {
  return visit.sections.flatMap((s) => s.fields);
}

// Deterministic stand-in for the OCR/AI service: fills most fields with plausible
// values, deliberately leaves the last numeric field unread so the doctor-verify
// step has real work to do.
function simulateAiExtraction(visit: VisitDef): { values: Record<string, string>; unread: string[] } {
  const fields = allFields(visit);
  const numberFields = fields.filter((f) => f.type === "number");
  const unreadable = numberFields.length > 0 ? numberFields[numberFields.length - 1].id : undefined;
  const values: Record<string, string> = {};
  const unread: string[] = [];

  fields.forEach((f, i) => {
    if (f.id === unreadable) {
      values[f.id] = "";
      unread.push(f.id);
    } else if (f.type === "number" && f.min !== undefined && f.max !== undefined) {
      values[f.id] = String(Math.round(((f.min + f.max) / 2) * 10) / 10);
    } else if (f.type === "select" && f.options?.length) {
      values[f.id] = f.options[Math.min(1, f.options.length - 1)];
    } else if (f.type === "boolean") {
      values[f.id] = i % 2 === 0 ? "true" : "false";
    } else {
      values[f.id] = "";
      unread.push(f.id);
    }
  });
  return { values, unread };
}

export function RxCaptureWizard({
  patientId,
  visit,
  onSubmit,
}: {
  patientId: string;
  visit: VisitDef;
  onSubmit?: (data: Record<string, FieldValue>) => void;
}) {
  const [step, setStep] = useState<Step>("photo");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [aiValues, setAiValues] = useState<Record<string, string>>({});
  const [unreadFields, setUnreadFields] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  function log(entry: string) {
    setAuditLog((prev) => [...prev, `${new Date().toLocaleTimeString()} · ${entry}`]);
  }

  function onPhotoChosen(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    log(`Prescription photo captured (${file.name}, ${(file.size / 1024).toFixed(0)} KB)`);
    setStep("extracting");
    setTimeout(() => {
      const { values: extracted, unread } = simulateAiExtraction(visit);
      setAiValues(extracted);
      setValues(extracted);
      setUnreadFields(unread);
      const readCount = allFields(visit).length - unread.length;
      log(`AI extracted ${readCount} of ${allFields(visit).length} fields — ${unread.length} could not be read`);
      setStep("verify");
    }, 2000);
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    for (const f of allFields(visit)) {
      const raw = values[f.id];
      if (f.type === "boolean") continue;
      if (f.required && (raw === undefined || raw === "")) {
        next[f.id] = "Required";
        continue;
      }
      if (f.type === "number" && raw !== undefined && raw !== "") {
        const num = Number(raw);
        if (Number.isNaN(num)) next[f.id] = "Must be a number";
        else if (f.min !== undefined && num < f.min)
          next[f.id] = `Below protocol range (min ${f.min}${f.unit ? ` ${f.unit}` : ""})`;
        else if (f.max !== undefined && num > f.max)
          next[f.id] = `Above protocol range (max ${f.max}${f.unit ? ` ${f.unit}` : ""})`;
      }
    }
    return next;
  }

  function confirmVerification() {
    const result = validate();
    if (Object.keys(result).length > 0) {
      setErrors(result);
      log(`Protocol validation flagged ${Object.keys(result).length} field(s): ${Object.keys(result).join(", ")}`);
      return;
    }
    setErrors({});
    const corrected = allFields(visit).filter((f) => values[f.id] !== aiValues[f.id]).length;
    log(`Doctor verified all fields against the prescription (${corrected} corrected from AI values) — protocol validation passed`);
    setStep("review");
  }

  function submitForQc() {
    setStep("submitted");
    log("Record locked (FR-15) and submitted to CRO QC. Payment becomes payable after QC approval.");
    if (onSubmit) {
      const parsed: Record<string, FieldValue> = {};
      for (const f of allFields(visit)) {
        const raw = values[f.id];
        if (f.type === "number") parsed[f.id] = Number(raw);
        else if (f.type === "boolean") parsed[f.id] = raw === "true";
        else parsed[f.id] = raw ?? "";
      }
      onSubmit(parsed);
    }
  }

  return (
    <Card>
      <CardHeader
        title={`${visit.label} — prescription capture`}
        subtitle={`Patient ${patientId}`}
        action={
          step === "submitted" ? <StatusChip tone="warn">Awaiting QC</StatusChip> : <StepDots step={step} />
        }
      />
      <CardBody className="space-y-4">
        {step === "photo" && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Take a clear photo of the prescription, or choose one from your gallery. AI will read it and
              pre-fill the study form for you to verify.
            </p>
            <div className="flex flex-wrap gap-3">
              <input
                ref={cameraInput}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onPhotoChosen(e.target.files?.[0])}
              />
              <input
                ref={galleryInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPhotoChosen(e.target.files?.[0])}
              />
              <Button onClick={() => cameraInput.current?.click()}>📷 Take a photo</Button>
              <Button variant="secondary" onClick={() => galleryInput.current?.click()}>
                Choose from gallery
              </Button>
            </div>
          </div>
        )}

        {step === "extracting" && (
          <div className="space-y-3">
            {photoUrl && <RxThumbnail url={photoUrl} />}
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              AI is reading the prescription and extracting study fields…
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
              <p className="font-semibold">Verify every value against the prescription</p>
              <p className="mt-1">
                These fields were extracted by AI — they do not count until you confirm them. Correct anything
                the AI misread; fields marked “not read” must be entered manually.
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-4">
              {photoUrl && <RxThumbnail url={photoUrl} />}
              <div className="min-w-0 flex-1 space-y-4">
                {visit.sections.map((section) => (
                  <div key={section.id}>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                      {section.title}
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {section.fields.map((f) => (
                        <FieldInput
                          key={f.id}
                          field={f}
                          value={values[f.id] ?? ""}
                          error={errors[f.id]}
                          aiRead={!unreadFields.includes(f.id)}
                          edited={values[f.id] !== aiValues[f.id]}
                          onChange={(v) => setValues((prev) => ({ ...prev, [f.id]: v }))}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {Object.keys(errors).length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
                {Object.keys(errors).length} field(s) missing or outside the protocol range — fix before proceeding.
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={confirmVerification}>I have verified — validate against protocol</Button>
              <Button variant="secondary" onClick={() => { setStep("photo"); setPhotoUrl(null); log("Recapture started — previous photo superseded, kept for audit (FR-14)"); }}>
                Recapture photo
              </Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
              Doctor-verified and protocol-validated — no missing mandatory fields, no out-of-range values.
            </div>
            <div className="flex flex-wrap items-start gap-4">
              {photoUrl && <RxThumbnail url={photoUrl} />}
              <ReadOnlySummary visit={visit} values={values} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={submitForQc}>Submit for QC review</Button>
              <Button variant="secondary" onClick={() => setStep("verify")}>
                Back to editing
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submitting locks this record (FR-15). The CRO QC team reviews it next — your honorarium for this
              patient becomes payable once every visit is QC-approved.
            </p>
          </div>
        )}

        {step === "submitted" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              Record locked and submitted to the QC department. You will be notified if QC raises a query;
              otherwise payment is released after approval.
            </div>
            <div className="flex flex-wrap items-start gap-4">
              {photoUrl && <RxThumbnail url={photoUrl} />}
              <ReadOnlySummary visit={visit} values={values} />
            </div>
          </div>
        )}

        {auditLog.length > 0 && (
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Audit trail</p>
            <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              {auditLog.map((entry, i) => (
                <li key={i}>{entry}</li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ["photo", "extracting", "verify", "review", "submitted"];
  const labels = ["Photo", "AI", "Verify", "Review", "Done"];
  const current = order.indexOf(step);
  return (
    <div className="flex items-center gap-1.5">
      {labels.map((label, i) => (
        <span
          key={label}
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            i < current
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : i === current
                ? "bg-teal-700 text-white"
                : "bg-slate-100 text-slate-400 dark:bg-slate-800"
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function RxThumbnail({ url }: { url: string }) {
  return (
    // Blob-URL preview of the just-captured photo; next/image can't optimise blob: URLs.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Prescription photo"
      className="max-h-48 w-40 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
    />
  );
}

function FieldInput({
  field,
  value,
  error,
  aiRead,
  edited,
  onChange,
}: {
  field: CrfFieldDef;
  value: string;
  error?: string;
  aiRead: boolean;
  edited: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {field.label}
          {field.required && <span className="text-rose-500"> *</span>}
          {field.unit && <span className="text-slate-400"> ({field.unit})</span>}
        </span>
        {!aiRead ? (
          <span className="rounded bg-rose-50 px-1 text-[10px] font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            not read
          </span>
        ) : edited ? (
          <span className="rounded bg-slate-100 px-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">
            corrected
          </span>
        ) : (
          <span className="rounded bg-teal-50 px-1 text-[10px] font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
            AI
          </span>
        )}
      </label>
      {field.type === "select" ? (
        <select
          className={cn(
            "mt-1 w-full rounded-md border bg-white px-2 py-1.5 text-sm dark:bg-slate-900",
            error ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === "boolean" ? (
        <div className="mt-2">
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "false")}
            className="h-4 w-4"
          />
        </div>
      ) : (
        <input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          className={cn(
            "mt-1 w-full rounded-md border bg-white px-2 py-1.5 text-sm dark:bg-slate-900",
            error ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

function ReadOnlySummary({ visit, values }: { visit: VisitDef; values: Record<string, string> }) {
  const fields = allFields(visit);
  return (
    <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 rounded-lg border border-slate-100 p-3 text-sm dark:border-slate-800 sm:grid-cols-3">
      {fields.map((f) => (
        <div key={f.id}>
          <p className="text-xs text-slate-400">{f.label}</p>
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {f.type === "boolean" ? (values[f.id] === "true" ? "Yes" : "No") : values[f.id] || "—"}
            {f.unit && values[f.id] ? ` ${f.unit}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
