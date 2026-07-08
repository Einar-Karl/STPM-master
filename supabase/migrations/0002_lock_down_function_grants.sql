-- Least-privilege cleanup: these functions back RLS policies and an auth
-- trigger, they are not meant to be called directly via the PostgREST API.

revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
