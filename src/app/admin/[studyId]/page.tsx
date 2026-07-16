"use client";

// Study Admin: per-study configuration (rate, currency, timezone, locale,
// compliance ruleset — plan §6 country-readiness) plus the visit/CRF schema
// that drives every form on the platform. Settings persist and immediately
// change payout math and formatting everywhere.

import { use, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { getStudy } from "@/lib/studies";
import { updateStudySettings, resetDemoData, useDb } from "@/lib/store";

const inputClass =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950";

export default function StudyAdminPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = use(params);
  const study = getStudy(studyId);
  const db = useDb();
  const effective = useMemo(
    () => ({
      ratePerCompletedPatient: db.settings[studyId]?.ratePerCompletedPatient ?? study?.ratePerCompletedPatient ?? 0,
      currency: db.settings[studyId]?.currency ?? study?.currency ?? "",
      currencySymbol: db.settings[studyId]?.currencySymbol ?? study?.currencySymbol ?? "",
      timezone: db.settings[studyId]?.timezone ?? study?.timezone ?? "",
      locale: db.settings[studyId]?.locale ?? study?.locale ?? "",
      complianceRulesetId: db.settings[studyId]?.complianceRulesetId ?? study?.complianceRulesetId ?? "",
    }),
    [db.settings, study, studyId]
  );
  const [values, setValues] = useState(effective);
  const [saved, setSaved] = useState(false);
  if (!study) return null;

  function update<K extends keyof typeof values>(key: K, v: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{study.name}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {study.therapeuticArea} · {study.studyId}
        </p>
      </div>

      <Card>
        <CardHeader
          title="Study settings"
          subtitle="Saving updates payout math and currency/locale formatting across every portal instantly"
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs text-slate-500 dark:text-slate-400">Rate per completed patient</span>
              <input
                className={inputClass}
                type="number"
                value={values.ratePerCompletedPatient}
                onChange={(e) => update("ratePerCompletedPatient", Number(e.target.value))}
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 dark:text-slate-400">Currency (ISO)</span>
              <input className={inputClass} value={values.currency} onChange={(e) => update("currency", e.target.value.toUpperCase())} />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 dark:text-slate-400">Currency symbol</span>
              <input className={inputClass} value={values.currencySymbol} onChange={(e) => update("currencySymbol", e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 dark:text-slate-400">Timezone</span>
              <input className={inputClass} value={values.timezone} onChange={(e) => update("timezone", e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 dark:text-slate-400">Locale</span>
              <input className={inputClass} value={values.locale} onChange={(e) => update("locale", e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 dark:text-slate-400">Compliance ruleset</span>
              <input
                className={inputClass}
                value={values.complianceRulesetId}
                onChange={(e) => update("complianceRulesetId", e.target.value)}
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                updateStudySettings(studyId, values);
                setSaved(true);
              }}
            >
              Save settings
            </Button>
            {saved && <StatusChip tone="good">Saved — live across all portals</StatusChip>}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Visit & CRF schema"
          subtitle="Schema-driven: these definitions render every capture form, validation rule, and QC view. Visual schema authoring is the next Study Builder milestone."
        />
        <CardBody className="space-y-5">
          {study.visits.map((visit) => (
            <div key={visit.id}>
              <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {visit.label}
                {visit.offsetDaysFromBaseline !== undefined && visit.offsetDaysFromBaseline > 0 && (
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    ~{visit.offsetDaysFromBaseline} days from baseline
                  </span>
                )}
              </p>
              <div className="space-y-3">
                {visit.sections.map((section) => (
                  <div key={section.id} className="overflow-x-auto rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                    <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                      {section.title}
                    </p>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-400">
                          <th className="pb-1 font-medium">Field</th>
                          <th className="pb-1 font-medium">Type</th>
                          <th className="pb-1 font-medium">Unit</th>
                          <th className="pb-1 font-medium">Range / options</th>
                          <th className="pb-1 font-medium">Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.fields.map((f) => (
                          <tr key={f.id} className="border-t border-slate-100 dark:border-slate-800">
                            <td className="py-1.5 font-medium text-slate-700 dark:text-slate-200">{f.label}</td>
                            <td className="py-1.5 text-slate-500 dark:text-slate-400">{f.type}</td>
                            <td className="py-1.5 text-slate-500 dark:text-slate-400">{f.unit ?? "—"}</td>
                            <td className="py-1.5 text-slate-500 dark:text-slate-400">
                              {f.options
                                ? f.options.join(", ")
                                : f.min !== undefined || f.max !== undefined
                                  ? `${f.min ?? "–"}–${f.max ?? "–"}`
                                  : "—"}
                            </td>
                            <td className="py-1.5 text-slate-500 dark:text-slate-400">{f.required ? "Yes" : "No"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Demo data" subtitle="Reset the demo database back to its seeded state" />
        <CardBody>
          <Button variant="secondary" onClick={() => resetDemoData()}>
            Reset demo data
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
