"use client";

// Lightweight SVG charts following the dataviz method: one axis, thin marks,
// 4px rounded data-ends, recessive grid, muted text tokens for all labels
// (series color never colors text), per-mark hover tooltips, categorical hues
// in fixed order (validated: #0d9488 → #d97706 → #7c3aed, light+dark pass).

import { useState } from "react";

export const CATEGORICAL = ["#0d9488", "#d97706", "#7c3aed"]; // fixed order, never cycled
export const SEQUENTIAL = "#0d9488";

const AXIS_TEXT = "fill-slate-400 text-[10px]";
const INK_TEXT = "fill-slate-600 dark:fill-slate-300 text-[10px] font-semibold";

export function TrajectoryChart({
  points,
  target,
  height = 180,
}: {
  points: { week: string; cumulative: number }[];
  target?: number;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 560;
  const pad = { l: 34, r: 12, t: 12, b: 22 };
  if (points.length < 2) return <p className="text-sm text-slate-400">Not enough data yet.</p>;
  const maxY = Math.max(target ?? 0, ...points.map((p) => p.cumulative)) * 1.1;
  const x = (i: number) => pad.l + (i / (points.length - 1)) * (width - pad.l - pad.r);
  const y = (v: number) => height - pad.b - (v / maxY) * (height - pad.t - pad.b);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.cumulative).toFixed(1)}`).join(" ");
  const gridVals = [0.25, 0.5, 0.75, 1].map((f) => Math.round(maxY * f));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Cumulative enrolment over time">
      {gridVals.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={width - pad.r} y1={y(v)} y2={y(v)} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth={1} />
          <text x={pad.l - 4} y={y(v) + 3} textAnchor="end" className={AXIS_TEXT}>
            {v}
          </text>
        </g>
      ))}
      {target !== undefined && (
        <g>
          <line
            x1={pad.l}
            x2={width - pad.r}
            y1={y(target)}
            y2={y(target)}
            className="stroke-slate-300 dark:stroke-slate-600"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <text x={width - pad.r} y={y(target) - 4} textAnchor="end" className={INK_TEXT}>
            target {target}
          </text>
        </g>
      )}
      <path d={path} fill="none" stroke={SEQUENTIAL} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={p.week}>
          {/* generous invisible hit target */}
          <rect
            x={x(i) - width / points.length / 2}
            y={pad.t}
            width={width / points.length}
            height={height - pad.t - pad.b}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <title>{`${p.week}: ${p.cumulative} enrolled`}</title>
          </rect>
          {(hover === i || i === points.length - 1) && (
            <>
              <circle cx={x(i)} cy={y(p.cumulative)} r={4} fill={SEQUENTIAL} className="stroke-white dark:stroke-slate-900" strokeWidth={2} />
              <text x={x(i)} y={y(p.cumulative) - 8} textAnchor="middle" className={INK_TEXT}>
                {p.cumulative}
              </text>
            </>
          )}
        </g>
      ))}
      <text x={pad.l} y={height - 6} className={AXIS_TEXT}>
        {points[0].week}
      </text>
      <text x={width - pad.r} y={height - 6} textAnchor="end" className={AXIS_TEXT}>
        {points[points.length - 1].week}
      </text>
    </svg>
  );
}

export function HBars({
  rows,
  colorByIndex = false,
  maxOverride,
}: {
  rows: { label: string; value: number; detail?: string }[];
  colorByIndex?: boolean; // categorical identity (fixed order); default single sequential hue
  maxOverride?: number;
}) {
  const max = Math.max(maxOverride ?? 0, ...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.label} className="grid grid-cols-[110px_1fr_44px] items-center gap-2" title={r.detail ?? `${r.label}: ${r.value}`}>
          <span className="truncate text-xs text-slate-500 dark:text-slate-400">{r.label}</span>
          <div className="h-3.5 overflow-hidden rounded-r-[4px] bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-r-[4px]"
              style={{
                width: `${(r.value / max) * 100}%`,
                background: colorByIndex ? CATEGORICAL[i % CATEGORICAL.length] : SEQUENTIAL,
              }}
            />
          </div>
          <span className="text-right text-xs font-semibold text-slate-700 tabular-nums dark:text-slate-200">
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}
