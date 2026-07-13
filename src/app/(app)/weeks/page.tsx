import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { CHANNELS, type Channel, channelLabel, formatDateRange } from "@/lib/planner";
import { getChannelFilter } from "@/lib/channel-filter";

export default async function WeeksPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  await requireStaff();
  const { channel } = await searchParams;
  const defaultFilter = await getChannelFilter();
  const active: Channel | "all" =
    channel === "innie" || channel === "outie"
      ? channel
      : channel === "all"
        ? "all"
        : defaultFilter;

  const supabase = await createClient();

  let weeksQuery = supabase
    .from("course_weeks")
    .select("id, start_date, end_date, location, channel, label")
    .order("start_date", { ascending: true });
  if (active !== "all") weeksQuery = weeksQuery.eq("channel", active);

  const [{ data: weeks }, { data: sessions }, { data: bookings }] = await Promise.all([
    weeksQuery,
    supabase.from("course_sessions").select("id, week_id, lead_teacher_id, support_teacher_id"),
    supabase.from("course_bookings").select("session_id, status"),
  ]);

  // session_id -> week_id
  const sessionWeek = new Map<string, string>();
  const sessionsByWeek = new Map<string, { staffed: number; total: number }>();
  for (const s of sessions ?? []) {
    if (!s.week_id) continue;
    sessionWeek.set(s.id, s.week_id);
    const agg = sessionsByWeek.get(s.week_id) ?? { staffed: 0, total: 0 };
    agg.total += 1;
    if (s.lead_teacher_id) agg.staffed += 1;
    sessionsByWeek.set(s.week_id, agg);
  }

  const participantsByWeek = new Map<string, number>();
  for (const b of bookings ?? []) {
    if (b.status === "cancelled") continue;
    const wk = sessionWeek.get(b.session_id);
    if (!wk) continue;
    participantsByWeek.set(wk, (participantsByWeek.get(wk) ?? 0) + 1);
  }

  const tabs: { key: Channel | "all"; label: string }[] = [
    { key: "all", label: "All" },
    ...CHANNELS.map((c) => ({ key: c.value, label: c.label })),
  ];

  return (
    <>
      <PageHeader
        title="Course Weeks"
        description="Plan each course week: assign the right teachers and confirm the location. Two channels — Outies (foreign teachers coming here) and Innies (Icelandic teachers travelling abroad)."
      />

      <div className="flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/weeks?channel=${t.key}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              active === t.key
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {weeks?.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Week</Th>
              <Th>Location</Th>
              <Th>Channel</Th>
              <Th>Courses</Th>
              <Th>Participants</Th>
              <Th>Staffing</Th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => {
              const agg = sessionsByWeek.get(w.id) ?? { staffed: 0, total: 0 };
              const fullyStaffed = agg.total > 0 && agg.staffed === agg.total;
              return (
                <tr key={w.id}>
                  <Td className="font-medium">
                    <Link href={`/weeks/${w.id}`} className="hover:underline">
                      {formatDateRange(w.start_date, w.end_date)}
                    </Link>
                  </Td>
                  <Td>{w.location}</Td>
                  <Td>{channelLabel(w.channel)}</Td>
                  <Td>{agg.total}</Td>
                  <Td>{participantsByWeek.get(w.id) ?? 0}</Td>
                  <Td>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        fullyStaffed
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
          <EmptyState>
            No course weeks in this channel yet.
            {active === "innie" && " Innies (outbound) trips will appear here once added."}
          </EmptyState>
        </Card>
      )}
    </>
  );
}
