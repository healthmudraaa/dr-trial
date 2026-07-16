import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StudySettingsForm } from "@/components/admin/StudySettingsForm";
import { getStudyBundle } from "@/lib/studies";

export default async function StudyAdminPage({ params }: { params: Promise<{ studyId: string }> }) {
  const { studyId } = await params;
  const bundle = getStudyBundle(studyId);
  if (!bundle) notFound();
  const { study } = bundle;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{study.name}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{study.therapeuticArea} · {study.studyId}</p>
      </div>

      <Card>
        <CardHeader title="Study settings" subtitle="Rate, currency, timezone, locale, compliance ruleset" />
        <CardBody>
          <StudySettingsForm
            settings={{
              ratePerCompletedPatient: study.ratePerCompletedPatient,
              currency: study.currency,
              currencySymbol: study.currencySymbol,
              timezone: study.timezone,
              locale: study.locale,
              complianceRulesetId: study.complianceRulesetId,
            }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Visit & CRF schema"
          subtitle="Defined in config — this is what makes the platform generic across studies. Field editing here is planned for a future Study Builder pass."
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
                  <div key={section.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
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
                              {f.options ? f.options.join(", ") : f.min !== undefined || f.max !== undefined ? `${f.min ?? "–"}–${f.max ?? "–"}` : "—"}
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
    </div>
  );
}
