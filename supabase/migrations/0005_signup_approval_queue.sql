-- Self-service staff signup with an admin approval queue.
--
-- New accounts (whether created via self-signup or an admin invite) start
-- as 'pending' and have no access to business data until an admin promotes
-- them to 'staff' (or 'admin') on the Staff page. This keeps the signup
-- page safe to expose publicly.

alter type public.staff_role add value if not exists 'pending';
