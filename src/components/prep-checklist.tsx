import { Button, Card, Input } from "@/components/ui";
import {
  addPrepTaskAction,
  deletePrepTaskAction,
  seedPrepTasksAction,
  togglePrepTaskAction,
} from "@/app/(app)/prep-actions";
import type { PrepRole } from "@/lib/checklists";

export type PrepTask = { id: string; label: string; done: boolean };

/**
 * Preparation checklist ("action plan") for a course week (planner) or a
 * course session (teacher). Starts empty: one click loads the standard plan,
 * then items can be ticked off, added or removed as the week is prepared.
 */
export function PrepChecklist({
  role,
  weekId,
  sessionId,
  title,
  intro,
  tasks,
}: {
  role: PrepRole;
  weekId?: string;
  sessionId?: string;
  title: string;
  intro: string;
  tasks: PrepTask[];
}) {
  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const scopeInputs = (
    <>
      <input type="hidden" name="role" value={role} />
      {weekId && <input type="hidden" name="week_id" value={weekId} />}
      {sessionId && <input type="hidden" name="session_id" value={sessionId} />}
    </>
  );

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
        {tasks.length > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              done === tasks.length
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            {done === tasks.length ? "All done 🎉" : `${done}/${tasks.length} done`}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{intro}</p>

      {tasks.length > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {tasks.length === 0 ? (
        <form action={seedPrepTasksAction} className="mt-4">
          {scopeInputs}
          <Button type="submit">Load the standard action plan</Button>
        </form>
      ) : (
        <ul className="mt-4 space-y-1">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
            >
              <form action={togglePrepTaskAction} className="contents">
                {scopeInputs}
                <input type="hidden" name="task_id" value={t.id} />
                <input type="hidden" name="done" value={t.done ? "0" : "1"} />
                <button
                  type="submit"
                  aria-label={t.done ? `Mark "${t.label}" as not done` : `Mark "${t.label}" as done`}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                    t.done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-neutral-300 bg-white text-transparent hover:border-emerald-400 dark:border-neutral-600 dark:bg-neutral-900"
                  }`}
                >
                  ✓
                </button>
              </form>
              <span
                className={`flex-1 text-sm ${
                  t.done
                    ? "text-neutral-400 line-through dark:text-neutral-500"
                    : "text-neutral-800 dark:text-neutral-200"
                }`}
              >
                {t.label}
              </span>
              <form action={deletePrepTaskAction} className="contents">
                {scopeInputs}
                <input type="hidden" name="task_id" value={t.id} />
                <button
                  type="submit"
                  aria-label={`Remove "${t.label}"`}
                  className="invisible shrink-0 rounded px-1 text-sm text-neutral-400 hover:text-red-500 group-hover:visible"
                >
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {tasks.length > 0 && (
        <form action={addPrepTaskAction} className="mt-3 flex gap-2">
          {scopeInputs}
          <Input name="label" placeholder="Add your own item…" aria-label="New checklist item" />
          <Button type="submit" variant="ghost">
            Add
          </Button>
        </form>
      )}
    </Card>
  );
}
