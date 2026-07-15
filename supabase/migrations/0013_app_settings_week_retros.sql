-- App settings (AI provider config) + course-week retros.

-- Simple key/value settings store. Used for the AI assistant configuration
-- (provider, model, API key, enabled flag) so admins can change it live.
-- NOTE: rows are readable by all staff (the chat runs under the caller's
-- session, so staff sessions must be able to read the config, including the
-- key). For a small internal team that's an accepted trade-off; the
-- AI_API_KEY env var can be used instead if you want the key out of the DB.
create table public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "Staff read app settings" on public.app_settings
  for select using (public.is_staff());

create policy "Admins manage app settings" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- What-went-well / what-could-be-better retro entries, one or more per course
-- week (each staff member can add their own).
create table public.week_retros (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.course_weeks (id) on delete cascade,
  went_well text,
  could_improve text,
  rating int check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index week_retros_week_id_idx on public.week_retros (week_id);

alter table public.week_retros enable row level security;

create policy "Staff manage week retros" on public.week_retros
  for all using (public.is_staff()) with check (public.is_staff());
