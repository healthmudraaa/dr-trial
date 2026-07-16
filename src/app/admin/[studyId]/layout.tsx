import { notFound } from "next/navigation";
import { LiveSyncBadge } from "@/components/ui/SyncBadge";
import { getStudyBundle } from "@/lib/studies";

// Study Admin portal — its own URL space (/admin/[studyId]) with no navigation
// into the Doctor or Ops portals.
export default async function AdminPortalLayout({
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
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-400">
              DR Trial · Study Admin
            </p>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{study.name}</h1>
          </div>
          <LiveSyncBadge timezone={study.timezone} locale={study.locale} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
