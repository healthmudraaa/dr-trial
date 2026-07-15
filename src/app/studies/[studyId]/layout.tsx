import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveSyncBadge } from "@/components/ui/SyncBadge";
import { getStudyBundle } from "@/lib/studies";

export default async function StudyInvestigatorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studyId: string }>;
}) {
  const { studyId } = await params;
  const bundle = getStudyBundle(studyId);
  if (!bundle) notFound();
  const { study, investigators } = bundle;
  const currentInvestigator = investigators[0]; // demo: first investigator on the roster is "logged in"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-400">
              <Link href="/studies">DR Trial</Link>
            </p>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{study.name}</h1>
          </div>
          <LiveSyncBadge timezone={study.timezone} locale={study.locale} />
          <div className="text-right text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{currentInvestigator?.name}</p>
            <p>
              {currentInvestigator?.siteCode} · {currentInvestigator?.city}
            </p>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-4 pb-2">
          <NavLink href={`/studies/${studyId}/dashboard`}>Dashboard</NavLink>
          <NavLink href={`/studies/${studyId}/patients`}>Patients</NavLink>
          <NavLink href={`/studies/${studyId}/ops/roster`}>Ops</NavLink>
          <NavLink href={`/studies/${studyId}/admin`}>Admin</NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {children}
    </Link>
  );
}
