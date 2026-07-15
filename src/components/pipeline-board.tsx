"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { SALES_STAGES, type SalesStage } from "@/lib/sales";

export type BoardLead = {
  id: string;
  name: string;
  org_type: string;
  municipality: string | null;
  email: string | null;
  stage: SalesStage;
};

const STAGE_ACCENT: Record<SalesStage, string> = {
  new: "border-t-neutral-400",
  contacted: "border-t-sky-500",
  interested: "border-t-violet-500",
  negotiating: "border-t-amber-500",
  won: "border-t-emerald-500",
  lost: "border-t-red-400",
};

/**
 * Kanban view of the sales pipeline. Drag a card between columns (or use the
 * card's stage menu on touch devices) to move a lead; persistence goes through
 * the setLeadStageAction server action with an optimistic update.
 */
export function PipelineBoard({
  leads,
  onMove,
}: {
  leads: BoardLead[];
  onMove: (leadId: string, stage: SalesStage) => Promise<void>;
}) {
  const [, startTransition] = useTransition();
  const [optimisticLeads, applyMove] = useOptimistic(
    leads,
    (state, move: { id: string; stage: SalesStage }) =>
      state.map((l) => (l.id === move.id ? { ...l, stage: move.stage } : l))
  );
  const [dragOver, setDragOver] = useState<SalesStage | null>(null);

  function moveLead(id: string, stage: SalesStage) {
    startTransition(async () => {
      applyMove({ id, stage });
      await onMove(id, stage);
    });
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[900px] gap-3">
        {SALES_STAGES.map((stage) => {
          const column = optimisticLeads.filter((l) => l.stage === stage.value);
          return (
            <div
              key={stage.value}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(stage.value);
              }}
              onDragLeave={() => setDragOver((s) => (s === stage.value ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData("text/lead-id");
                if (id) moveLead(id, stage.value);
              }}
              className={`flex w-52 shrink-0 flex-col rounded-lg border bg-neutral-50 dark:bg-neutral-900/60 ${
                dragOver === stage.value
                  ? "border-neutral-400 dark:border-neutral-500"
                  : "border-neutral-200 dark:border-neutral-800"
              }`}
            >
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {stage.label}
                </p>
                <span className="rounded-full bg-neutral-200 px-1.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {column.length}
                </span>
              </div>
              <div className="flex-1 space-y-2 px-2 pb-2">
                {column.map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/lead-id", l.id)}
                    className={`cursor-grab rounded-md border border-t-2 border-neutral-200 bg-white p-2.5 shadow-sm active:cursor-grabbing dark:border-neutral-800 dark:bg-neutral-900 ${STAGE_ACCENT[l.stage]}`}
                  >
                    <Link href={`/sales/${l.id}`} className="block text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100">
                      {l.name}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {l.municipality ?? "—"} · {l.org_type === "kindergarten" ? "Kindergarten" : "School"}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-1">
                      <span className={`text-[10px] font-medium ${l.email ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {l.email ? "✉ email on file" : "✉ missing email"}
                      </span>
                      <select
                        value={l.stage}
                        onChange={(e) => moveLead(l.id, e.target.value as SalesStage)}
                        aria-label={`Stage for ${l.name}`}
                        className="rounded border border-neutral-200 bg-transparent px-1 py-0.5 text-[10px] text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
                      >
                        {SALES_STAGES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {column.length === 0 && (
                  <p className="px-1 py-3 text-center text-xs text-neutral-400 dark:text-neutral-600">
                    Drop here
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
