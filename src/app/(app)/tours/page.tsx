import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { channelLabel, formatDateRange } from "@/lib/planner";

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

  const overall = empty();
  const byWeek = new Map<string, Agg>();
  const byLocation = new Map<string, Agg>();
  const weekMeta = new Map(
    (weeks ?? []).map((w) => [w.id, w] as const),
  );

  for (const b of bookings ?? []) {
    if (b.status === "cancelled") continue;
    add(overall, b.tour_booked);
    const wk = sessionWeek.get(b.session_id);
    if (!wk) continue;
    const w = weekMeta.get(wk);
    if (!w) continue;
    if (!byWeek.has(wk)) byWeek.set(wk, empty());
    add(byWeek.get(wk)!, b.tour_booked);
    if (!byLocation.has(w.location)) byLocation.set(w.location, empty());
    add(byLocation.get(w.location)!, b.tour_booked);
  }

  const overallKnown = overall.yes + overall.no;
  const locations = [...byLocation.entries()].sort((a, b) => b[1].yes - a[1].yes);
  type WeekMeta = NonNullable<typeof weeks>[number];
  const weekRows = (weeks ?? [])
    .map((w) => ({ w, a: byWeek.get(w.id) }))
    .filter((r): r is { w: WeekMeta; a: Agg } => !!r.a && r.a.yes + r.a.no > 0)
    .sort((a, b) => b.a.yes - a.a.yes);

  return (
    <>
      <PageHeader
        title="Tours"
        description="Excursion / tour uptake among course participants — who has booked the optional tour and where the opportunity (and the missing data) is."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Participants" value={String(overall.participants)} />
        <Stat
          label="Tour booked"
          value={String(overall.yes)}
          sub={overallKnown ? `${Math.round((overall.yes / overallKnown) * 100)}% of those who answered` : undefined}
        />
        <Stat label="No tour" value={String(overall.no)} />
        <Stat
          label="Unknown"
          value={String(overall.unknown)}
          sub="Tour not recorded yet"
        />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">By location</h2>
        <Table>
          <thead>
            <tr>
              <Th>Location</Th>
              <Th>Participants</Th>
              <Th>Booked</Th>
              <Th>No</Th>
              <Th>Unknown</Th>
              <Th>Uptake</Th>
            </tr>
          </thead>
          <tbody>
            {locations.map(([loc, a]) => (
              <tr key={loc}>
                <Td className="font-medium">{loc}</Td>
                <Td>{a.participants}</Td>
                <Td className="font-medium text-emerald-600 dark:text-emerald-400">{a.yes}</Td>
                <Td>{a.no}</Td>
                <Td>{a.unknown ? <span className="text-amber-600 dark:text-amber-400">{a.unknown}</span> : 0}</Td>
                <Td>
                  <UptakeBar a={a} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Uptake = booked ÷ (booked + declined), ignoring participants whose tour choice hasn&apos;t been
          recorded.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          By course week
        </h2>
        {weekRows.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Week</Th>
                <Th>Location</Th>
                <Th>Channel</Th>
                <Th>Booked</Th>
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
                  <Td>{w.location}</Td>
                  <Td>{channelLabel(w.channel)}</Td>
                  <Td>
                    {a.yes}
                    <span className="text-neutral-400"> / {a.yes + a.no + a.unknown}</span>
                  </Td>
                  <Td>
                    <UptakeBar a={a} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState>No tour bookings recorded yet.</EmptyState>
        )}
      </Card>

      {overall.unknown > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">{overall.unknown} participants</span> have no tour choice
            recorded. Capturing this at sign-up (e.g. a tour question on the sign-up sheet) would make this
            picture complete and let you forecast tour numbers before each week.
          </p>
        </Card>
      )}
    </>
  );
}
