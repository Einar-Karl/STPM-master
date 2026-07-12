import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { getChannelFilter } from "@/lib/channel-filter";
import type { Channel } from "@/lib/planner";
import {
  buildInnieSuggestions,
  buildOutieSuggestions,
  findEmailUrl,
  orgTypeLabel,
  SALES_STAGES,
  stageBadgeClass,
  stageLabel,
  type CountryStat,
  type SenderStat,
  type Suggestion,
} from "@/lib/sales";

const FOLLOW_UP_DAYS = 14;

function SuggestionCard({ s }: { s: Suggestion }) {
  const tone =
    s.tone === "opportunity"
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
      : s.tone === "warning"
        ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
        : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900";
  const badge =
    s.tone === "opportunity"
      ? "text-emerald-700 dark:text-emerald-300"
      : s.tone === "warning"
        ? "text-amber-700 dark:text-amber-300"
        : "text-sky-700 dark:text-sky-300";
  const label = s.tone === "opportunity" ? "Opportunity" : s.tone === "warning" ? "Needs attention" : "Action";
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${tone}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${badge}`}>{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{s.title}</p>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{s.detail}</p>
    </div>
  );
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ ch?: string; q?: string; type?: string; stage?: string }>;
}) {
  await requireStaff();
  const sp = await searchParams;
  const globalFilter = await getChannelFilter();

  const channel: Channel =
    sp.ch === "innie" || sp.ch === "outie"
      ? sp.ch
      : globalFilter === "innie"
        ? "innie"
        : "outie";

  const supabase = await createClient();

  const [{ data: weeks }, { data: sessions }, { data: bookings }, { data: leads }] = await Promise.all([
    supabase.from("course_weeks").select("id, channel, location"),
    supabase.from("course_sessions").select("id, week_id"),
    supabase.from("course_bookings").select("session_id, nationality, coordinator, participant_email, status"),
    supabase
      .from("sales_leads")
      .select("*")
      .eq("channel", channel)
      .order("municipality", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  // Map each booking to its week channel to compute per-channel market stats.
  const weekChannel = new Map<string, Channel>();
  const destinations = new Set<string>();
  for (const w of weeks ?? []) {
    weekChannel.set(w.id, w.channel);
    if (w.location && w.location.toLowerCase() !== "iceland") destinations.add(w.location);
  }
  const sessionChannel = new Map<string, Channel>();
  for (const s of sessions ?? []) {
    const ch = s.week_id ? weekChannel.get(s.week_id) : undefined;
    if (ch) sessionChannel.set(s.id, ch);
  }

  const countryCounts = new Map<string, number>();
  const senderMap = new Map<string, { people: number; countries: Set<string>; email: string | null }>();
  let totalParticipants = 0;
  for (const b of bookings ?? []) {
    if (b.status === "cancelled") continue;
    if (sessionChannel.get(b.session_id) !== channel) continue;
    totalParticipants += 1;
    const nat = (b.nationality ?? "").trim();
    if (nat) countryCounts.set(nat, (countryCounts.get(nat) ?? 0) + 1);
    const coord = (b.coordinator ?? "").trim();
    if (coord) {
      const agg = senderMap.get(coord) ?? { people: 0, countries: new Set<string>(), email: null };
      agg.people += 1;
      if (nat) agg.countries.add(nat);
      if (!agg.email && b.participant_email) agg.email = b.participant_email.split(/[;,]/)[0].trim();
      senderMap.set(coord, agg);
    }
  }

  const countries: CountryStat[] = [...countryCounts.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const maxCountry = countries[0]?.count ?? 1;

  const senders: SenderStat[] = [...senderMap.entries()]
    .map(([name, v]) => ({ name, people: v.people, countries: v.countries.size, email: v.email }))
    .sort((a, b) => b.people - a.people)
    .filter((s) => s.people >= 2)
    .slice(0, 10);

  // Lead pipeline stats (channel-scoped).
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const cutoff = new Date(today.getTime() - FOLLOW_UP_DAYS * 86_400_000);
  const stageCounts = new Map<string, number>();
  let notContacted = 0;
  let missingEmail = 0;
  let followUpsDue = 0;
  let interested = 0;
  for (const l of leads ?? []) {
    stageCounts.set(l.stage, (stageCounts.get(l.stage) ?? 0) + 1);
    if (l.stage === "new" && !l.last_contacted_at) notContacted += 1;
    if (!l.email) missingEmail += 1;
    if (l.stage === "interested") interested += 1;
    const dueByDate = l.next_follow_up_at && l.next_follow_up_at <= todayStr;
    const goneQuiet =
      l.stage === "contacted" && l.last_contacted_at && new Date(l.last_contacted_at) < cutoff;
    if (dueByDate || goneQuiet) followUpsDue += 1;
  }

  const suggestions =
    channel === "outie"
      ? buildOutieSuggestions(countries, senders, totalParticipants)
      : buildInnieSuggestions({
          total: leads?.length ?? 0,
          notContacted,
          missingEmail,
          followUpsDue,
          interested,
        });

  // Apply list filters (innie leads list).
  const q = (sp.q ?? "").trim().toLowerCase();
  const typeFilter = sp.type ?? "all";
  const stageFilter = sp.stage ?? "all";
  const filteredLeads = (leads ?? []).filter((l) => {
    if (typeFilter !== "all" && l.org_type !== typeFilter) return false;
    if (stageFilter !== "all" && l.stage !== stageFilter) return false;
    if (q) {
      const hay = `${l.name} ${l.municipality ?? ""} ${l.email ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const tabHref = (ch: Channel) => `/sales?ch=${ch}`;

  return (
    <>
      <PageHeader title="Sales" description="Prospecting, cold outreach and market intelligence." />

      <div className="flex gap-2">
        {(["outie", "innie"] as Channel[]).map((ch) => (
          <Link
            key={ch}
            href={tabHref(ch)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              channel === ch
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {ch === "outie" ? "Outies (inbound)" : "Innies (outbound)"}
          </Link>
        ))}
      </div>

      {/* AI-suggested sales moves */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Suggested sales moves
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((s, i) => (
            <SuggestionCard key={i} s={s} />
          ))}
        </div>
      </div>

      {channel === "outie" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Where teachers come from
              </h2>
              {countries.length ? (
                <div className="space-y-2">
                  {countries.map((c) => (
                    <div key={c.country} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 truncate text-sm text-neutral-700 dark:text-neutral-300">
                        {c.country}
                      </span>
                      <div className="h-4 flex-1 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded bg-sky-600"
                          style={{ width: `${Math.max((c.count / maxCountry) * 100, 4)}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-sm font-medium text-neutral-600 dark:text-neutral-400">
                        {c.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState>No participant data for this channel yet.</EmptyState>
              )}
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Top senders (coordinators)
              </h2>
              <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                People who bring whole groups — your warmest accounts for repeat business and referrals.
              </p>
              {senders.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs text-neutral-500 dark:text-neutral-400">
                        <th className="py-1 pr-2 font-medium">Coordinator</th>
                        <th className="py-1 pr-2 text-right font-medium">People</th>
                        <th className="py-1 font-medium">Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {senders.map((s) => (
                        <tr key={s.name} className="border-t border-neutral-100 dark:border-neutral-800">
                          <td className="py-1.5 pr-2 font-medium text-neutral-800 dark:text-neutral-200">
                            {s.name}
                          </td>
                          <td className="py-1.5 pr-2 text-right text-neutral-600 dark:text-neutral-400">
                            {s.people}
                          </td>
                          <td className="py-1.5 text-neutral-500 dark:text-neutral-400">
                            {s.email ? (
                              <a href={`mailto:${s.email}`} className="text-sky-600 hover:underline dark:text-sky-400">
                                {s.email}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState>No coordinator data yet.</EmptyState>
              )}
            </Card>
          </div>

          {(leads ?? []).length > 0 && (
            <LeadsSection
              channel={channel}
              leads={filteredLeads}
              q={sp.q ?? ""}
              typeFilter={typeFilter}
              stageFilter={stageFilter}
            />
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SALES_STAGES.map((st) => (
              <Link
                key={st.value}
                href={`/sales?ch=innie&stage=${st.value}`}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-3 text-center shadow-sm transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600"
              >
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {stageCounts.get(st.value) ?? 0}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{st.label}</p>
              </Link>
            ))}
          </div>

          <LeadsSection
            channel={channel}
            leads={filteredLeads}
            q={sp.q ?? ""}
            typeFilter={typeFilter}
            stageFilter={stageFilter}
          />
        </>
      )}
    </>
  );
}

function LeadsSection({
  channel,
  leads,
  q,
  typeFilter,
  stageFilter,
}: {
  channel: Channel;
  leads: {
    id: string;
    name: string;
    org_type: string;
    municipality: string | null;
    email: string | null;
    stage: string;
    last_contacted_at: string | null;
  }[];
  q: string;
  typeFilter: string;
  stageFilter: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {channel === "innie" ? "Schools & kindergartens" : "Leads"} ({leads.length})
        </h2>
        <form method="get" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="ch" value={channel} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, town, email…"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
          <select
            name="type"
            defaultValue={typeFilter}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">All types</option>
            <option value="school">Schools</option>
            <option value="kindergarten">Kindergartens</option>
          </select>
          <select
            name="stage"
            defaultValue={stageFilter}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">All stages</option>
            {SALES_STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Filter
          </button>
        </form>
      </div>

      {leads.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Town</Th>
              <Th>Email</Th>
              <Th>Stage</Th>
              <Th>Last contact</Th>
              <Th>
                <span className="sr-only">Open</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <Td className="font-medium">
                  <Link href={`/sales/${l.id}`} className="hover:underline">
                    {l.name}
                  </Link>
                </Td>
                <Td>{orgTypeLabel(l.org_type)}</Td>
                <Td>{l.municipality ?? "—"}</Td>
                <Td>
                  {l.email ? (
                    <span className="text-neutral-600 dark:text-neutral-400">{l.email}</span>
                  ) : (
                    <a
                      href={findEmailUrl(l.name, l.municipality)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:underline dark:text-sky-400"
                    >
                      Find email ↗
                    </a>
                  )}
                </Td>
                <Td>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stageBadgeClass(
                      l.stage
                    )}`}
                  >
                    {stageLabel(l.stage)}
                  </span>
                </Td>
                <Td className="text-neutral-500 dark:text-neutral-400">
                  {l.last_contacted_at
                    ? new Date(l.last_contacted_at).toLocaleDateString("en-GB")
                    : "—"}
                </Td>
                <Td>
                  <Link
                    href={`/sales/${l.id}`}
                    className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
                  >
                    Open →
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Card>
          <EmptyState>No leads match. Adjust the filters above.</EmptyState>
        </Card>
      )}
    </div>
  );
}
