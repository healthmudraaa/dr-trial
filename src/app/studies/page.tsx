import { Card, CardBody } from "@/components/ui/Card";
import { STUDIES } from "@/lib/studies";
import { CopyLinkRow } from "@/components/admin/CopyLinkRow";
import { DEMO_OTP, DEMO_STAFF } from "@/lib/session";

// Internal directory for the CRO team: every study with its per-role links.
// Each role gets its OWN link and its own login; share only the matching link.
export default function StudiesPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-400">DR Trial</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Studies — role links</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Internal page. Each role has its own link and login. Demo credentials — staff roles:{" "}
          <span className="font-mono">{DEMO_STAFF.email} / {DEMO_STAFF.password}</span> · doctor OTP:{" "}
          <span className="font-mono">{DEMO_OTP}</span>
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
                    description="Send to investigators — enrolment, AI capture, honoraria"
                    path={`/dr/${study.studyId}/dashboard`}
                  />
                  <CopyLinkRow
                    role="Ops / CRO team"
                    description="Roster, action queue, QC desk, payouts, reminders, audit"
                    path={`/ops/${study.studyId}/roster`}
                  />
                  <CopyLinkRow
                    role="Study Admin"
                    description="Study configuration and CRF schema"
                    path={`/admin/${study.studyId}`}
                  />
                  <CopyLinkRow
                    role="Sponsor"
                    description="De-identified live analytics — no PII, no spend"
                    path={`/sponsor/${study.studyId}`}
                  />
                  <CopyLinkRow
                    role="Client"
                    description="Full detail: analytics, investigators, patients, spend, exports"
                    path={`/client/${study.studyId}/overview`}
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
