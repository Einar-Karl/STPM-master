# STPM Master — outstanding improvements

What's left to make this software better and smoother, grouped by area and
roughly ordered by impact within each group. Tick things off as they land.

## Do next (biggest friction right now)

- [ ] **Booking editing in the app** — the roster is read-only; payment status,
  special needs, arrival/departure etc. can only be fixed in the database.
  Add edit + add-participant forms on the session roster.
- [ ] **Real photos on the landing page** — drop 6 photos from
  smartteachersplaymore.com into `public/landing/photos/` as
  `photo-1.jpg` … `photo-6.jpg` (this session's sandbox couldn't reach the
  site to fetch them). The collage picks them up automatically.
- [ ] **Send email from the app** — sales drafts and itineraries are
  copy-paste today. Wire Gmail API or Resend so "send" is one click and the
  activity log updates itself.
- [ ] **Save feedback (toasts)** — every form saves silently; a small
  "Saved ✓" toast after each server action would remove a lot of doubt.
- [ ] **Mobile layout** — the fixed sidebar makes the app hard to use on a
  phone; collapse it behind a hamburger below `md`.

## Bookings & data

- [ ] Pagination + search on Course Bookings (890 rows render in one table).
- [ ] Move a participant between sessions (transfers happen every season).
- [ ] CSV import for next season's workbook; CSV export everywhere.
- [ ] "Duplicate season" tool: clone 2026's week structure into 2027.
- [ ] Table sorting (click a column header).
- [ ] Hotel & resource bookings linked from the week page (they exist as
  modules but aren't connected to planning yet).

## Communications

- [ ] Branded PDF itinerary (the print view is close — add logo + colors).
- [ ] One click "email this itinerary to all participants of the week".
- [ ] Automated pre-arrival email (2 weeks out: packing, meeting point, contacts).
- [ ] Post-week participant survey (public link, no login) feeding into retros.

## Sales / CRM

- [ ] Fill the ~37 leads still missing an email; confirm the guessed
  `@rvkskolar.is` addresses before first send.
- [ ] Follow-up reminders that reach you (email/push when the date hits —
  today it's only a dashboard badge).
- [ ] Auto-create outie leads from repeat coordinators in the bookings data.
- [ ] Duplicate-lead detection and merge.
- [ ] Pipeline value: expected group size + price per lead so the board shows
  potential revenue, and win/loss reasons on close.

## AI

- [ ] Streaming responses in the chatbot (feels much faster).
- [ ] Draft-and-confirm actions for the chatbot (add lead, log activity, set
  follow-up — with an approve step). Read-only was v1 by design.
- [ ] Persist chat history per user; scheduled monthly retro auto-summary.
- [ ] Move the AI key from `app_settings` to the `AI_API_KEY` env var in
  Vercel for stricter secrecy (staff can read the DB value today).

## Platform & polish

- [ ] Style the login page to match the new landing.
- [ ] Global search (Cmd+K) across weeks, participants, leads.
- [ ] Error monitoring (Sentry) + analytics on the landing page.
- [ ] CI: run tsc/eslint/build + a Playwright smoke test on every push
  (GitHub Actions).
- [ ] SEO for the landing: OG image, favicon set, sitemap, custom domain.
- [ ] GDPR housekeeping: privacy note on the landing, retention policy for
  participant data, and a data-export/delete path for requests.
- [ ] Icelandic localization of the app UI (the team may prefer it).
