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
  course bookings, hotels, hotel bookings, resources, staff admin.
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
2. **Adding staff**: Supabase dashboard → Authentication → Users → **Invite
   user**. A `public.profiles` row is created automatically (via a DB trigger)
   with the `staff` role.
3. **First admin**: after inviting yourself, promote your own account once via
   the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   After that, admins can promote/demote other staff from the in-app **Staff**
   page.
4. Email/password auth is used — no public sign-up page exists, so the only
   way in is via an admin invite.

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
