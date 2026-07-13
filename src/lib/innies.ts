// Shared helpers for the Innies (endurmenntunarferðir.is) history & pricing tools.
// All money is Icelandic króna (ISK).

export type InnieTrip = {
  id: string;
  year: number;
  trip_no: number | null;
  label: string;
  destination: string;
  school: string | null;
  depart_date: string | null;
  pax: number;
  free_seats: number;
  revenue_total: number;
  flight_cost: number;
  service_fee: number;
  hotel_cost: number;
  margin: number;
  price_min: number | null;
  price_avg: number | null;
  price_max: number | null;
  note: string | null;
};

export type DestinationModel = {
  destination: string;
  trips: number;
  pax: number;
  flightPerPax: number;
  hotelPerPax: number;
  servicePerPax: number;
  costPerPax: number;
  pricePerPax: number;
  marginPerPax: number;
  marginPct: number;
};

// Group digits with "." as the thousands separator (Icelandic convention).
// Deterministic across server & client — avoids Intl locale-data mismatches
// that break React hydration (Node and the browser can disagree on "is-IS").
export function formatInt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  return sign + Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatISK(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return formatInt(n) + " kr";
}

export function formatISKshort(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const m = n / 1_000_000;
  if (Math.abs(n) >= 1_000_000) return `${m.toFixed(m >= 10 ? 0 : 1)}M kr`;
  return `${Math.round(n / 1000)}k kr`;
}

/**
 * Build a per-passenger cost model per destination from historical settlements.
 * Trips with no flight cost (special "álagning LAL" arrangements) are excluded
 * from the cost basis so they don't distort the per-seat averages.
 */
export function destinationModels(trips: InnieTrip[]): DestinationModel[] {
  const byDest = new Map<string, InnieTrip[]>();
  for (const t of trips) {
    const arr = byDest.get(t.destination) ?? [];
    arr.push(t);
    byDest.set(t.destination, arr);
  }
  const models: DestinationModel[] = [];
  for (const [destination, all] of byDest) {
    const costTrips = all.filter((t) => t.flight_cost > 0);
    const costPax = costTrips.reduce((s, t) => s + t.pax, 0) || 1;
    const pax = all.reduce((s, t) => s + t.pax, 0);
    const revenue = all.reduce((s, t) => s + t.revenue_total, 0);
    const margin = all.reduce((s, t) => s + t.margin, 0);
    const flightPerPax = costTrips.reduce((s, t) => s + t.flight_cost, 0) / costPax;
    const hotelPerPax = costTrips.reduce((s, t) => s + t.hotel_cost, 0) / costPax;
    const servicePerPax = costTrips.reduce((s, t) => s + t.service_fee, 0) / costPax;
    models.push({
      destination,
      trips: all.length,
      pax,
      flightPerPax,
      hotelPerPax,
      servicePerPax,
      costPerPax: flightPerPax + hotelPerPax + servicePerPax,
      pricePerPax: revenue / (pax || 1),
      marginPerPax: margin / (pax || 1),
      marginPct: revenue ? (margin / revenue) * 100 : 0,
    });
  }
  return models.sort((a, b) => b.pax - a.pax);
}

export type OfferInputs = {
  flightPerPax: number;
  hotelPerPax: number;
  servicePerPax: number;
  groupSize: number;
  freeSeats: number;
  targetMarginPct: number; // margin as % of the selling price
};

export type OfferResult = {
  costPerPax: number;
  freeSeatRecoveryPerPax: number;
  breakEvenPerPax: number;
  offerPerPax: number;
  marginPerPax: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
};

/**
 * Turn a per-seat cost basis + group size + target margin into a recommended
 * per-person offer price. One free tour-leader seat (flight + hotel, no service
 * fee) is spread across the paying passengers, matching how the trips settle.
 * Margin is expressed as a share of the selling price (the way the workbooks do).
 */
export function computeOffer(i: OfferInputs): OfferResult {
  const costPerPax = i.flightPerPax + i.hotelPerPax + i.servicePerPax;
  const freeSeatCost = Math.max(i.freeSeats, 0) * (i.flightPerPax + i.hotelPerPax);
  const freeSeatRecoveryPerPax = i.groupSize > 0 ? freeSeatCost / i.groupSize : 0;
  const breakEvenPerPax = costPerPax + freeSeatRecoveryPerPax;
  const m = Math.min(Math.max(i.targetMarginPct, 0), 90) / 100;
  const offerPerPax = breakEvenPerPax / (1 - m);
  const totalRevenue = offerPerPax * i.groupSize;
  const totalCost = breakEvenPerPax * i.groupSize;
  return {
    costPerPax,
    freeSeatRecoveryPerPax,
    breakEvenPerPax,
    offerPerPax,
    marginPerPax: offerPerPax - breakEvenPerPax,
    totalRevenue,
    totalCost,
    totalMargin: totalRevenue - totalCost,
  };
}
