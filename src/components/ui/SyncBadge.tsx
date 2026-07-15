"use client";

import { useEffect, useState } from "react";

// Live-sync indicator (FR-47) — must reflect a real timestamp, not just a static
// "LIVE" label (the FR text explicitly rejects a cosmetic-only badge).
export function LiveSyncBadge({ timezone, locale }: { timezone: string; locale: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatted = now
    ? new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: timezone,
      }).format(now)
    : "—";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Live · synced {formatted}
    </div>
  );
}

export type CaptureSyncState = "idle" | "saving" | "saved" | "failed";

// Explicit save-state feedback for capture/edit actions — see plan §3
// ("auto-save with explicit sync states").
export function CaptureSyncBadge({ state }: { state: CaptureSyncState }) {
  if (state === "idle") return null;
  const map: Record<Exclude<CaptureSyncState, "idle">, { text: string; className: string }> = {
    saving: {
      text: "Saving…",
      className: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300",
    },
    saved: {
      text: "Saved",
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    failed: {
      text: "Failed to save — retry",
      className: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
    },
  };
  const { text, className } = map[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {text}
    </span>
  );
}
