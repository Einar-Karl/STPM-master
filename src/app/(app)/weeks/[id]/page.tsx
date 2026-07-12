import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { channelLabel, formatDateRange } from "@/lib/planner";
import { assignTeachersAction, updateDayPlanAction, updateWeekLocationAction } from "./actions";

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
  const activeView = view === "days" ? "days" : "week";
  const supabase = await createClient();

  const { data: week } = await supabase.from("course_weeks").select("*").eq("id", id).single();
  if (!week) notFound();

  const [{ data: sessions }, { data: teachers }, { data: bookings }, { data: days }] = await Promise.all([
    supabase
      .from("course_sessions")
      .select("id, lead_teacher_id, support_teacher_id, capacity, courses(name)")
      .eq("week_id", id),
    supabase.from("teachers").select("id, name, code, active").order("sort_order", { ascending: true }),
    supabase.from("course_bookings").select("session_id, status"),
    supabase.from("course_week_days").select("*").eq("week_id", id).order("day_date", { ascending: true }),
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
      count: counts.get(s.id) ?? 0,
    }))
    .sort((a, b) => a.courseName.localeCompare(b.courseName));

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
      ) : days?.length ? (
        <div className="space-y-3">
          {days.map((day) => (
            <Card key={day.id}>
              <form action={updateDayPlanAction} className="space-y-3">
                <input type="hidden" name="day_id" value={day.id} />
                <input type="hidden" name="week_id" value={week.id} />
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {new Date(`${day.day_date}T00:00:00Z`).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <Field label="Title" name="title">
                  <Input
                    name="title"
                    defaultValue={day.title ?? ""}
                    placeholder="e.g. Arrival day, Golden Circle tour, Course day 3"
                  />
                </Field>
                <Field label="Plan / notes" name="notes">
                  <Textarea name="notes" defaultValue={day.notes ?? ""} rows={2} />
                </Field>
                <Button type="submit" variant="ghost" className="px-2 py-1 text-xs">
                  Save
                </Button>
              </form>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState>No day-by-day plan yet.</EmptyState>
        </Card>
      )}
    </>
  );
}
