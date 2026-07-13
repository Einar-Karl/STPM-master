import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import {
  destinationModels,
  formatInt,
  formatISK,
  formatISKshort,
  type InnieTrip,
} from "@/lib/innies";
import { PricingCalculator } from "./pricing-calculator";

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

export default async function InniesPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase
    .from("innie_trips")
    .select("*")
    .order("depart_date", { ascending: true });

  const trips = (data ?? []) as InnieTrip[];

  if (!trips.length) {
    return (
      <>
        <PageHeader
          title="Innies · History &amp; Pricing"
          description="Continuing-education trips abroad (endurmenntunarferðir.is)."
        />
        <Card>
          <EmptyState>No Innies trip history imported yet.</EmptyState>
        </Card>
      </>
    );
  }

  const sum = (f: (t: InnieTrip) => number) => trips.reduce((s, t) => s + f(t), 0);
  const totalPax = sum((t) => t.pax);
  const totalRevenue = sum((t) => t.revenue_total);
  const totalMargin = sum((t) => t.margin);
  const marginPct = totalRevenue ? (totalMargin / totalRevenue) * 100 : 0;

  const years = [...new Set(trips.map((t) => t.year))].sort();
  const byYear = years.map((y) => {
    const ts = trips.filter((t) => t.year === y);
    const rev = ts.reduce((s, t) => s + t.revenue_total, 0);
    const mar = ts.reduce((s, t) => s + t.margin, 0);
    const pax = ts.reduce((s, t) => s + t.pax, 0);
    return { year: y, trips: ts.length, pax, rev, mar, marginPct: rev ? (mar / rev) * 100 : 0 };
  });

  const models = destinationModels(trips);
  const presets = models
    .filter((m) => m.costPerPax > 0)
    .map((m) => ({ ...m, key: m.destination }));

  const destinations = [...new Set(trips.map((t) => t.destination))];

  return (
    <>
      <PageHeader
        title="Innies · History &amp; Pricing"
        description="Continuing-education trips abroad for Icelandic schools (endurmenntunarferðir.is / Leikur að læra). Two seasons of settled trips — the basis for costing and pricing new offers to schools."
      />

      {/* Headline KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Trips" value={String(trips.length)} sub={`${years[0]}–${years[years.length - 1]}`} />
        <Stat label="Paying passengers" value={formatInt(totalPax)} />
        <Stat label="Revenue" value={formatISKshort(totalRevenue)} sub={formatISK(totalRevenue)} />
        <Stat
          label="Margin (profit)"
          value={formatISKshort(totalMargin)}
          sub={`${marginPct.toFixed(1)}% · ${formatISK(totalMargin / totalPax)}/pax`}
        />
      </div>

      {/* Year comparison */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Season on season
        </h2>
        <Table>
          <thead>
            <tr>
              <Th>Year</Th>
              <Th>Trips</Th>
              <Th>Passengers</Th>
              <Th>Revenue</Th>
              <Th>Margin</Th>
              <Th>Margin %</Th>
              <Th>Margin / pax</Th>
            </tr>
          </thead>
          <tbody>
            {byYear.map((y) => (
              <tr key={y.year}>
                <Td className="font-medium">{y.year}</Td>
                <Td>{y.trips}</Td>
                <Td>{y.pax}</Td>
                <Td>{formatISK(y.rev)}</Td>
                <Td>{formatISK(y.mar)}</Td>
                <Td>{y.marginPct.toFixed(1)}%</Td>
                <Td>{formatISK(y.mar / y.pax)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Destination cost model */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Cost model per passenger, by destination
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => (
            <Card key={m.destination} className="p-4">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{m.destination}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {m.trips} trip{m.trips === 1 ? "" : "s"} · {m.pax} pax
                </p>
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <CostRow label="Flight" value={m.flightPerPax} />
                <CostRow label="Hotel" value={m.hotelPerPax} />
                <CostRow label="Service fee" value={m.servicePerPax} />
                <div className="flex justify-between border-t border-neutral-200 pt-1 dark:border-neutral-800">
                  <dt className="font-medium text-neutral-700 dark:text-neutral-300">Cost / pax</dt>
                  <dd className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                    {formatISK(m.costPerPax)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500 dark:text-neutral-400">Avg price / pax</dt>
                  <dd className="tabular-nums text-neutral-700 dark:text-neutral-300">
                    {formatISK(m.pricePerPax)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500 dark:text-neutral-400">Margin / pax</dt>
                  <dd className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                    {formatISK(m.marginPerPax)} · {m.marginPct.toFixed(0)}%
                  </dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Cost basis excludes special settlements with no flight/hotel line (e.g. the 2024 Calpe group).
        </p>
      </div>

      {/* Pricing calculator */}
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Offer builder — price a new trip for a school
        </h2>
        <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
          Pick a destination to load its historical per-seat costs, set the group size and target margin,
          and get a per-person price to quote — with the profit it yields.
        </p>
        <PricingCalculator presets={presets} />
      </Card>

      {/* Full trip log */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          All settled trips
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Trip</Th>
                <Th>School / group</Th>
                <Th>Pax</Th>
                <Th>Price / pax</Th>
                <Th>Cost / pax</Th>
                <Th>Margin / pax</Th>
                <Th>Margin %</Th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => {
                const pricePax = t.revenue_total / t.pax;
                const costPax = (t.flight_cost + t.hotel_cost + t.service_fee) / t.pax;
                const marginPax = t.margin / t.pax;
                const pct = t.revenue_total ? (t.margin / t.revenue_total) * 100 : 0;
                return (
                  <tr key={t.id}>
                    <Td className="font-medium">
                      {t.label}
                      <span className="block text-xs font-normal text-neutral-400">
                        {t.year} · {t.destination}
                      </span>
                    </Td>
                    <Td className="text-xs text-neutral-500 dark:text-neutral-400">{t.school ?? "—"}</Td>
                    <Td>
                      {t.pax}
                      {t.free_seats ? <span className="text-neutral-400"> +{t.free_seats}</span> : null}
                    </Td>
                    <Td>{formatISK(pricePax)}</Td>
                    <Td className="text-neutral-500">{costPax > 0 ? formatISK(costPax) : "—"}</Td>
                    <Td className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatISK(marginPax)}
                    </Td>
                    <Td>{pct.toFixed(0)}%</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {destinations.join(", ")} · settled figures from the LAL 2024 &amp; 2025 workbooks. &ldquo;+N&rdquo;
          = free tour-leader seats not counted as paying passengers.
        </p>
      </Card>
    </>
  );
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatISK(value)}</dd>
    </div>
  );
}
