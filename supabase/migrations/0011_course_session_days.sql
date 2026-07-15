-- Per-course daily schedule: each course session (e.g. "AI in Education") gets
-- one row per seminar day so the lead teacher can build a day-by-day programme
-- for their own group — separate from the week-level day plan (course_week_days).

create table public.course_session_days (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions (id) on delete cascade,
  day_date date not null,
  title text,
  notes text,
  created_at timestamptz not null default now(),
  constraint course_session_days_unique unique (session_id, day_date)
);

create index course_session_days_session_id_idx on public.course_session_days (session_id);

alter table public.course_session_days enable row level security;

create policy "Staff manage course session days" on public.course_session_days
  for all using (public.is_staff()) with check (public.is_staff());

-- Auto-populate one row per seminar day whenever a course session is created.
create function public.handle_new_course_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.course_session_days (session_id, day_date)
  select new.id, gs::date
  from generate_series(new.start_date, new.end_date, interval '1 day') as gs
  on conflict (session_id, day_date) do nothing;
  return new;
end;
$$;

create trigger on_course_session_created
  after insert on public.course_sessions
  for each row execute function public.handle_new_course_session();

-- Backfill days for sessions that already exist.
insert into public.course_session_days (session_id, day_date)
select s.id, gs::date
from public.course_sessions s
cross join lateral generate_series(s.start_date, s.end_date, interval '1 day') as gs
on conflict (session_id, day_date) do nothing;
