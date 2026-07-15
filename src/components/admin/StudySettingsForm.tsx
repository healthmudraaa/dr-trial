"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
export interface StudySettings {
  ratePerCompletedPatient: number;
  currency: string;
  currencySymbol: string;
  timezone: string;
  locale: string;
  complianceRulesetId: string;
}

// Simple, editable settings (plan §3 "Study Builder scope" decision: schema-driven
// engine + simple config viewer, not a full no-code builder). CRF field definitions
// stay config-file-authored for now — only these study-level settings are editable
// here, and only in local state (no persistence layer yet). Takes a plain settings
// object rather than the full StudyDefinition — its `classify` fn isn't serializable
// across the server/client boundary.
export function StudySettingsForm({ settings }: { settings: StudySettings }) {
  const [values, setValues] = useState(settings);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof typeof values>(key: K, v: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setSaved(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <LabeledInput label="Rate per completed patient">
          <input
            type="number"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={values.ratePerCompletedPatient}
            onChange={(e) => update("ratePerCompletedPatient", Number(e.target.value))}
          />
        </LabeledInput>
        <LabeledInput label="Currency">
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={values.currency}
            onChange={(e) => update("currency", e.target.value.toUpperCase())}
          />
        </LabeledInput>
        <LabeledInput label="Currency symbol">
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={values.currencySymbol}
            onChange={(e) => update("currencySymbol", e.target.value)}
          />
        </LabeledInput>
        <LabeledInput label="Timezone">
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={values.timezone}
            onChange={(e) => update("timezone", e.target.value)}
          />
        </LabeledInput>
        <LabeledInput label="Locale">
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={values.locale}
            onChange={(e) => update("locale", e.target.value)}
          />
        </LabeledInput>
        <LabeledInput label="Compliance ruleset">
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={values.complianceRulesetId}
            onChange={(e) => update("complianceRulesetId", e.target.value)}
          />
        </LabeledInput>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={() => setSaved(true)}>Save settings</Button>
        {saved && <StatusChip tone="good">Saved (demo — not yet persisted to a backend)</StatusChip>}
      </div>
    </div>
  );
}

function LabeledInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}
