import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveSyncBadge } from "@/components/ui/SyncBadge";
import { getStudyBundle } from "@/lib/studies";

export default async function OpsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studyId: string }>;
}) {
  const { studyId } = await params;
  const bundle = getStudyBundle(studyId);
  if (!bundle) notFound();
  const { study } = bundle;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-400">
              DR Trial · Ops
            </p>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{study.name}</h1>
          </div>
          <LiveSyncBadge timezone={study.timezone} locale={study.locale} />
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 pb-2">
          <NavLink href={`/ops/${studyId}/roster`}>Roster</NavLink>
          <NavLink href={`/ops/${studyId}/queue`}>Action queue</NavLink>
          <NavLink href={`/ops/${studyId}/payouts`}>Payouts</NavLink>
          <NavLink href={`/ops/${studyId}/reminders`}>Reminders</NavLink>
          <NavLink href={`/ops/${studyId}/queries`}>Data queries</NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
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
