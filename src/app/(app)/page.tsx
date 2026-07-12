import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Card, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { channelLabel, formatDateRange } from "@/lib/planner";
import { TimelineExplorer, type TimelineBar } from "@/components/year-timeline";
import { getChannelFilter } from "@/lib/channel-filter";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireStaff();
  const { year: yearParam } = await searchParams;
  const year = Number(yearParam) || 2026;
  const channelFilter = await getChannelFilter();

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year + 1}-01-01`;

  const [{ data: weeks }, { data: yearWeeks }, { data: sessions }, { data: bookings }] = await Promise.all([
    supabase
      .from("course_weeks")
      .select("id, start_date, end_date, location, channel")
      .order("start_date", { ascending: true }),
    supabase
      .from("course_weeks")
      .select("id, start_date, end_date, location, channel")
      .gte("start_date", yearStart)
      .lt("start_date", yearEnd)
      .order("start_date", { ascending: true }),
    supabase.from("course_sessions").select("id, week_id, lead_teacher_id"),
    supabase.from("course_bookings").select("session_id, status, payment_status"),
  ]);

  const sessionWeek = new Map<string, string>();
  for (const s of sessions ?? []) if (s.week_id) sessionWeek.set(s.id, s.week_id);

  let paid = 0;
  let pending = 0;
  let activeTotal = 0;
  const participantsByWeek = new Map<string, number>();
  for (const b of bookings ?? []) {
    if (b.status === "cancelled") continue;
    activeTotal += 1;
    if ((b.payment_status ?? "").toUpperCase() === "PAID") paid += 1;
    else if ((b.payment_status ?? "").toUpperCase() === "PENDING") pending += 1;
    const wk = sessionWeek.get(b.session_id);
    if (wk) participantsByWeek.set(wk, (participantsByWeek.get(wk) ?? 0) + 1);
  }

  const staffedByWeek = new Map<string, { staffed: number; total: number }>();
  for (const s of sessions ?? []) {
    if (!s.week_id) continue;
    const agg = staffedByWeek.get(s.week_id) ?? { staffed: 0, total: 0 };
    agg.total += 1;
    if (s.lead_teacher_id) agg.staffed += 1;
    staffedByWeek.set(s.week_id, agg);
  }

  const timelineBars: TimelineBar[] = (yearWeeks ?? []).map((w) => {
    const agg = staffedByWeek.get(w.id) ?? { staffed: 0, total: 0 };
    return {
      id: w.id,
      start_date: w.start_date,
      end_date: w.end_date,
      location: w.location,
      channel: w.channel,
      courseCount: agg.total,
      staffedCount: agg.staffed,
      participantCount: participantsByWeek.get(w.id) ?? 0,
    };
  });

  const outieWeeks = (weeks ?? []).filter((w) => w.channel === "outie").length;
  const innieWeeks = (weeks ?? []).filter((w) => w.channel === "innie").length;
  const upcoming = (weeks ?? [])
    .filter((w) => w.end_date >= today)
    .filter((w) => channelFilter === "both" || w.channel === channelFilter)
    .slice(0, 8);

  const stats = [
    { label: "Active participants", value: activeTotal, href: "/weeks" },
    { label: "Course weeks", value: weeks?.length ?? 0, href: "/weeks" },
    { label: "Payments received", value: paid, href: "/course-bookings" },
    { label: "Payments pending", value: pending, href: "/course-bookings" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="STPM master planning overview."
      />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {year} at a glance
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/?year=${year - 1}`}
            className="rounded-md border border-neutral-300 px-2 py-1 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            &larr; {year - 1}
          </Link>
          <Link
            href={`/?year=${year + 1}`}
            className="rounded-md border border-neutral-300 px-2 py-1 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {year + 1} &rarr;
          </Link>
        </div>
      </div>

      {timelineBars.length ? (
        <TimelineExplorer year={year} bars={timelineBars} initialChannel={channelFilter} />
      ) : (
        <Card>
          <EmptyState>No course weeks scheduled for {year} yet.</EmptyState>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-colors hover:border-neutral-400 dark:hover:border-neutral-600">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{s.label}</p>
              <p className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">{s.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Outies weeks (inbound)</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{outieWeeks}</p>
          <p className="mt-1 text-xs text-neutral-400">Foreign teachers coming to STPM courses</p>
        </Card>
        <Card>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Innies weeks (outbound)</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{innieWeeks}</p>
          <p className="mt-1 text-xs text-neutral-400">Icelandic teachers travelling abroad</p>
        </Card>
      </div>

      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Upcoming weeks</h2>
      {upcoming.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Week</Th>
              <Th>Location</Th>
              <Th>Channel</Th>
              <Th>Participants</Th>
              <Th>Staffing</Th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((w) => {
              const agg = staffedByWeek.get(w.id) ?? { staffed: 0, total: 0 };
              const full = agg.total > 0 && agg.staffed === agg.total;
              return (
                <tr key={w.id}>
                  <Td className="font-medium">
                    <Link href={`/weeks/${w.id}`} className="hover:underline">
                      {formatDateRange(w.start_date, w.end_date)}
                    </Link>
                  </Td>
                  <Td>{w.location}</Td>
                  <Td>{channelLabel(w.channel)}</Td>
                  <Td>{participantsByWeek.get(w.id) ?? 0}</Td>
                  <Td>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        full
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : agg.staffed > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {agg.staffed}/{agg.total} staffed
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <Card>
          <EmptyState>No upcoming weeks. Import the 2026 data or add weeks to get started.</EmptyState>
        </Card>
      )}
    </>
  );
}
