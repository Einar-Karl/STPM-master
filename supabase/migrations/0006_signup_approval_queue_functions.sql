-- New accounts default to 'pending' instead of 'staff'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    'pending'
  );
  return new;
end;
$$;

-- is_staff() now excludes pending accounts, so RLS blocks all business
-- data for anyone awaiting approval.
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

-- Pending users can still see their own profile row (to show a "waiting
-- for approval" screen), even though is_staff() is false for them.
create policy "Users can view own profile" on public.profiles
  for select using (id = (select auth.uid()));
