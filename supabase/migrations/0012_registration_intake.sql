-- Online-registration intake: let the public website (Kajabi) post new
-- registrations straight onto a course roster via a webhook, instead of a
-- Google Sheet in the middle.
--
-- registration_key routes an inbound registration to a specific course session
-- (staff set a matching key on the course and in the Kajabi form/automation).
-- registration_events is a visible log of everything that arrives, so staff can
-- confirm it worked and spot anything that didn't route.

alter table public.course_sessions add column registration_key text;

create unique index course_sessions_registration_key_idx
  on public.course_sessions (registration_key)
  where registration_key is not null;

create table public.registration_events (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'kajabi',
  participant_name text,
  email text,
  registration_key text,
  session_id uuid references public.course_sessions (id) on delete set null,
  status text not null,                 -- 'imported' | 'duplicate' | 'unmatched' | 'invalid'
  detail text,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index registration_events_created_at_idx on public.registration_events (created_at desc);

alter table public.registration_events enable row level security;

-- Staff can read/manage the log in the app. The webhook itself writes with the
-- service role, which bypasses RLS, so no public-insert policy is needed.
create policy "Staff read registration events" on public.registration_events
  for all using (public.is_staff()) with check (public.is_staff());
