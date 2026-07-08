-- STPM master booking & planning schema
-- Enums

create type public.staff_role as enum ('staff', 'admin');
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type public.client_type as enum ('individual', 'company', 'group');
create type public.resource_type as enum ('room', 'equipment', 'vehicle', 'other');

-- Staff profiles (one row per Supabase Auth user)

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.staff_role not null default 'staff',
  created_at timestamptz not null default now()
);

-- Clients: individuals, companies or groups that courses/hotel stays are booked for

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  type public.client_type not null default 'individual',
  name text not null,
  contact_person text,
  email text,
  phone text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Course catalog

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_days int,
  price numeric(10, 2),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Scheduled instances of a course (a specific run with dates/location/capacity)

create table public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  location text,
  start_date date not null,
  end_date date not null,
  capacity int,
  status public.booking_status not null default 'confirmed',
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint course_sessions_dates_check check (end_date >= start_date)
);

create index course_sessions_course_id_idx on public.course_sessions (course_id);

-- Bookings of a client/participant onto a course session

create table public.course_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  participant_name text not null,
  participant_email text,
  seats int not null default 1,
  status public.booking_status not null default 'pending',
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index course_bookings_session_id_idx on public.course_bookings (session_id);
create index course_bookings_client_id_idx on public.course_bookings (client_id);

-- Hotels used for client/group accommodation

create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  contact_info text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.hotel_rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  name text not null,
  room_type text,
  capacity int not null default 1,
  created_at timestamptz not null default now()
);

create index hotel_rooms_hotel_id_idx on public.hotel_rooms (hotel_id);

-- Hotel bookings for a client/group, optionally tied to a course session

create table public.hotel_bookings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  room_id uuid references public.hotel_rooms (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  guest_name text not null,
  guests int not null default 1,
  check_in date not null,
  check_out date not null,
  status public.booking_status not null default 'pending',
  course_session_id uuid references public.course_sessions (id) on delete set null,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint hotel_bookings_dates_check check (check_out > check_in)
);

create index hotel_bookings_hotel_id_idx on public.hotel_bookings (hotel_id);
create index hotel_bookings_client_id_idx on public.hotel_bookings (client_id);
create index hotel_bookings_course_session_id_idx on public.hotel_bookings (course_session_id);

-- Generic internal resources (meeting rooms, vehicles, equipment) and their bookings

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.resource_type not null default 'other',
  description text,
  created_at timestamptz not null default now()
);

create table public.resource_bookings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  course_session_id uuid references public.course_sessions (id) on delete set null,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint resource_bookings_time_check check (end_at > start_at)
);

create index resource_bookings_resource_id_idx on public.resource_bookings (resource_id);

-- Auto-create a profile row whenever a new Supabase Auth user is created.
-- New staff are added via Authentication > Invite user in the Supabase dashboard;
-- promote the first admin manually (see README).

create function public.handle_new_user()
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
    'staff'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: this is an internal staff tool, so any authenticated
-- staff member (a row in public.profiles) can manage all business data.
-- Only admins can manage staff accounts/roles.

create function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.courses enable row level security;
alter table public.course_sessions enable row level security;
alter table public.course_bookings enable row level security;
alter table public.hotels enable row level security;
alter table public.hotel_rooms enable row level security;
alter table public.hotel_bookings enable row level security;
alter table public.resources enable row level security;
alter table public.resource_bookings enable row level security;

create policy "Staff can view all profiles" on public.profiles
  for select using (public.is_staff());
create policy "Admins can add profiles" on public.profiles
  for insert with check (public.is_admin());
create policy "Admins manage profiles, staff edit self" on public.profiles
  for update using (public.is_admin() or id = auth.uid());
create policy "Admins can remove profiles" on public.profiles
  for delete using (public.is_admin());

create policy "Staff manage clients" on public.clients
  for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage courses" on public.courses
  for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage course sessions" on public.course_sessions
  for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage course bookings" on public.course_bookings
  for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage hotels" on public.hotels
  for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage hotel rooms" on public.hotel_rooms
  for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage hotel bookings" on public.hotel_bookings
  for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage resources" on public.resources
  for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage resource bookings" on public.resource_bookings
  for all using (public.is_staff()) with check (public.is_staff());
