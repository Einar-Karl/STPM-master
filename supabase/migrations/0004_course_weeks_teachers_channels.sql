-- Course-week planning: two business channels (Innies = Icelandic teachers
-- travelling abroad via endurmenntunarferdir.is, Outies = foreign teachers
-- coming to STPM courses via smartteachersplaymore.com), a teacher roster,
-- and course weeks that group the parallel course sessions of one week.

create type public.channel as enum ('innie', 'outie');

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  specializations text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.course_weeks (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  location text not null,
  channel public.channel not null default 'outie',
  label text not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint course_weeks_dates_check check (end_date >= start_date),
  constraint course_weeks_unique unique (start_date, location, channel)
);

alter table public.course_sessions
  add column week_id uuid references public.course_weeks (id) on delete set null,
  add column code text,
  add column lead_teacher_id uuid references public.teachers (id) on delete set null,
  add column support_teacher_id uuid references public.teachers (id) on delete set null;

create index course_sessions_week_id_idx on public.course_sessions (week_id);

-- Participant detail imported from the 2026 master bookings workbook.
-- Arrival/departure are free text in the source data ("February 14th",
-- "I have not booked a flight yet"), so they are text, not dates.

alter table public.course_bookings
  add column first_name text,
  add column nationality text,
  add column phone text,
  add column coordinator text,
  add column school text,
  add column participant_role text,
  add column arrival text,
  add column departure text,
  add column accommodation text,
  add column price numeric(10, 2),
  add column payment_status text,
  add column invoice_no text,
  add column payment_notes text,
  add column tour_booked boolean,
  add column special_needs text,
  add column group_label text,
  add column comments text;

alter table public.teachers enable row level security;
alter table public.course_weeks enable row level security;

create policy "Staff manage teachers" on public.teachers
  for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage course weeks" on public.course_weeks
  for all using (public.is_staff()) with check (public.is_staff());
