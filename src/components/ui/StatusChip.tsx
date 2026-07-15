import { cn } from "@/lib/cn";

export type ChipTone = "good" | "warn" | "bad" | "pending" | "info";

const TONE_CLASSES: Record<ChipTone, string> = {
  good: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  warn: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  bad: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300",
  info: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
};

const DOT_CLASSES: Record<ChipTone, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-rose-500",
  pending: "bg-slate-400",
  info: "bg-teal-500",
};

export function StatusChip({ tone, children }: { tone: ChipTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        TONE_CLASSES[tone]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASSES[tone])} />
      {children}
    </span>
  );
}

// Central mapping so every screen renders the same status the same way —
// this is the "one canonical status vocabulary" from plan §3.
export function visitStatusChip(status: "captured" | "due" | "overdue" | "missing_fields") {
  switch (status) {
    case "captured":
      return <StatusChip tone="good">Captured</StatusChip>;
    case "due":
      return <StatusChip tone="info">Due</StatusChip>;
    case "overdue":
      return <StatusChip tone="bad">Overdue</StatusChip>;
    case "missing_fields":
      return <StatusChip tone="warn">Missing fields</StatusChip>;
  }
}

export function paymentStatusChip(status: "paid" | "payable" | "blocked_docs" | "in_progress") {
  switch (status) {
    case "paid":
      return <StatusChip tone="good">Paid</StatusChip>;
    case "payable":
      return <StatusChip tone="warn">Payable</StatusChip>;
    case "blocked_docs":
      return <StatusChip tone="bad">Blocked — docs unsigned</StatusChip>;
    case "in_progress":
      return <StatusChip tone="pending">In progress</StatusChip>;
  }
}
