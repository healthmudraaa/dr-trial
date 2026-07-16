"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import type { FieldValue, VisitDef } from "@/lib/types";

// The CRO QC department's queue: every doctor-submitted (locked) record waiting
// for review. QC either approves — which is what releases the patient toward
// payment — or raises a data query back to the investigator. Decisions here are
// local prototype state; a real build persists them via the shared status service.

export interface QcItem {
  patientId: string;
  investigatorName: string;
  visitId: string;
  capturedAt?: string;
  data: Record<string, FieldValue>;
}

type Decision = { kind: "approved" } | { kind: "query"; reason: string };

export function QcReviewList({ items, visits }: { items: QcItem[]; visits: VisitDef[] }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [queryDrafts, setQueryDrafts] = useState<Record<string, string>>({});
  const [draftOpen, setDraftOpen] = useState<Record<string, boolean>>({});

  const visitDef = (id: string) => visits.find((v) => v.id === id);
  const key = (item: QcItem) => `${item.patientId}-${item.visitId}`;

  const pendingCount = items.filter((i) => !decisions[key(i)]).length;

  return (
    <Card>
      <CardHeader
        title="QC review queue"
        subtitle={`${pendingCount} submission${pendingCount === 1 ? "" : "s"} awaiting review — approval releases the record toward payment`}
      />
      <CardBody className="space-y-3">
        {items.map((item) => {
          const k = key(item);
          const decision = decisions[k];
          const visit = visitDef(item.visitId);
          return (
            <div key={k} className="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {item.patientId} · {visit?.label ?? item.visitId}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.investigatorName} · submitted {item.capturedAt?.slice(0, 10) ?? "—"}
                  </p>
                </div>
                {!decision && <StatusChip tone="warn">Awaiting QC</StatusChip>}
                {decision?.kind === "approved" && <StatusChip tone="good">Approved — payment released</StatusChip>}
                {decision?.kind === "query" && <StatusChip tone="bad">Query sent to investigator</StatusChip>}
              </div>

              <div className="mb-3 flex flex-wrap items-start gap-4">
                <div className="flex h-28 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-center text-[10px] text-slate-400 dark:border-slate-700">
                  Rx photo
                  <br />
                  (on file)
                </div>
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {visit?.sections
                    .flatMap((s) => s.fields)
                    .map((f) => (
                      <div key={f.id}>
                        <p className="text-xs text-slate-400">{f.label}</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          {f.type === "boolean"
                            ? item.data[f.id]
                              ? "Yes"
                              : "No"
                            : `${item.data[f.id] ?? "—"}${f.unit && item.data[f.id] !== undefined ? ` ${f.unit}` : ""}`}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {!decision && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setDecisions((prev) => ({ ...prev, [k]: { kind: "approved" } }))}>
                      Approve — release for payment
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setDraftOpen((prev) => ({ ...prev, [k]: !prev[k] }))}
                    >
                      Raise data query
                    </Button>
                  </div>
                  {draftOpen[k] && (
                    <div className="flex flex-wrap items-end gap-2">
                      <textarea
                        className="min-h-16 w-full max-w-lg rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                        placeholder="Describe what the investigator needs to clarify or correct…"
                        value={queryDrafts[k] ?? ""}
                        onChange={(e) => setQueryDrafts((prev) => ({ ...prev, [k]: e.target.value }))}
                      />
                      <Button
                        disabled={!(queryDrafts[k] ?? "").trim()}
                        onClick={() =>
                          setDecisions((prev) => ({ ...prev, [k]: { kind: "query", reason: queryDrafts[k] } }))
                        }
                      >
                        Send query
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {decision?.kind === "query" && (
                <p className="text-xs text-slate-500 dark:text-slate-400">Query: {decision.reason}</p>
              )}
            </div>
          );
        })}
        {items.length === 0 && <p className="text-sm text-slate-400">No submissions awaiting QC.</p>}
      </CardBody>
    </Card>
  );
}
