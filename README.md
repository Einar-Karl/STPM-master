# STPM Master

Internal booking & planning tool for STPM: course scheduling, course
enrollments, hotel bookings for clients/groups, and internal resources
(rooms, vehicles, equipment). Staff-only, with admin/staff roles.

Stack: Next.js (App Router) + Supabase (Postgres, Auth, RLS), deployed on
Vercel.

## Project structure

- `supabase/migrations/` — versioned SQL schema (tables, RLS policies). Applied
  directly to the Supabase project; keep this in sync if you change the schema.
- `src/app/login` — staff sign-in.
- `src/app/(app)` — everything behind login: dashboard, clients, courses,
  course bookings, hotels, hotel bookings, resources, sales, staff admin.
- `src/lib/supabase` — browser/server Supabase clients and generated DB types.
- `src/proxy.ts` — session-refresh + auth-gate (Next.js 16 renamed
  `middleware.ts` to `proxy.ts`; same purpose).

## Data model

- **profiles** — one row per staff Supabase Auth user, role `staff` or `admin`.
- **clients** — individuals, companies, or groups (course/hotel customers).
- **courses** / **course_sessions** — a course catalog and its scheduled runs
  (dates, location, capacity).
- **course_bookings** — participants/clients enrolled in a session.
- **hotels** / **hotel_rooms** / **hotel_bookings** — accommodation booked for
  clients or groups, optionally linked to a course session.
- **resources** / **resource_bookings** — internal bookable resources
  (meeting rooms, vehicles, equipment).

Row Level Security is enabled on every table: any signed-in staff member can
manage all business data; only admins can manage staff accounts/roles.

## Local development

```bash
npm install
npm run dev
```

Requires a `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

(see `.env.example`). Get these from the Supabase dashboard under
**Project Settings → API**.

## Supabase setup

1. The schema lives in `supabase/migrations/`. Apply it to a Supabase project
   (via the SQL editor, the Supabase CLI, or the Supabase MCP tools) in order.
2. **Adding staff**: staff can request access themselves at `/signup`, or you
   can invite from the Supabase dashboard → Authentication → Users → **Invite
   user**. Either way, a `public.profiles` row is created automatically (via a
   DB trigger) with the `pending` role — RLS blocks all business data for
   pending accounts, so a new signup can't see anything until approved.
3. **Approving staff**: admins approve pending signups from the in-app
   **Staff** page (pending requests show at the top with an Approve button).
   Same page lets admins promote/demote between `staff` and `admin`, or push
   someone back to `pending` to revoke access.
4. **First admin**: after your own account signs up (or is invited), promote
   it once via the SQL editor — this bootstraps the very first admin, since no
   one else can approve them yet:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
5. Recommended: in Supabase dashboard → Authentication → Policies, enable
   **leaked password protection** now that there's a public signup form
   accepting passwords.

### Your login

An admin account already exists:

- **Email:** einkjon@gmail.com
- **Password:** Stpm-Master-2026  *(change it in Supabase → Authentication → Users)*

Because the database uses row-level security, data is only visible to
signed-in staff. (There is an optional `DISABLE_AUTH=true` escape hatch in
the code, but it can't read data under RLS unless you also open the database
to the public key — not recommended. Just log in.)

## Loading the 2026 data

The full 2026 dataset (teachers, courses, 20 course weeks, 147 sessions and
~890 participants) lives in `supabase/seed_2026.sql`. To load it:

1. Supabase Dashboard → **SQL Editor** → New query
2. Paste the entire contents of `supabase/seed_2026.sql`
3. **Run**

It's idempotent — safe to re-run. Participants are cleared and re-imported;
teachers/courses/weeks/sessions are guarded so they aren't duplicated.

### Channels

Bookings belong to one of two channels:

- **Outies** — foreign teachers coming to STPM courses
  ([smartteachersplaymore.com](https://www.smartteachersplaymore.com/)). All
  the 2026 workbook data is this channel.
- **Innies** — Icelandic teachers travelling abroad
  ([endurmenntunarferdir.is](https://endurmenntunarferdir.is/)). Starts empty;
  add weeks with channel = innie when you have that data.

### Planning a course week

**Course Weeks** in the app lists every week (filterable by channel) with its
location, course count, participant count and staffing status. Open a week to
assign a **lead** and **support** teacher to each course and confirm the
location; open a course to see the full participant roster (who's on it,
nationality, school, payment, tour). Manage the assignable teacher list under
**Teachers**.

The **Day by day** tab on a week is a shareable itinerary: fill in a title and
plan for each day (Edit plan), then switch to Preview / share to copy the
programme into an email or print it / save as PDF to send to participants. The
dashboard timeline bars show the number of **registered participants** per week.

### Sales channel

**Sales** (in the nav) is a light CRM for both channels:

- **Outies** — market intelligence from the participant data: which countries
  send the most teachers, the top group **coordinators** (repeat accounts worth
  nurturing), and rule-based suggested sales moves.
- **Innies** — a cold-call list of Icelandic **schools & kindergartens** with a
  contact pipeline (New → Contacted → Interested → … → Won/Lost). Each lead has
  a school-specific, ready-to-send outreach **email draft** (Icelandic or
  English) offering a study trip built from the destinations STPM runs; copy it
  into email or open it with one click. Track last-contact date, follow-ups due,
  notes and an activity log. Rows missing an email get a one-click **Find email**
  web search. Reykjavík city schools are seeded with the `@rvkskolar.is`
  convention — confirm the exact address before sending.

The lead list lives in `sales_leads` / `sales_activities` (migration `0008`).

## Deploying to Vercel

1. Push this repository to GitHub (already done if you're reading this from
   the repo).
2. In Vercel: **Add New → Project**, import the repo.
3. Framework preset: Next.js (auto-detected).
4. Add environment variables (Project Settings → Environment Variables),
   same two as `.env.local` above, for Production/Preview/Development.
5. Deploy. Vercel builds with `next build` and serves the app; the `proxy.ts`
   file runs as Vercel Edge Middleware automatically, no extra config needed.
6. After the first deploy, invite yourself as staff (see above) using the
   **same Supabase project** the deployed env vars point to.

## Notes

- There is no service-role key anywhere in this app — all access goes through
  the anon/publishable key plus RLS. Never add
  `SUPABASE_SERVICE_ROLE_KEY` to client-reachable code.
- Removing a staff member's login access requires deleting their user in the
  Supabase dashboard (Authentication → Users) — the in-app Staff page can only
  change roles, not delete accounts, since account deletion needs the
  service-role key.
