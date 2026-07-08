-- Wrap auth.uid() in a subselect so Postgres evaluates it once per
-- statement instead of once per row (see Supabase RLS performance guide).

drop policy "Admins manage profiles, staff edit self" on public.profiles;

create policy "Admins manage profiles, staff edit self" on public.profiles
  for update using (public.is_admin() or id = (select auth.uid()));
