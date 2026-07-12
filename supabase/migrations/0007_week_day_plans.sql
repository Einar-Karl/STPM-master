-- Day-by-day plan for a course week, in addition to the existing
-- week-level course/teacher assignment view.

create table public.course_week_days (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.course_weeks (id) on delete cascade,
  day_date date not null,
  title text,
  notes text,
  created_at timestamptz not null default now(),
  constraint course_week_days_unique unique (week_id, day_date)
);

create index course_week_days_week_id_idx on public.course_week_days (week_id);

alter table public.course_week_days enable row level security;

create policy "Staff manage course week days" on public.course_week_days
  for all using (public.is_staff()) with check (public.is_staff());

-- Auto-populate one row per calendar day whenever a course week is created,
-- so every week has a day-by-day plan to fill in by default.
create function public.handle_new_course_week()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.course_week_days (week_id, day_date)
  select new.id, gs::date
  from generate_series(new.start_date, new.end_date, interval '1 day') as gs
  on conflict (week_id, day_date) do nothing;
  return new;
end;
$$;

create trigger on_course_week_created
  after insert on public.course_weeks
  for each row execute function public.handle_new_course_week();

-- Backfill days for weeks that already exist.
insert into public.course_week_days (week_id, day_date)
select w.id, gs::date
from public.course_weeks w
cross join lateral generate_series(w.start_date, w.end_date, interval '1 day') as gs
on conflict (week_id, day_date) do nothing;
