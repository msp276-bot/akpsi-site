-- Portal content: announcements, chapter events, and event RSVPs.
-- Run AFTER db/supabase-roles.sql (reuses the `members` table + roles).
-- Independent of db/submissions.sql. Paste into the Supabase SQL editor.
-- Safe to re-run: policies/triggers are dropped-and-recreated; tables use
-- `create table if not exists` so existing rows are preserved.
--
-- MODEL
--   * ANNOUNCEMENTS   - e-board posts; every member reads the ones their role is
--     allowed to see (visibility). E-board can edit and delete any post.
--   * CHAPTER_EVENTS  - e-board creates/edits/deletes calendar events. Members
--     read the events their role can see.
--   * EVENT_RSVPS     - one row per (event, member). A member sets their OWN
--     status (going/maybe/declined/waitlist); e-board can add or remove ANY
--     member from an event's attendee list. The "going" count shown on the
--     calendar is derived from these rows, not stored on the event.
--
-- SECURITY
--   The anon key runs in the browser, so who-can-write is enforced by RLS here,
--   never by client code. Author/created_by/attendee identity is stamped from
--   the JWT by triggers so it cannot be forged.

-- 1) Helpers -----------------------------------------------------------------
create or replace function public.member_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.members where email = lower(auth.jwt() ->> 'email');
$$;

-- E-board / president / admin may manage chapter content.
create or replace function public.can_manage_content()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.member_role() in ('board','president','admin'), false);
$$;

-- Mirrors canAccessVisibility() in src/lib/access.ts: e-board sees everything;
-- everyone sees public/members; active-only and pledge-only are role-scoped.
create or replace function public.can_view_visibility(vis text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when public.can_manage_content()   then true
    when vis in ('public','members')   then true
    when vis = 'active'                then public.member_role() = 'active'
    when vis = 'pledge'                then public.member_role() = 'pledge'
    else false
  end;
$$;

-- 2) Announcements -----------------------------------------------------------
create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  author_email text references public.members(email) on delete set null,
  author_name  text not null default '',
  pinned       boolean not null default false,
  visibility   text not null default 'members'
               check (visibility in ('public','members','active','pledge','eboard')),
  likes        integer not null default 0,
  comments     integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists announcements_created_idx on public.announcements (created_at desc);

-- Stamp the author from the JWT + roster on insert (cannot be forged/spoofed).
create or replace function public.announcements_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.author_email := lower(auth.jwt() ->> 'email');
  new.author_name  := coalesce(
    nullif((select full_name from public.members where email = new.author_email), ''),
    new.author_name, ''
  );
  new.likes    := 0;
  new.comments := 0;
  return new;
end;
$$;
drop trigger if exists announcements_before_insert on public.announcements;
create trigger announcements_before_insert
  before insert on public.announcements
  for each row execute function public.announcements_before_insert();

alter table public.announcements enable row level security;

drop policy if exists "announcements_select_by_visibility" on public.announcements;
create policy "announcements_select_by_visibility" on public.announcements
  for select to authenticated
  using (public.can_view_visibility(visibility));

drop policy if exists "announcements_write_managers" on public.announcements;
create policy "announcements_write_managers" on public.announcements
  for all to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

-- 3) Chapter events ----------------------------------------------------------
create table if not exists public.chapter_events (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  starts_at      timestamptz not null,
  ends_at        timestamptz,
  location       text not null default '',
  type           text not null default 'general'
                 check (type in ('professional','social','recruitment','general')),
  description    text not null default '',
  map_url        text,
  max_attendees  integer,
  requires_rsvp  boolean not null default true,
  visibility     text not null default 'members'
                 check (visibility in ('public','members','active','pledge','eboard')),
  created_by     text references public.members(email) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists chapter_events_starts_idx on public.chapter_events (starts_at);

create or replace function public.chapter_events_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.created_by := lower(auth.jwt() ->> 'email');
  return new;
end;
$$;
drop trigger if exists chapter_events_before_insert on public.chapter_events;
create trigger chapter_events_before_insert
  before insert on public.chapter_events
  for each row execute function public.chapter_events_before_insert();

alter table public.chapter_events enable row level security;

drop policy if exists "chapter_events_select_by_visibility" on public.chapter_events;
create policy "chapter_events_select_by_visibility" on public.chapter_events
  for select to authenticated
  using (public.can_view_visibility(visibility));

drop policy if exists "chapter_events_write_managers" on public.chapter_events;
create policy "chapter_events_write_managers" on public.chapter_events
  for all to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

-- 4) Event RSVPs -------------------------------------------------------------
create table if not exists public.event_rsvps (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.chapter_events(id) on delete cascade,
  member_email text not null references public.members(email) on delete cascade,
  member_name  text not null default '',
  status       text not null default 'going'
               check (status in ('going','maybe','declined','waitlist')),
  created_at   timestamptz not null default now(),
  unique (event_id, member_email)
);
create index if not exists event_rsvps_event_idx on public.event_rsvps (event_id);

-- Stamp the display name from the roster so the attendee list is trustworthy.
create or replace function public.event_rsvps_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.member_email := lower(new.member_email);
  new.member_name  := coalesce(
    nullif((select full_name from public.members where email = new.member_email), ''),
    new.member_name, ''
  );
  return new;
end;
$$;
drop trigger if exists event_rsvps_before_write on public.event_rsvps;
create trigger event_rsvps_before_write
  before insert or update on public.event_rsvps
  for each row execute function public.event_rsvps_before_write();

alter table public.event_rsvps enable row level security;

-- Any signed-in member may read RSVPs (to show attendee counts + initials).
drop policy if exists "event_rsvps_select_authenticated" on public.event_rsvps;
create policy "event_rsvps_select_authenticated" on public.event_rsvps
  for select to authenticated using (true);

-- A member manages their OWN RSVP; e-board can add/remove anyone.
drop policy if exists "event_rsvps_insert_self_or_manager" on public.event_rsvps;
create policy "event_rsvps_insert_self_or_manager" on public.event_rsvps
  for insert to authenticated
  with check (
    member_email = lower(auth.jwt() ->> 'email') or public.can_manage_content()
  );

drop policy if exists "event_rsvps_update_self_or_manager" on public.event_rsvps;
create policy "event_rsvps_update_self_or_manager" on public.event_rsvps
  for update to authenticated
  using (member_email = lower(auth.jwt() ->> 'email') or public.can_manage_content())
  with check (member_email = lower(auth.jwt() ->> 'email') or public.can_manage_content());

drop policy if exists "event_rsvps_delete_self_or_manager" on public.event_rsvps;
create policy "event_rsvps_delete_self_or_manager" on public.event_rsvps
  for delete to authenticated
  using (member_email = lower(auth.jwt() ->> 'email') or public.can_manage_content());

-- 5) Seed a few events so the calendar isn't empty on day one -----------------
-- Safe to remove. Dates are illustrative; e-board edits/replaces them.
insert into public.chapter_events (title, starts_at, ends_at, location, type, description, requires_rsvp, visibility)
values
  ('Fall Rush Info Session', now() + interval '3 days',  now() + interval '3 days 90 minutes',
   'Business School, Room 1140', 'recruitment',
   'Kick off the recruitment cycle. Meet the brothers and learn what AKPsi is about.', true, 'public'),
  ('Resume Workshop with Alumni', now() + interval '6 days', now() + interval '6 days 90 minutes',
   'Livingston Student Center', 'professional',
   'Bring your resume for one-on-one reviews with alumni in consulting, finance, and tech.', true, 'members'),
  ('Weekly Chapter Meeting', now() + interval '9 days', now() + interval '9 days 75 minutes',
   'Business School, Room 1050', 'general',
   'Standing weekly meeting: committee updates, announcements, and planning.', true, 'active')
on conflict do nothing;
