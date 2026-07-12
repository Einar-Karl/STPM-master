-- Sales channel: a light CRM for prospecting and cold-outreach, for both
-- channels. Innies (Icelandic teachers travelling abroad) sell to Icelandic
-- schools & kindergartens, so we seed a starter list of those to work through.

create type public.sales_stage as enum (
  'new', 'contacted', 'interested', 'negotiating', 'won', 'lost'
);

create table public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  channel public.channel not null default 'innie',
  org_type text not null default 'school',        -- 'school' | 'kindergarten' | 'other'
  name text not null,
  municipality text,
  contact_person text,
  email text,
  phone text,
  website text,
  stage public.sales_stage not null default 'new',
  last_contacted_at timestamptz,
  next_follow_up_at date,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  constraint sales_leads_channel_name_unique unique (channel, name)
);

create index sales_leads_channel_idx on public.sales_leads (channel);
create index sales_leads_stage_idx on public.sales_leads (stage);

alter table public.sales_leads enable row level security;

create policy "Staff manage sales leads" on public.sales_leads
  for all using (public.is_staff()) with check (public.is_staff());

-- Per-lead activity log: notes, calls, emails sent, stage changes.
create table public.sales_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.sales_leads (id) on delete cascade,
  kind text not null default 'note',              -- 'note' | 'call' | 'email' | 'meeting' | 'stage'
  body text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index sales_activities_lead_id_idx on public.sales_activities (lead_id);

alter table public.sales_activities enable row level security;

create policy "Staff manage sales activities" on public.sales_activities
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Seed: Icelandic schools & kindergartens for the Innies cold-call list.
-- Reykjavík city schools use the official <name>@rvkskolar.is convention
-- (confirm the exact address before sending). Other municipalities are seeded
-- name-only — use the in-app "Find email" helper to look them up and fill in.
-- Idempotent via the (channel, name) unique constraint.
-- ---------------------------------------------------------------------------
insert into public.sales_leads (channel, org_type, name, municipality, email, website)
values
  -- Reykjavík grunnskólar (compulsory schools)
  ('innie','school','Austurbæjarskóli','Reykjavík','austurbaejarskoli@rvkskolar.is',null),
  ('innie','school','Álftamýrarskóli','Reykjavík','alftamyrarskoli@rvkskolar.is',null),
  ('innie','school','Árbæjarskóli','Reykjavík','arbaejarskoli@rvkskolar.is',null),
  ('innie','school','Breiðholtsskóli','Reykjavík','breidholtsskoli@rvkskolar.is',null),
  ('innie','school','Breiðagerðisskóli','Reykjavík','breidagerdisskoli@rvkskolar.is',null),
  ('innie','school','Fellaskóli','Reykjavík','fellaskoli@rvkskolar.is',null),
  ('innie','school','Foldaskóli','Reykjavík','foldaskoli@rvkskolar.is',null),
  ('innie','school','Grandaskóli','Reykjavík','grandaskoli@rvkskolar.is',null),
  ('innie','school','Hagaskóli','Reykjavík','hagaskoli@rvkskolar.is',null),
  ('innie','school','Háaleitisskóli','Reykjavík','haaleitisskoli@rvkskolar.is',null),
  ('innie','school','Háteigsskóli','Reykjavík','hateigsskoli@rvkskolar.is',null),
  ('innie','school','Hlíðaskóli','Reykjavík','hlidaskoli@rvkskolar.is',null),
  ('innie','school','Hólabrekkuskóli','Reykjavík','holabrekkuskoli@rvkskolar.is',null),
  ('innie','school','Húsaskóli','Reykjavík','husaskoli@rvkskolar.is',null),
  ('innie','school','Ingunnarskóli','Reykjavík','ingunnarskoli@rvkskolar.is',null),
  ('innie','school','Langholtsskóli','Reykjavík','langholtsskoli@rvkskolar.is',null),
  ('innie','school','Laugalækjarskóli','Reykjavík','laugalaekjarskoli@rvkskolar.is',null),
  ('innie','school','Laugarnesskóli','Reykjavík','laugarnesskoli@rvkskolar.is',null),
  ('innie','school','Melaskóli','Reykjavík','melaskoli@rvkskolar.is',null),
  ('innie','school','Norðlingaskóli','Reykjavík','nordlingaskoli@rvkskolar.is',null),
  ('innie','school','Réttarholtsskóli','Reykjavík','rettarholtsskoli@rvkskolar.is',null),
  ('innie','school','Rimaskóli','Reykjavík','rimaskoli@rvkskolar.is',null),
  ('innie','school','Selásskóli','Reykjavík','selasskoli@rvkskolar.is',null),
  ('innie','school','Seljaskóli','Reykjavík','seljaskoli@rvkskolar.is',null),
  ('innie','school','Sæmundarskóli','Reykjavík','saemundarskoli@rvkskolar.is',null),
  ('innie','school','Vesturbæjarskóli','Reykjavík','vesturbaejarskoli@rvkskolar.is',null),
  ('innie','school','Víkurskóli','Reykjavík','vikurskoli@rvkskolar.is',null),
  ('innie','school','Vogaskóli','Reykjavík','vogaskoli@rvkskolar.is',null),
  ('innie','school','Ölduselsskóli','Reykjavík','olduselsskoli@rvkskolar.is',null),
  -- Reykjavík leikskólar (kindergartens) — city-run, confirm exact address
  ('innie','kindergarten','Leikskólinn Sunnufold','Reykjavík',null,null),
  ('innie','kindergarten','Leikskólinn Sæborg','Reykjavík',null,null),
  ('innie','kindergarten','Leikskólinn Múlaborg','Reykjavík',null,null),
  ('innie','kindergarten','Leikskólinn Hamrar','Reykjavík',null,null),
  ('innie','kindergarten','Leikskólinn Rofaborg','Reykjavík',null,null),
  ('innie','kindergarten','Leikskólinn Grænaborg','Reykjavík',null,null),
  ('innie','kindergarten','Leikskólinn Laufásborg','Reykjavík',null,null),
  ('innie','kindergarten','Leikskólinn Vesturborg','Reykjavík',null,null),
  ('innie','kindergarten','Leikskólinn Ægisborg','Reykjavík',null,null),
  ('innie','kindergarten','Leikskólinn Drafnarsteinn','Reykjavík',null,null),
  -- Kópavogur
  ('innie','school','Kópavogsskóli','Kópavogur',null,'https://kopavogsskoli.is'),
  ('innie','school','Digranesskóli','Kópavogur',null,null),
  ('innie','school','Hjallaskóli','Kópavogur',null,null),
  ('innie','school','Salaskóli','Kópavogur',null,'https://salaskoli.is'),
  ('innie','school','Smáraskóli','Kópavogur',null,null),
  ('innie','kindergarten','Leikskólinn Marbakki','Kópavogur',null,null),
  ('innie','kindergarten','Leikskólinn Álfaheiði','Kópavogur',null,null),
  -- Hafnarfjörður
  ('innie','school','Lækjarskóli','Hafnarfjörður',null,null),
  ('innie','school','Öldutúnsskóli','Hafnarfjörður',null,null),
  ('innie','school','Víðistaðaskóli','Hafnarfjörður',null,null),
  ('innie','school','Hraunvallaskóli','Hafnarfjörður',null,'https://hraunvallaskoli.is'),
  ('innie','kindergarten','Leikskólinn Stekkjarás','Hafnarfjörður',null,null),
  ('innie','kindergarten','Leikskólinn Hvammur','Hafnarfjörður',null,null),
  -- Garðabær
  ('innie','school','Flataskóli','Garðabær',null,null),
  ('innie','school','Hofsstaðaskóli','Garðabær',null,null),
  ('innie','school','Sjálandsskóli','Garðabær',null,null),
  ('innie','kindergarten','Leikskólinn Kirkjuból','Garðabær',null,null),
  -- Mosfellsbær
  ('innie','school','Varmárskóli','Mosfellsbær',null,null),
  ('innie','school','Lágafellsskóli','Mosfellsbær',null,'https://lagafellsskoli.is'),
  ('innie','kindergarten','Leikskólinn Hulduberg','Mosfellsbær',null,null),
  -- Akureyri
  ('innie','school','Brekkuskóli','Akureyri',null,null),
  ('innie','school','Glerárskóli','Akureyri',null,null),
  ('innie','school','Oddeyrarskóli','Akureyri',null,null),
  ('innie','kindergarten','Leikskólinn Pálmholt','Akureyri',null,null),
  -- Reykjanesbær
  ('innie','school','Myllubakkaskóli','Reykjanesbær',null,null),
  ('innie','school','Njarðvíkurskóli','Reykjanesbær',null,null),
  ('innie','kindergarten','Leikskólinn Tjarnarsel','Reykjanesbær',null,null)
on conflict (channel, name) do nothing;
