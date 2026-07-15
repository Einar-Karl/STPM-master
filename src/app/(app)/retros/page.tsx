import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { channelLabel, formatDateRange } from "@/lib/planner";
import { AiPanel } from "@/components/ai-panel";
import { askRetroAiAction } from "./actions";

const DUE_WINDOW_DAYS = 30;

export default async function RetrosPage() {
  await requireStaff();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const windowStart = new Date(new Date(`${today}T00:00:00Z`).getTime() - DUE_WINDOW_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const [{ data: weeks }, { data: retros }] = await Promise.all([
    supabase
      .from("course_weeks")
      .select("id, start_date, end_date, location, channel")
      .order("start_date", { ascending: false }),
    supabase.from("week_retros").select("*").order("created_at", { ascending: false }),
  ]);

  const weekById = new Map((weeks ?? []).map((w) => [w.id, w] as const));
  const retroWeekIds = new Set((retros ?? []).map((r) => r.week_id));

  // Weeks that finished recently and have no retro yet — the "do this now" list.
  const due = (weeks ?? []).filter(
    (w) => w.end_date < today && w.end_date >= windowStart && !retroWeekIds.has(w.id)
  );

  // Group entries by week, newest week first.
  const grouped = new Map<string, typeof retros>();
  for (const r of retros ?? []) {
    const list = grouped.get(r.week_id) ?? [];
    list.push(r);
    grouped.set(r.week_id, list);
  }
  const groupedEntries = [...grouped.entries()].sort((a, b) => {
    const wa = weekById.get(a[0])?.start_date ?? "";
    const wb = weekById.get(b[0])?.start_date ?? "";
    return wb.localeCompare(wa);
  });

  return (
    <>
      <PageHeader
        title="Retros"
        description="What went well and what could be better, week by week — and what to change because of it."
      />

      {due.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
          <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {due.length} recent week{due.length > 1 ? "s" : ""} still missing a retro
          </h2>
          <ul className="mt-2 space-y-1">
            {due.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/weeks/${w.id}?view=retro`}
                  className="text-sm font-medium text-amber-800 hover:underline dark:text-amber-300"
                >
                  {formatDateRange(w.start_date, w.end_date)} · {w.location} · {channelLabel(w.channel)} →
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          ✨ What should we change?
        </h2>
        <AiPanel
          action={askRetroAiAction}
          buttonLabel="Summarize into suggestions"
          placeholder="Optional: ask something specific — e.g. what keeps going wrong with accommodation?"
          intro="Reads every retro entry, finds the recurring themes and proposes concrete changes to the courses and setup."
        />
      </Card>

      {groupedEntries.length ? (
        <div className="space-y-4">
          {groupedEntries.map(([weekId, entries]) => {
            const w = weekById.get(weekId);
            const ratings = (entries ?? []).map((e) => e.rating).filter((r): r is number => r != null);
            const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
            return (
              <Card key={weekId}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={w ? `/weeks/${w.id}?view=retro` : "/weeks"}
                    className="text-sm font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
                  >
                    {w
                      ? `${formatDateRange(w.start_date, w.end_date)} · ${w.location} · ${channelLabel(w.channel)}`
                      : "Unknown week"}
                  </Link>
                  {avg && <span className="text-sm text-amber-500">★ {avg}/5</span>}
                </div>
                <div className="space-y-3">
                  {(entries ?? []).map((r) => (
                    <div key={r.id} className="border-l-2 border-neutral-200 pl-3 dark:border-neutral-800">
                      {r.went_well && (
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">Went well:</span>{" "}
                          {r.went_well}
                        </p>
                      )}
                      {r.could_improve && (
                        <p className="mt-0.5 text-sm text-neutral-700 dark:text-neutral-300">
                          <span className="font-medium text-amber-700 dark:text-amber-400">Could improve:</span>{" "}
                          {r.could_improve}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {new Date(r.created_at).toLocaleDateString("en-GB")}
                        {r.rating ? ` · ${"★".repeat(r.rating)}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState>
            No retro entries yet. Open a finished week and use its <strong>Retro</strong> tab to add the first one.
          </EmptyState>
        </Card>
      )}
    </>
  );
}
