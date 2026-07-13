import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { formatDateRange } from "@/lib/planner";

type Agg = { participants: number; yes: number; no: number; unknown: number };
const empty = (): Agg => ({ participants: 0, yes: 0, no: 0, unknown: 0 });
function add(a: Agg, tour: boolean | null) {
  a.participants += 1;
  if (tour === true) a.yes += 1;
  else if (tour === false) a.no += 1;
  else a.unknown += 1;
}
const uptake = (a: Agg) => {
  const known = a.yes + a.no;
  return known ? Math.round((a.yes / known) * 100) : null;
};
// Tours are offered to Outies on Iceland weeks only.
const offersTours = (location: string) => location.trim().toLowerCase() === "iceland";

function UptakeBar({ a }: { a: Agg }) {
  const pct = uptake(a);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct ?? 0}%` }} />
      </div>
      <span className="tabular-nums text-xs text-neutral-500 dark:text-neutral-400">
        {pct === null ? "—" : `${pct}%`}
      </span>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{sub}</p>}
    </Card>
  );
}

export default async function ToursPage() {
  await requireStaff();
  const supabase = await createClient();

  const [{ data: bookings }, { data: sessions }, { data: weeks }] = await Promise.all([
    supabase.from("course_bookings").select("session_id, tour_booked, status"),
    supabase.from("course_sessions").select("id, week_id"),
    supabase
      .from("course_weeks")
      .select("id, label, location, channel, start_date, end_date")
      .order("start_date", { ascending: true }),
  ]);

  const sessionWeek = new Map<string, string>();
  for (const s of sessions ?? []) if (s.week_id) sessionWeek.set(s.id, s.week_id);
  type WeekMeta = NonNullable<typeof weeks>[number];
  const weekMeta = new Map((weeks ?? []).map((w) => [w.id, w] as const));

  const offered = empty(); // Iceland (tours offered)
  const byWeek = new Map<string, Agg>();
  const otherByLocation = new Map<string, number>(); // non-Iceland participant counts

  for (const b of bookings ?? []) {
    if (b.status === "cancelled") continue;
    const wk = sessionWeek.get(b.session_id);
    if (!wk) continue;
    const w = weekMeta.get(wk);
    if (!w) continue;
    if (offersTours(w.location)) {
      add(offered, b.tour_booked);
      if (!byWeek.has(wk)) byWeek.set(wk, empty());
      add(byWeek.get(wk)!, b.tour_booked);
    } else {
      otherByLocation.set(w.location, (otherByLocation.get(w.location) ?? 0) + 1);
    }
  }

  const known = offered.yes + offered.no;
  const overallUptake = known ? Math.round((offered.yes / known) * 100) : null;
  const weekRows = (weeks ?? [])
    .filter((w) => offersTours(w.location))
    .map((w) => ({ w, a: byWeek.get(w.id) }))
    .filter((r): r is { w: WeekMeta; a: Agg } => !!r.a && r.a.participants > 0)
    .sort((a, b) => b.a.yes - a.a.yes);
  const otherLocations = [...otherByLocation.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader
        title="Tours"
        description="Optional excursions are offered to Outies on Iceland weeks (e.g. the Golden Circle). This is how many participants take them up — and where the numbers land per week."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Iceland participants" value={String(offered.participants)} sub="tour-eligible" />
        <Stat
          label="Booked a tour"
          value={String(offered.yes)}
          sub={overallUptake !== null ? `${overallUptake}% uptake` : undefined}
        />
        <Stat label="Declined" value={String(offered.no)} />
        <Stat
          label="Not recorded"
          value={String(offered.unknown)}
          sub={offered.unknown ? "no answer captured" : "all captured"}
        />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Iceland weeks — tour uptake
        </h2>
        {weekRows.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Week</Th>
                <Th>Participants</Th>
                <Th>Booked</Th>
                <Th>Declined</Th>
                <Th>Uptake</Th>
              </tr>
            </thead>
            <tbody>
              {weekRows.map(({ w, a }) => (
                <tr key={w.id}>
                  <Td className="font-medium">
                    <Link href={`/weeks/${w.id}`} className="hover:underline">
                      {formatDateRange(w.start_date, w.end_date)}
                    </Link>
                  </Td>
                  <Td>{a.participants}</Td>
                  <Td className="font-medium text-emerald-600 dark:text-emerald-400">{a.yes}</Td>
                  <Td>{a.no}</Td>
                  <Td>
                    <UptakeBar a={a} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState>No Iceland course weeks with participants yet.</EmptyState>
        )}
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Uptake = booked ÷ (booked + declined). Historically around{" "}
          <span className="font-medium text-neutral-700 dark:text-neutral-300">two thirds</span> of Iceland
          participants take the tour — a useful number for booking with the excursion operator.
        </p>
      </Card>

      {otherLocations.length > 0 && (
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Other destinations
          </h2>
          <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
            Tours aren&apos;t offered on these weeks, so participants aren&apos;t asked — they&apos;re shown here
            only for completeness.
          </p>
          <div className="flex flex-wrap gap-2">
            {otherLocations.map(([loc, n]) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400"
              >
                {loc}
                <span className="text-neutral-400">· {n}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {offered.unknown > 0 && (
        <Card>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {offered.unknown} Iceland participants
            </span>{" "}
            have no tour answer recorded. Capturing the tour question on the sign-up sheet — which now imports
            straight into the roster — would make the forecast complete before each week starts.
          </p>
        </Card>
      )}
    </>
  );
}
