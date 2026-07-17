-- 1. Venue finder: each seminar day can carry its own meeting point / address so
--    participants can be shown a map of "this is where we meet today".
alter table public.course_session_days
  add column if not exists location text;

-- 2. Preparation checklists: an action plan per course week (planner) and per
--    course session (teacher). Items are seeded from templates in the app and
--    can be added to / ticked off as the week is prepared.
create table public.prep_tasks (
  id uuid primary key default gen_random_uuid(),
  week_id uuid references public.course_weeks (id) on delete cascade,
  session_id uuid references public.course_sessions (id) on delete cascade,
  role text not null check (role in ('planner', 'teacher')),
  label text not null,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  -- planner tasks hang off a week, teacher tasks off a course session
  constraint prep_tasks_scope check (
    (role = 'planner' and week_id is not null and session_id is null)
    or (role = 'teacher' and session_id is not null and week_id is null)
  )
);

create index prep_tasks_week_id_idx on public.prep_tasks (week_id);
create index prep_tasks_session_id_idx on public.prep_tasks (session_id);

alter table public.prep_tasks enable row level security;

create policy "Staff manage prep tasks" on public.prep_tasks
  for all using (public.is_staff()) with check (public.is_staff());
