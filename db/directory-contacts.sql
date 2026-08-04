-- ============================================================================
-- AKPsi Omicron Tau - Member contact info for the portal directory (SCHEMA)
-- ============================================================================
-- Stores each member's EMAIL + LinkedIn PRIVATELY so it is visible ONLY to
-- signed-in members. This is deliberately NOT in the site code: the site is a
-- static export, so anything in src/ ships in the public JS bundle. Contact
-- info lives here, behind Row-Level Security, and the directory fetches it at
-- runtime with the logged-in member's session.
--
-- This file contains ONLY the table + security definitions and is safe to keep
-- in the (public) repo. The actual rows (real emails) are PII and must NEVER be
-- committed - they live in db/directory-contacts-seed.local.sql, which is
-- gitignored. Run this file first, then run the seed file, both in the Supabase
-- SQL editor.
--
-- RUN ORDER: db/supabase-roles.sql  ->  this file  ->  the .local seed file.
-- (This relies on public.members existing to decide who may edit contacts.)

-- 1) Table ------------------------------------------------------------------
-- `slug` matches the member's slug in src/data/members.ts so the directory can
-- join contact info onto the card it already renders.
create table if not exists public.member_contacts (
  slug        text primary key,
  full_name   text not null default '',
  email       text not null,
  linkedin    text,
  cohort      text,
  class_year  text,
  updated_at  timestamptz not null default now()
);

-- 2) Row-Level Security -----------------------------------------------------
alter table public.member_contacts enable row level security;

-- Any signed-in member may READ contacts (this is what the directory uses).
-- The anon role has no policy, so logged-out visitors (and the public JS
-- bundle's anon key) can never read these rows.
drop policy if exists "member_contacts_select_authenticated" on public.member_contacts;
create policy "member_contacts_select_authenticated"
  on public.member_contacts for select
  to authenticated
  using (true);

-- Only the president / admin may add or edit contact info. Checked directly
-- against the roster so this file doesn't depend on helper functions.
drop policy if exists "member_contacts_write_managers" on public.member_contacts;
create policy "member_contacts_write_managers"
  on public.member_contacts for all
  to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.email = lower(auth.jwt() ->> 'email')
        and m.role in ('president', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.members m
      where m.email = lower(auth.jwt() ->> 'email')
        and m.role in ('president', 'admin')
    )
  );

-- Keep updated_at fresh.
create or replace function public.member_contacts_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists member_contacts_touch on public.member_contacts;
create trigger member_contacts_touch before update on public.member_contacts
  for each row execute function public.member_contacts_touch_updated_at();

-- 3) Seed --------------------------------------------------------------------
-- The rows (real emails) are PII. Keep them OUT of this public file. Run
-- db/directory-contacts-seed.local.sql (gitignored) after this file. Its rows
-- look like:
--
--   insert into public.member_contacts (slug, full_name, email, linkedin, cohort) values
--     ('marvin-patel', 'Marvin Patel', 'name@example.com', 'https://linkedin.com/in/...', 'Beta Founding')
--   on conflict (slug) do update set
--     full_name = excluded.full_name, email = excluded.email,
--     linkedin = excluded.linkedin, cohort = excluded.cohort, updated_at = now();
