export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className ?? ""}`}>
      <div className="h-full rounded-full bg-teal-600 dark:bg-teal-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
