"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LiveSyncBadge } from "@/components/ui/SyncBadge";
import { getSession, signOut, type Role, type Session } from "@/lib/session";
import { getStudy } from "@/lib/studies";
import { cn } from "@/lib/cn";

const ROLE_LABEL: Record<Role, string> = {
  dr: "Investigator",
  ops: "Ops · CRO",
  admin: "Study Admin",
  sponsor: "Sponsor",
  client: "Client",
};

export interface NavItem {
  href: string;
  label: string;
}

// One shell for every portal: session guard (redirects to the portal's login),
// role-scoped header, and either a top-nav (mobile-first doctor portal) or a
// desktop sidebar (staff portals). No cross-role navigation ever renders here.
export function PortalShell({
  role,
  studyId,
  nav,
  variant,
  children,
}: {
  role: Role;
  studyId: string;
  nav: NavItem[];
  variant: "topnav" | "sidebar";
  children: React.ReactNode;
}) {
  const study = getStudy(studyId);
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname?.endsWith("/login") ?? false;
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const s = getSession(role, studyId);
    setSession(s);
    setChecked(true);
    if (!s && !isLogin) router.replace(`/${role}/${studyId}/login`);
  }, [role, studyId, isLogin, pathname, router]);

  if (!study) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950">
        Study not found.
      </div>
    );
  }

  if (isLogin) return <>{children}</>;

  if (!checked || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950">
        <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-400">DR Trial</p>
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  const header = (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/75">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-sm font-bold text-white shadow-sm shadow-teal-700/30">
            DR
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-400">
              DR Trial · {ROLE_LABEL[role]}
            </p>
            <h1 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">{study.name}</h1>
          </div>
        </div>
        <LiveSyncBadge timezone={study.timezone} locale={study.locale} />
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{session.name}</p>
            <p>{ROLE_LABEL[role]}</p>
          </div>
          <button
            onClick={() => {
              signOut(role, studyId);
              router.replace(`/${role}/${studyId}/login`);
            }}
            className="rounded-xl border border-slate-200 bg-white/60 px-2.5 py-1.5 text-xs font-medium text-slate-500 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </div>
      {variant === "topnav" && (
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} active={pathname?.startsWith(item.href) ?? false} />
          ))}
        </nav>
      )}
      {variant === "sidebar" && (
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} active={pathname?.startsWith(item.href) ?? false} />
          ))}
        </nav>
      )}
    </header>
  );

  if (variant === "topnav") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {header}
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {header}
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-52 shrink-0 md:block">
          <nav className="sticky top-6 space-y-1">
            {nav.map((item) => {
              const active = pathname?.startsWith(item.href) ?? false;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-xl px-3 py-2 text-sm font-medium",
                    active
                      ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm shadow-teal-700/25"
                      : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "rounded-xl px-3 py-1.5 text-sm font-medium whitespace-nowrap",
        active
          ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm shadow-teal-700/25"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      )}
    >
      {item.label}
    </Link>
  );
}
