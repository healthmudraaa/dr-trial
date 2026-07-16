"use client";

import { useState } from "react";
import Link from "next/link";

// One share-able role link with a copy button — used on the internal /studies
// directory so the CRO team can hand each user their own portal link.
export function CopyLinkRow({ role, description, path }: { role: string; description: string; path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (e.g. non-secure context) — the visible link still works
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{role}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        <Link href={path} className="font-mono text-xs break-all text-teal-700 hover:underline dark:text-teal-400">
          {path}
        </Link>
      </div>
      <button
        onClick={copy}
        className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
