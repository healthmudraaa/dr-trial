import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { STUDIES } from "@/lib/studies";

export default function StudiesPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-400">DR Trial</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Studies</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every study is defined by configuration — visits, fields, validation, currency, and compliance ruleset —
          rendered by the same platform.
        </p>

        <div className="mt-6 space-y-3">
          {STUDIES.map((study) => (
            <Card key={study.studyId}>
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{study.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {study.therapeuticArea} · {study.visits.length} visits · {study.currencySymbol}
                    {study.ratePerCompletedPatient} per completed patient · {study.timezone}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/studies/${study.studyId}/dashboard`}
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                  >
                    Investigator view
                  </Link>
                  <Link
                    href={`/studies/${study.studyId}/ops/roster`}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Ops view
                  </Link>
                  <Link
                    href={`/studies/${study.studyId}/admin`}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Admin
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
