import { Card, CardBody } from "@/components/ui/Card";
import { STUDIES } from "@/lib/studies";
import { CopyLinkRow } from "@/components/admin/CopyLinkRow";

// Internal directory for the CRO team: every study with its per-role links.
// Each role gets its OWN link to share — doctors never see this page or the
// other portals. Role login will enforce the boundary; today the separation
// is by URL space (/dr, /ops, /admin).
export default function StudiesPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-400">DR Trial</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Studies — role links</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Internal page. Each role has its own separate link — share only the matching link with each user.
        </p>

        <div className="mt-6 space-y-3">
          {STUDIES.map((study) => (
            <Card key={study.studyId}>
              <CardBody className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{study.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {study.therapeuticArea} · {study.visits.length} visits · {study.currencySymbol}
                    {study.ratePerCompletedPatient} per completed patient · {study.timezone}
                  </p>
                </div>
                <div className="space-y-2">
                  <CopyLinkRow
                    role="Doctor / Investigator"
                    description="Send to investigators — enrolment, capture, own dashboard"
                    path={`/dr/${study.studyId}/dashboard`}
                  />
                  <CopyLinkRow
                    role="Ops team"
                    description="Internal CRO staff — roster, action queue, payouts, reminders, queries"
                    path={`/ops/${study.studyId}/roster`}
                  />
                  <CopyLinkRow
                    role="Study Admin"
                    description="Study configuration — settings and CRF schema"
                    path={`/admin/${study.studyId}`}
                  />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
