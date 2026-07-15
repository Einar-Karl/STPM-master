import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { channelLabel, formatDateRange } from "@/lib/planner";
import { WeekItinerary } from "@/components/week-itinerary";
import { Field, Textarea } from "@/components/ui";
import { addRetroAction, assignTeachersAction, updateDayPlanAction, updateWeekLocationAction } from "./actions";

export default async function WeekDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { view } = await searchParams;
  const activeView = view === "days" ? "days" : view === "retro" ? "retro" : "week";
  const supabase = await createClient();

  const { data: week } = await supabase.from("course_weeks").select("*").eq("id", id).single();
  if (!week) notFound();

  const [{ data: sessions }, { data: teachers }, { data: bookings }, { data: days }, { data: retros }] = await Promise.all([
    supabase
      .from("course_sessions")
      .select(
        "id, lead_teacher_id, support_teacher_id, capacity, courses(name), lead:lead_teacher_id(name), support:support_teacher_id(name)"
      )
      .eq("week_id", id),
    supabase.from("teachers").select("id, name, code, active").order("sort_order", { ascending: true }),
    supabase.from("course_bookings").select("session_id, status"),
    supabase.from("course_week_days").select("*").eq("week_id", id).order("day_date", { ascending: true }),
    supabase.from("week_retros").select("*").eq("week_id", id).order("created_at", { ascending: false }),
  ]);

  const activeTeachers = (teachers ?? []).filter((t) => t.active);

  // participant counts per session (exclude cancelled)
  const counts = new Map<string, number>();
  for (const b of bookings ?? []) {
    if (b.status === "cancelled") continue;
    counts.set(b.session_id, (counts.get(b.session_id) ?? 0) + 1);
  }

  const rows = (sessions ?? [])
    .map((s) => ({
      ...s,
      courseName: (s.courses as unknown as { name: string } | null)?.name ?? "—",
      leadName: (s.lead as unknown as { name: string } | null)?.name ?? null,
      supportName: (s.support as unknown as { name: string } | null)?.name ?? null,
      count: counts.get(s.id) ?? 0,
    }))
    .sort((a, b) => a.courseName.localeCompare(b.courseName));

  const itineraryCourses = rows.map((s) => ({
    name: s.courseName,
    lead: s.leadName,
    support: s.supportName,
    count: s.count,
  }));

  return (
    <>
      <Link href="/weeks" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        &larr; Back to course weeks
      </Link>
      <PageHeader
        title={`${formatDateRange(week.start_date, week.end_date)} · ${week.location}`}
        description={`${channelLabel(week.channel)} · ${rows.length} courses running this week`}
      />

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Location</h2>
        <form action={updateWeekLocationAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="week_id" value={week.id} />
          <div className="flex-1">
            <Input name="location" defaultValue={week.location} aria-label="Week location" />
          </div>
          <Button type="submit" variant="ghost">
            Update location
          </Button>
          <p className="w-full text-xs text-neutral-500 dark:text-neutral-400">
            Updates the week and every course session in it.
          </p>
        </form>
      </Card>

      <div className="flex gap-2">
        <Link
          href={`/weeks/${week.id}?view=week`}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            activeView === "week"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          Week plan
        </Link>
        <Link
          href={`/weeks/${week.id}?view=days`}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            activeView === "days"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          Day by day
        </Link>
        <Link
          href={`/weeks/${week.id}?view=retro`}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            activeView === "retro"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          Retro {retros?.length ? `(${retros.length})` : ""}
        </Link>
      </div>

      {activeView === "week" ? (
        rows.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Course</Th>
                <Th>Participants</Th>
                <Th>Lead teacher</Th>
                <Th>Support teacher</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <Td className="font-medium">
                    <Link href={`/sessions/${s.id}`} className="hover:underline">
                      {s.courseName}
                    </Link>
                  </Td>
                  <Td>
                    {s.count}
                    {s.capacity ? <span className="text-neutral-400"> / {s.capacity}</span> : null}
                  </Td>
                  <Td>
                    <form action={assignTeachersAction} id={`f-${s.id}`} className="contents">
                      <input type="hidden" name="session_id" value={s.id} />
                      <input type="hidden" name="week_id" value={week.id} />
                      <Select
                        name="lead_teacher_id"
                        defaultValue={s.lead_teacher_id ?? ""}
                        className="py-1 text-xs"
                      >
                        <option value="">— unassigned —</option>
                        {activeTeachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                            {t.code ? ` (${t.code})` : ""}
                          </option>
                        ))}
                      </Select>
                    </form>
                  </Td>
                  <Td>
                    <Select
                      form={`f-${s.id}`}
                      name="support_teacher_id"
                      defaultValue={s.support_teacher_id ?? ""}
                      className="py-1 text-xs"
                    >
                      <option value="">— none —</option>
                      {activeTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.code ? ` (${t.code})` : ""}
                        </option>
                      ))}
                    </Select>
                  </Td>
                  <Td>
                    <Button form={`f-${s.id}`} type="submit" variant="ghost" className="px-2 py-1 text-xs">
                      Save
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Card>
            <EmptyState>No course sessions scheduled for this week.</EmptyState>
          </Card>
        )
      ) : activeView === "days" ? (
        days?.length ? (
          <WeekItinerary
            week={{
              id: week.id,
              start_date: week.start_date,
              end_date: week.end_date,
              location: week.location,
              channel: week.channel,
            }}
            days={days.map((d) => ({ id: d.id, day_date: d.day_date, title: d.title, notes: d.notes }))}
            courses={itineraryCourses}
            updateDayPlanAction={updateDayPlanAction}
          />
        ) : (
          <Card>
            <EmptyState>No day-by-day plan yet.</EmptyState>
          </Card>
        )
      ) : (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              How did this week go?
            </h2>
            <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
              Everyone who worked the week can add their own entry. Entries feed the{" "}
              <Link href="/retros" className="underline">Retros</Link> page, where the AI turns them
              into improvement suggestions.
            </p>
            <form action={addRetroAction} className="space-y-3">
              <input type="hidden" name="week_id" value={week.id} />
              <Field label="What went well?" name="went_well">
                <Textarea name="went_well" rows={3} placeholder="Sessions, tours, group energy, logistics…" />
              </Field>
              <Field label="What could have gone better?" name="could_improve">
                <Textarea name="could_improve" rows={3} placeholder="Anything to fix before the next week runs." />
              </Field>
              <div className="max-w-48">
                <Field label="Overall rating" name="rating">
                  <Select name="rating" defaultValue="">
                    <option value="">— no rating —</option>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {"★".repeat(n)}{"☆".repeat(5 - n)} ({n}/5)
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Button type="submit">Save retro</Button>
            </form>
          </Card>

          {retros?.length ? (
            <div className="space-y-3">
              {retros.map((r) => (
                <Card key={r.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-neutral-400">
                      {new Date(r.created_at).toLocaleDateString("en-GB")}
                    </p>
                    {r.rating && (
                      <span className="text-sm text-amber-500">
                        {"★".repeat(r.rating)}
                        <span className="text-neutral-300 dark:text-neutral-600">{"★".repeat(5 - r.rating)}</span>
                      </span>
                    )}
                  </div>
                  {r.went_well && (
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">Went well:</span>{" "}
                      {r.went_well}
                    </p>
                  )}
                  {r.could_improve && (
                    <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                      <span className="font-medium text-amber-700 dark:text-amber-400">Could improve:</span>{" "}
                      {r.could_improve}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState>No retro entries for this week yet.</EmptyState>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
