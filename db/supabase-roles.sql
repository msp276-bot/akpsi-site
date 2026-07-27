-- ============================================================================
-- AKPsi Omicron Tau - Roster, roles & login allowlist  (Supabase / PostgreSQL)
-- ============================================================================
-- This is the RUNNABLE, authoritative setup for portal auth. Paste the whole
-- file into the Supabase SQL editor (Dashboard → SQL Editor → New query) and
-- run it once. It:
--   * creates the `members` table the portal reads/writes,
--   * locks it down so ONLY the president and admins can change roles,
--   * blocks anyone whose email is not on the roster from ever signing in.
--
-- IMPORTANT: edit the seed block at the very bottom with your real president and
-- tech-admin emails BEFORE running - you need at least one of them so someone
-- can log in and add everyone else from the website.
--
-- (The broader draft in db/schema.sql is aspirational design for later tables;
--  the members table defined here is the one the app actually uses today.)

-- 1) Roster table -----------------------------------------------------------
-- Allowed addresses: brothers use @rutgers.edu or @gmail.com; pledges use a
-- synthetic username account @pledge.rutgersakpsi.org; chapter positions
-- (e.g. VP Ops) use @rutgersakpsi.org. Keep these domains in sync with
-- ALLOWED_ROSTER_DOMAINS in src/lib/roles.ts. NOTE: this domain check is a
-- convention guard, not the security boundary - roster membership + the signup
-- allowlist trigger (section 4) are what actually gate who can sign in, so a
-- random @gmail.com still can't log in unless it is added to this table.
create table if not exists public.members (
  email       text primary key
              check (email = lower(email) and (
                email like '%@rutgers.edu'
                or email like '%@pledge.rutgersakpsi.org'
                or email like '%@rutgersakpsi.org'
                or email like '%@gmail.com'
              )),
  full_name   text not null default '',
  role        text not null default 'active'
              check (role in ('pledge','active','board','president','admin')),
  added_by    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Re-sync the email domain check even if the table was created by an earlier run
-- (create table if not exists leaves an existing constraint untouched). Idempotent.
do $$
begin
  alter table public.members drop constraint if exists members_email_check;
  alter table public.members add constraint members_email_check
    check (email = lower(email) and (
      email like '%@rutgers.edu'
      or email like '%@pledge.rutgersakpsi.org'
      or email like '%@rutgersakpsi.org'
      or email like '%@gmail.com'
    ));
end $$;

-- 2) Helper: does the current signed-in user have role-management rights? ----
-- Reads the caller's email from their auth JWT and checks their roster role.
-- SECURITY DEFINER so it can read `members` regardless of RLS.
create or replace function public.is_roster_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.email = lower(auth.jwt() ->> 'email')
      and m.role in ('president','admin')
  );
$$;

-- 3) Row-Level Security -----------------------------------------------------
alter table public.members enable row level security;

-- Any signed-in member can read the roster (needed for the directory and for
-- the app to resolve its own role at login).
drop policy if exists "members_select_authenticated" on public.members;
create policy "members_select_authenticated"
  on public.members for select
  to authenticated
  using (true);

-- Only the president / admin may add, change, or remove members.
drop policy if exists "members_insert_managers" on public.members;
create policy "members_insert_managers"
  on public.members for insert
  to authenticated
  with check (public.is_roster_manager());

drop policy if exists "members_update_managers" on public.members;
create policy "members_update_managers"
  on public.members for update
  to authenticated
  using (public.is_roster_manager())
  with check (public.is_roster_manager());

drop policy if exists "members_delete_managers" on public.members;
create policy "members_delete_managers"
  on public.members for delete
  to authenticated
  using (public.is_roster_manager());

-- Keep updated_at fresh on every change.
create or replace function public.members_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists members_touch on public.members;
create trigger members_touch before update on public.members
  for each row execute function public.members_touch_updated_at();

-- 3b) Lockout guard ---------------------------------------------------------
-- Managing roles is restricted to president/admin. If the LAST such account is
-- deleted or demoted, nobody can ever grant the role again from the website
-- (recovery would need the SQL editor / service role). Block that.
create or replace function public.prevent_last_manager_lockout()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  other_managers int;
begin
  select count(*) into other_managers
    from public.members
    where role in ('president','admin') and email <> old.email;

  if tg_op = 'DELETE' then
    if old.role in ('president','admin') and other_managers = 0 then
      raise exception
        'Cannot remove the last president/admin - it would lock everyone out of role management.';
    end if;
    return old;
  end if;

  -- UPDATE: only a demotion of the last manager is a problem.
  if old.role in ('president','admin')
     and new.role not in ('president','admin')
     and other_managers = 0 then
    raise exception
      'Cannot demote the last president/admin - it would lock everyone out of role management.';
  end if;
  return new;
end;
$$;

drop trigger if exists members_prevent_lockout on public.members;
create trigger members_prevent_lockout
  before update or delete on public.members
  for each row execute function public.prevent_last_manager_lockout();

-- 4) Login allowlist --------------------------------------------------------
-- Reject any sign-up whose email is not already on the roster. This fires when
-- Supabase first creates the auth user (first Google login or first magic
-- link), so random @rutgers.edu accounts can authenticate with Google but never
-- receive a session in this app.
create or replace function public.enforce_member_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.members m where m.email = lower(new.email)
  ) then
    raise exception
      'This email is not on the chapter roster. Ask the chapter president to add you.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_member_allowlist on auth.users;
create trigger enforce_member_allowlist
  before insert on auth.users
  for each row execute function public.enforce_member_allowlist();

-- 5) Seed the first manager(s) ---------------------------------------------
-- REQUIRED: replace these with real emails before anyone can log in. You need
-- at least one president/admin to bootstrap; they add everyone else from the
-- website afterwards.
insert into public.members (email, full_name, role, added_by) values
  ('president@rutgers.edu', 'Chapter President', 'president', 'seed'),
  ('tech@rutgers.edu',      'Tech Chair',        'admin',     'seed')
on conflict (email) do nothing;

-- 6) Pledge & position accounts (username/password logins) ------------------
-- Brothers sign in with Google / magic link (no password). Pledges and chapter
-- positions sign in with a PASSWORD, so each needs TWO things:
--   (a) a Supabase Auth user with that email + password
--       (Dashboard → Authentication → Users → Add user; or the Admin API), and
--   (b) a matching public.members row below (the allowlist trigger requires it).
-- Pledge email = <username>@pledge.rutgersakpsi.org (they log in with just the
-- username). VP Ops (Prak) = ops@rutgersakpsi.org, role 'board' so she can
-- review submissions. Example (edit / add rows, then create the Auth users):
--
-- insert into public.members (email, full_name, role, added_by) values
--   ('ops@rutgersakpsi.org',              'Prakruti Ankem', 'board',  'seed'),
--   ('jsmith@pledge.rutgersakpsi.org',    'Jane Smith',     'pledge', 'seed')
-- on conflict (email) do nothing;
