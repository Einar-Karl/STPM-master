-- Links to external Google Sheets / questionnaires managed per course week.
alter table public.course_weeks
  add column signup_sheet_url text,
  add column hotel_questionnaire_url text;

comment on column public.course_weeks.signup_sheet_url is
  'Google Sheet used to collect Innies school sign-ups for this course week/trip.';
comment on column public.course_weeks.hotel_questionnaire_url is
  'Link to the hotel/accommodation questionnaire for this course week.';
