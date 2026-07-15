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
import { WeekItinerary } from "@/components/week-itinerary";
import {
  addCourseToWeekAction,
  addRetroAction,
  assignTeachersAction,
  updateDayPlanAction,
  updateWeekLinksAction,
  updateWeekLocationAction,
} from "./actions";

const VIEWS = [
  { key: "week", label: "Week plan" },
  { key: "schedule", label: "Schedule grid" },
  { key: "days", label: "Day by day" },
  { key: "rooms", label: "Rooms & hotel" },
  { key: "retro", label: "Retro" },
] as const;

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
  const activeView = VIEWS.some((v) => v.key === view) ? (view as (typeof VIEWS)[number]["key"]) : "week";
  const supabase = await createClient();

  const { data: week } = await supabase.from("course_weeks").select("*").eq("id", id).single();
  if (!week) notFound();

  const [
    { data: sessions },
    { data: teachers },
    { data: bookings },
    { data: days },
    { data: hotelBookings },
    { data: sessionDays },
    { data: courses },
    { data: retros },
  ] = await Promise.all([
    supabase
      .from("course_sessions")
      .select(
        "id, lead_teacher_id, support_teacher_id, capacity, courses(name), lead:lead_teacher_id(name), support:support_teacher_id(name)",
      )
      .eq("week_id", id),
    supabase.from("teachers").select("id, name, code, active").order("sort_order", { ascending: true }),
    supabase.from("course_bookings").select("session_id, status, payment_status"),
    supabase.from("course_week_days").select("*").eq("week_id", id).order("day_date", { ascending: true }),
    supabase
      .from("hotel_bookings")
      .select(
        "id, guest_name, guests, check_in, check_out, status, hotels(name), hotel_rooms(name), course_sessions!inner(week_id)",
      )
      .eq("course_sessions.week_id", id)
      .order("check_in", { ascending: true }),
    supabase
      .from("course_session_days")
      .select("session_id, day_date, title, course_sessions!inner(week_id)")
      .eq("course_sessions.week_id", id)
      .order("day_date", { ascending: true }),
    supabase.from("courses").select("id, name").order("name", { ascending: true }),
    supabase.from("week_retros").select("*").eq("week_id", id).order("created_at", { ascending: false }),
  ]);

  const activeTeachers = (teachers ?? []).filter((t) => t.active);

  // participant + paid counts per session (exclude cancelled)
  const counts = new Map<string, number>();
  const paidCounts = new Map<string, number>();
  for (const b of bookings ?? []) {
    if (b.status === "cancelled") continue;
    counts.set(b.session_id, (counts.get(b.session_id) ?? 0) + 1);
    if ((b.payment_status ?? "").toUpperCase() === "PAID") {
      paidCounts.set(b.session_id, (paidCounts.get(b.session_id) ?? 0) + 1);
    }
  }

  const rows = (sessions ?? [])
    .map((s) => ({
      ...s,
      courseName: (s.courses as unknown as { name: string } | null)?.name ?? "—",
      leadName: (s.lead as unknown as { name: string } | null)?.name ?? null,
      supportName: (s.support as unknown as { name: string } | null)?.name ?? null,
      count: counts.get(s.id) ?? 0,
      paid: paidCounts.get(s.id) ?? 0,
    }))
    .sort((a, b) => a.courseName.localeCompare(b.courseName));

  const itineraryCourses = rows.map((s) => ({
    name: s.courseName,
    lead: s.leadName,
    support: s.supportName,
    count: s.count,
  }));

  const weekTotalParticipants = rows.reduce((sum, r) => sum + r.count, 0);
  const weekTotalPaid = rows.reduce((sum, r) => sum + r.paid, 0);

  // Schedule grid: unique seminar days (columns) × courses (rows), each cell the
  // day's focus/title from course_session_days.
  const scheduleDates = [...new Set((sessionDays ?? []).map((d) => d.day_date))].sort();
  const scheduleTitles = new Map<string, string | null>();
  for (const d of sessionDays ?? []) scheduleTitles.set(`${d.session_id}__${d.day_date}`, d.title);
  const dayLabel = (dateStr: string) =>
    new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      timeZone: "UTC",
    });

  const roomGroups = (() => {
    const map = new Map<
      string,
      { key: string; label: string; bookings: NonNullable<typeof hotelBookings> }
    >();
    for (const b of hotelBookings ?? []) {
      const hotel = (b.hotels as unknown as { name: string } | null)?.name ?? "Unknown hotel";
      const room = (b.hotel_rooms as unknown as { name: string } | null)?.name ?? "Unassigned room";
      const key = `${hotel}__${room}`;
      const group = map.get(key) ?? { key, label: `${hotel} · ${room}`, bookings: [] };
      group.bookings.push(b);
      map.set(key, group);
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  })();

  return (
    <>
      <Link href="/weeks" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        &larr; Back to course weeks
      </Link>
      <PageHeader
        title={`${formatDateRange(week.start_date, week.end_date)} · ${week.location}`}
        description={`${channelLabel(week.channel)} · ${rows.length} courses running this week${
          weekTotalParticipants ? ` · ${weekTotalPaid}/${weekTotalParticipants} participants paid` : ""
        }`}
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

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">External links</h2>
        <form action={updateWeekLinksAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="week_id" value={week.id} />
          <Field label="Sign-up sheet (Google Sheet)" name="signup_sheet_url">
            <Input
              name="signup_sheet_url"
              type="url"
              defaultValue={week.signup_sheet_url ?? ""}
              placeholder="https://docs.google.com/spreadsheets/..."
            />
          </Field>
          <Field label="Hotel questionnaire" name="hotel_questionnaire_url">
            <Input
              name="hotel_questionnaire_url"
              type="url"
              defaultValue={week.hotel_questionnaire_url ?? ""}
              placeholder="https://forms.gle/..."
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" variant="ghost">
              Save links
            </Button>
            {week.signup_sheet_url && (
              <a
                href={week.signup_sheet_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-600 hover:underline dark:text-sky-400"
              >
                Open sign-up sheet &rarr;
              </a>
            )}
            {week.hotel_questionnaire_url && (
              <a
                href={week.hotel_questionnaire_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-600 hover:underline dark:text-sky-400"
              >
                Open hotel questionnaire &rarr;
              </a>
            )}
          </div>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/weeks/${week.id}?view=${v.key}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activeView === v.key
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {v.key === "retro" && retros?.length ? `Retro (${retros.length})` : v.label}
          </Link>
        ))}
      </div>

      {activeView === "week" ? (
        <div className="space-y-4">
          {rows.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Course</Th>
                  <Th>Participants</Th>
                  <Th>Paid</Th>
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
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.count > 0 && s.paid === s.count
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : s.paid > 0
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}
                      >
                        {s.paid}/{s.count} paid
                      </span>
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
          )}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Add a course to this week
            </h2>
            {courses?.length ? (
              <form action={addCourseToWeekAction} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="week_id" value={week.id} />
                <div className="min-w-[14rem] flex-1">
                  <Field label="Course" name="course_id" required>
                    <Select id="course_id" name="course_id" required defaultValue="">
                      <option value="" disabled>
                        Select a course
                      </option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="w-40">
                  <Field label="Lead teacher" name="lead_teacher_id">
                    <Select id="lead_teacher_id" name="lead_teacher_id" defaultValue="">
                      <option value="">— later —</option>
                      {activeTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.code ? ` (${t.code})` : ""}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="w-24">
                  <Field label="Capacity" name="capacity">
                    <Input id="capacity" name="capacity" type="number" min={1} placeholder="—" />
                  </Field>
                </div>
                <Button type="submit" variant="ghost">
                  Add course
                </Button>
                <p className="w-full text-xs text-neutral-500 dark:text-neutral-400">
                  Runs {formatDateRange(week.start_date, week.end_date)} in {week.location}. A day-by-day
                  schedule is created automatically.
                </p>
              </form>
            ) : (
              <EmptyState>
                No courses in the catalog yet. Add one under{" "}
                <Link href="/courses" className="underline">
                  Courses
                </Link>
                .
              </EmptyState>
            )}
          </Card>
        </div>
      ) : activeView === "schedule" ? (
        rows.length && scheduleDates.length ? (
          <div className="space-y-2">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Each teacher&apos;s daily focus across the week. Click a cell to open that course&apos;s
              schedule editor.
            </p>
            <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              <table className="min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-900">
                    <th className="sticky left-0 z-10 border-b border-r border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                      Course · teacher
                    </th>
                    {scheduleDates.map((d) => (
                      <th
                        key={d}
                        className="border-b border-l border-neutral-200 px-3 py-2 text-left text-xs font-semibold text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
                      >
                        {dayLabel(d)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="align-top">
                      <th className="sticky left-0 z-10 border-b border-r border-neutral-200 bg-white px-3 py-2 text-left font-medium text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                        {s.courseName}
                        <span className="block text-xs font-normal text-neutral-500 dark:text-neutral-400">
                          {s.leadName ?? "Lead unassigned"}
                        </span>
                      </th>
                      {scheduleDates.map((d) => {
                        const title = scheduleTitles.get(`${s.id}__${d}`);
                        return (
                          <td
                            key={d}
                            className="border-b border-l border-neutral-100 p-0 dark:border-neutral-800"
                          >
                            <Link
                              href={`/sessions/${s.id}?view=schedule`}
                              className="block h-full min-h-[2.75rem] px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900"
                            >
                              {title ? (
                                <span className="text-neutral-700 dark:text-neutral-300">{title}</span>
                              ) : (
                                <span className="text-neutral-300 dark:text-neutral-600">—</span>
                              )}
                            </Link>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Card>
            <EmptyState>No courses to schedule for this week yet.</EmptyState>
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
      ) : activeView === "rooms" ? (
        <div className="space-y-3">
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Hotel questionnaire
            </h2>
            {week.hotel_questionnaire_url ? (
              <a
                href={week.hotel_questionnaire_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-sky-600 hover:underline dark:text-sky-400"
              >
                Open the accommodation questionnaire &rarr;
              </a>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No questionnaire link set yet — add one above under &ldquo;External links&rdquo;.
              </p>
            )}
          </Card>

          {roomGroups.length ? (
            roomGroups.map((g) => (
              <Card key={g.key}>
                <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{g.label}</p>
                <ul className="space-y-1">
                  {g.bookings.map((b) => (
                    <li key={b.id} className="flex items-center justify-between text-sm">
                      <span>
                        {b.guest_name}
                        <span className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
                          ({b.guests} guest{b.guests === 1 ? "" : "s"})
                        </span>
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {b.check_in} &rarr; {b.check_out}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))
          ) : (
            <Card>
              <EmptyState>No hotel bookings linked to this week&apos;s courses yet.</EmptyState>
            </Card>
          )}
        </div>
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
