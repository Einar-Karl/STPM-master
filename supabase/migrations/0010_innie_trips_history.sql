-- Historical Innies trip settlements (endurmenntunarferðir.is — Icelandic teachers
-- travelling abroad, operated by Leikur að læra / Smart Teachers Play More; "LAL").
-- Imported from the LAL_farthegar 2024 & 2025 settlement workbooks. These are
-- completed/settled trips kept for historical, cost and pricing analysis — they are
-- distinct from the forward-looking course_weeks planner.
--
-- Money is Icelandic króna (ISK). Economics per trip:
--   revenue_total = flight_cost + hotel_cost + service_fee + margin
--   margin        = "Greitt til LAL" = the company's profit on the trip
--   service_fee   = "Þjónustugjald HF" = agency (Heimsferðir) service fee

create table public.innie_trips (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  trip_no int,
  label text not null,
  destination text not null,
  school text,
  depart_date date,
  pax int not null default 0,             -- paying passengers (Farþegi)
  free_seats int not null default 0,      -- tour leaders / free seats (not paying)
  revenue_total numeric(14, 2) not null default 0,   -- Verð samtals
  paid_total numeric(14, 2),              -- Greitt samtals
  flight_cost numeric(14, 2) not null default 0,     -- Flugkostnaður
  service_fee numeric(14, 2) not null default 0,     -- Þjónustugjald HF
  hotel_cost numeric(14, 2) not null default 0,      -- Hótel
  margin numeric(14, 2) not null default 0,          -- Greitt til LAL / hagnaður
  price_min numeric(12, 2),               -- cheapest paying passenger on the trip
  price_avg numeric(12, 2),               -- mean paying-passenger price
  price_max numeric(12, 2),               -- dearest paying passenger (single supp. etc.)
  note text,
  created_at timestamptz not null default now()
);

create index innie_trips_year_idx on public.innie_trips (year);
create index innie_trips_destination_idx on public.innie_trips (destination);

alter table public.innie_trips enable row level security;

create policy "Staff manage innie trips" on public.innie_trips
  for all using (public.is_staff()) with check (public.is_staff());
