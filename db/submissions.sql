-- Points & service hours: submissions, approvals, and the VP-Ops event catalog.
-- Run AFTER db/supabase-roles.sql (reuses the `members` table + roles).
-- Paste into the Supabase SQL editor. Safe to re-run.
--
-- MODEL
--   Two SEPARATE tallies, never converted into each other:
--     * POINTS come from a catalog of `point_events` that VP Ops maintains. Each
--       event is worth a fixed number of points; a brother picks an event and
--       attaches proof. The point value is read from the event on the SERVER, so
--       it cannot be forged in the browser.
--     * SERVICE HOURS are free-form: a brother logs where they volunteered, how
--       many hours, and attaches proof. Hours are tracked as hours (not points).
--
-- SECURITY
--   The anon key runs in the browser, so status/points/reviewer are decided by
--   the SERVER (triggers below), never trusted from the client - otherwise a
--   pledge could insert an 'approved' row or a points:9999 row and self-award.
--
-- ⚠️ RESET: the drops below wipe existing submissions + point events (NOT the
--    members roster). That is fine pre-launch (test data only). Once you have
--    real submissions you want to keep, comment out section 0 before re-running.

-- 0) Reset the points objects (see warning above) ---------------------------
drop table if exists public.submissions   cascade;
drop table if exists public.point_events  cascade;
drop table if exists public.point_categories cascade;   -- retired: replaced by point_events

-- 1) Helper: may the caller review (approve/deny + manage events)? -----------
-- VP Ops sits on the e-board, so board/president/admin can review.
create or replace function public.can_review_submissions()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.members m
    where m.email = lower(auth.jwt() ->> 'email')
      and m.role in ('board','president','admin')
  );
$$;

-- 2) Point-events catalog (VP Ops maintains) --------------------------------
create table public.point_events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  points_value numeric not null default 0 check (points_value >= 0),
  description  text not null default '',
  event_date   date,
  active       boolean not null default true,   -- deactivate to hide from the submit form
  created_by   text references public.members(email),
  created_at   timestamptz not null default now()
);
create index point_events_active_idx on public.point_events (active);

alter table public.point_events enable row level security;

-- Any signed-in member may read the catalog (to pick an event when submitting).
drop policy if exists "point_events_select_authenticated" on public.point_events;
create policy "point_events_select_authenticated" on public.point_events
  for select to authenticated using (true);

-- Only reviewers (VP Ops / e-board / president / admin) create/edit/remove events.
drop policy if exists "point_events_write_reviewers" on public.point_events;
create policy "point_events_write_reviewers" on public.point_events
  for all to authenticated
  using (public.can_review_submissions())
  with check (public.can_review_submissions());

-- 3) Submissions -------------------------------------------------------------
create table public.submissions (
  id                uuid primary key default gen_random_uuid(),
  submitter_email   text not null references public.members(email) on delete cascade,
  submitter_name    text not null default '',
  type              text not null check (type in ('service_hours','points')),
  -- points submissions link an event (restrict = an event with submissions can't
  -- be hard-deleted, only deactivated, so history stays readable). null for hours.
  event_id          uuid references public.point_events(id) on delete restrict,
  event_description text not null default '',    -- service: what/where; points: optional note
  hours             numeric,                     -- service submissions only
  points            numeric not null default 0,  -- server-computed (see trigger)
  proof_path        text,                        -- path in the private `proofs` bucket
  status            text not null default 'pending'
                    check (status in ('pending','approved','denied')),
  reviewed_by       text references public.members(email),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);
create index submissions_submitter_idx on public.submissions (submitter_email);
create index submissions_status_idx    on public.submissions (status);

-- 4) Insert guard: force pending, compute points/hours by type, stamp name ----
create or replace function public.submissions_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ev_points numeric;
begin
  new.status      := 'pending';
  new.reviewed_by := null;
  new.reviewed_at := null;

  if new.type = 'points' then
    -- Point value comes from the linked, active event - never from the client.
    select points_value into ev_points
      from public.point_events where id = new.event_id and active;
    if ev_points is null then
      raise exception 'That event is not available for submissions.';
    end if;
    new.points := ev_points;
    new.hours  := null;
  else
    -- Service hours: tracked as hours, worth 0 points.
    new.event_id := null;
    new.points   := 0;
    new.hours    := greatest(0, coalesce(new.hours, 0));
    if new.hours = 0 then
      raise exception 'Service-hour submissions need a positive number of hours.';
    end if;
  end if;

  -- Trust the roster name over anything the client sent (fall back if blank).
  new.submitter_name := coalesce(
    nullif((select full_name from public.members where email = new.submitter_email), ''),
    new.submitter_name,
    ''
  );
  return new;
end;
$$;

drop trigger if exists submissions_before_insert on public.submissions;
create trigger submissions_before_insert
  before insert on public.submissions
  for each row execute function public.submissions_before_insert();

-- 5) Update guard: reviewers may only flip `status`; identity/time stamped ----
-- Reopening (status -> 'pending') clears the review stamp so it reads as fresh.
create or replace function public.submissions_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.submitter_email   := old.submitter_email;
  new.submitter_name    := old.submitter_name;
  new.type              := old.type;
  new.event_id          := old.event_id;
  new.event_description := old.event_description;
  new.hours             := old.hours;
  new.points            := old.points;
  new.proof_path        := old.proof_path;
  new.created_at        := old.created_at;

  if new.status = 'pending' then
    new.reviewed_by := null;
    new.reviewed_at := null;
  else
    new.reviewed_by := lower(auth.jwt() ->> 'email');
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists submissions_before_update on public.submissions;
create trigger submissions_before_update
  before update on public.submissions
  for each row execute function public.submissions_before_update();

-- 6) Row-Level Security ------------------------------------------------------
alter table public.submissions enable row level security;

-- Insert: a member may submit only as themselves.
drop policy if exists "submissions_insert_self" on public.submissions;
create policy "submissions_insert_self" on public.submissions
  for insert to authenticated
  with check (submitter_email = lower(auth.jwt() ->> 'email'));

-- Select: own rows, or all rows for reviewers.
drop policy if exists "submissions_select_own_or_reviewer" on public.submissions;
create policy "submissions_select_own_or_reviewer" on public.submissions
  for select to authenticated
  using (
    submitter_email = lower(auth.jwt() ->> 'email')
    or public.can_review_submissions()
  );

-- Update: reviewers only (approve / deny / reopen).
drop policy if exists "submissions_update_reviewer" on public.submissions;
create policy "submissions_update_reviewer" on public.submissions
  for update to authenticated
  using (public.can_review_submissions())
  with check (public.can_review_submissions());

-- Delete: reviewers only.
drop policy if exists "submissions_delete_reviewer" on public.submissions;
create policy "submissions_delete_reviewer" on public.submissions
  for delete to authenticated
  using (public.can_review_submissions());

-- 7) Proof-photo storage -----------------------------------------------------
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

drop policy if exists "proofs_insert_self" on storage.objects;
create policy "proofs_insert_self" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = lower(auth.jwt() ->> 'email')
  );

drop policy if exists "proofs_select_own_or_reviewer" on storage.objects;
create policy "proofs_select_own_or_reviewer" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'proofs'
    and (
      (storage.foldername(name))[1] = lower(auth.jwt() ->> 'email')
      or public.can_review_submissions()
    )
  );

-- 8) Seed a couple of example point events (edit / delete freely) ------------
-- Gives VP Ops something to see in the catalog on day one. Safe to remove.
insert into public.point_events (title, points_value, description) values
  ('Professional Workshop', 2, 'Resume, interview, or industry workshops.'),
  ('Chapter Social',        1, 'Brotherhood socials and retreats.'),
  ('Fundraiser / RUDM',     2, 'Dance Marathon and philanthropy drives.')
on conflict do nothing;

-- NOTE ON PLEDGE / POSITION ACCOUNTS
-- Brothers sign in with @rutgers.edu or @gmail.com. Pledges get a username ->
-- `<username>@pledge.rutgersakpsi.org`; positions (VP Ops) get e.g.
-- `ops@rutgersakpsi.org`. Create each as a Supabase Auth user with a password
-- AND a matching public.members row (role 'pledge' or 'board').
