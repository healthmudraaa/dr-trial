"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CaptureSyncBadge, type CaptureSyncState } from "@/components/ui/SyncBadge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { CrfFieldDef, FieldValue, VisitDef } from "@/lib/types";

// Generic, schema-driven capture engine implementing FR-10–FR-15: capture → validate
// against protocol within seconds → instant notify on missing/out-of-range fields →
// recapture supersedes (prior kept for audit) → final save locks the record.
//
// This renders ANY visit's fields from its VisitDef — the same component validates
// TOLERATE-HF's potassium range and diabetes-poc's HbA1c range with zero per-study
// branching. Field-level validation replaces the earlier prototype's hardcoded
// OCR-simulation fixture, since real digitization is per-field ML behavior that
// can't be meaningfully generalized here — the FR-12/13/14/15 state machine is what
// this demonstrates, not photo capture itself.

type Step = "editing" | "validating" | "review" | "locked";

function allFields(visit: VisitDef): CrfFieldDef[] {
  return visit.sections.flatMap((s) => s.fields);
}

function toInputValue(v: FieldValue | undefined): string {
  if (v === undefined) return "";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

export function CaptureFlow({
  patientId,
  visit,
  initialData,
}: {
  patientId: string;
  visit: VisitDef;
  initialData?: Record<string, FieldValue>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of allFields(visit)) {
      initial[f.id] = toInputValue(initialData?.[f.id]);
    }
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>("editing");
  const [attempt, setAttempt] = useState(0);
  const [auditLog, setAuditLog] = useState<string[]>([]);

  const syncState: CaptureSyncState = step === "validating" ? "saving" : step === "locked" ? "saved" : "idle";

  function setValue(fieldId: string, v: string) {
    setValues((prev) => ({ ...prev, [fieldId]: v }));
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    for (const f of allFields(visit)) {
      const raw = values[f.id];
      if (f.type === "boolean") continue; // checkbox — nothing to validate
      if (f.required && (raw === undefined || raw === "")) {
        next[f.id] = "Required";
        continue;
      }
      if (f.type === "number" && raw !== undefined && raw !== "") {
        const num = Number(raw);
        if (Number.isNaN(num)) {
          next[f.id] = "Must be a number";
        } else if (f.min !== undefined && num < f.min) {
          next[f.id] = `Below protocol range (min ${f.min}${f.unit ? ` ${f.unit}` : ""})`;
        } else if (f.max !== undefined && num > f.max) {
          next[f.id] = `Above protocol range (max ${f.max}${f.unit ? ` ${f.unit}` : ""})`;
        }
      }
    }
    return next;
  }

  function submit() {
    setStep("validating");
    setAttempt((a) => a + 1);
    setTimeout(() => {
      const result = validate();
      if (Object.keys(result).length > 0) {
        setErrors(result);
        setStep("editing");
        setAuditLog((log) => [
          ...log,
          `Attempt ${attempt + 1} · ${new Date().toLocaleTimeString()} · flagged ${Object.keys(result).length} field(s): ${Object.keys(result).join(", ")} — not saved`,
        ]);
      } else {
        setErrors({});
        setStep("review");
        setAuditLog((log) => [...log, `Attempt ${attempt + 1} · ${new Date().toLocaleTimeString()} · validated against protocol, no flags`]);
      }
    }, 1200); // simulated "within seconds" validation — FR-12
  }

  function lockRecord() {
    setStep("locked");
    setAuditLog((log) => [...log, `Locked · ${new Date().toLocaleTimeString()} · edits now require an ops-approved data query (FR-15)`]);
  }

  return (
    <Card>
      <CardHeader
        title={`${visit.label} — data capture`}
        subtitle={`Patient ${patientId}`}
        action={<CaptureSyncBadge state={syncState} />}
      />
      <CardBody className="space-y-4">
        {(step === "editing" || step === "validating") && (
          <div className="space-y-4">
            {visit.sections.map((section) => (
              <div key={section.id}>
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  {section.title}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {section.fields.map((f) => (
                    <FieldInput
                      key={f.id}
                      field={f}
                      value={values[f.id] ?? ""}
                      error={errors[f.id]}
                      disabled={step === "validating"}
                      onChange={(v) => setValue(f.id, v)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {step === "validating" ? (
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                Validating against protocol…
              </div>
            ) : (
              <Button onClick={submit}>Validate &amp; save</Button>
            )}
            {Object.keys(errors).length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
                {Object.keys(errors).length} field(s) need attention before this capture can be saved.
              </div>
            )}
          </div>
        )}

        {step === "review" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
              Validated against protocol — no mandatory fields missing, no out-of-range values.
            </div>
            <ReadOnlySummary visit={visit} values={values} />
            <Button onClick={lockRecord}>Save &amp; lock record</Button>
          </div>
        )}

        {step === "locked" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              Record locked. Further edits require a data query routed to Ops (FR-15).
            </div>
            <ReadOnlySummary visit={visit} values={values} />
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

function FieldInput({
  field,
  value,
  error,
  disabled,
  onChange,
}: {
  field: CrfFieldDef;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-slate-500 dark:text-slate-400">
        {field.label}
        {field.required && <span className="text-rose-500"> *</span>}
        {field.unit && <span className="text-slate-400"> ({field.unit})</span>}
      </label>
      {field.type === "select" ? (
        <select
          className={cn(
            "mt-1 w-full rounded-md border bg-white px-2 py-1.5 text-sm dark:bg-slate-900",
            error ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
          )}
          value={value}
          disabled={disabled}
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
            disabled={disabled}
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
          disabled={disabled}
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
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 p-3 text-sm dark:border-slate-800 sm:grid-cols-4">
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
