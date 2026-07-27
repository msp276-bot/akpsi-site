-- Service-hours / brother-points submissions + approvals.
-- Run AFTER db/supabase-roles.sql (reuses the `members` table + roles).
-- Paste into the Supabase SQL editor.

-- 1) Table -----------------------------------------------------------------
create table if not exists public.submissions (
  id                uuid primary key default gen_random_uuid(),
  submitter_email   text not null references public.members(email) on delete cascade,
  submitter_name    text not null default '',
  category_id       text not null,
  event_description text not null default '',
  hours             numeric,
  points            numeric not null default 0,
  proof_path        text,                              -- path in the `proofs` bucket
  status            text not null default 'pending'
                    check (status in ('pending','approved','denied')),
  reviewed_by       text references public.members(email),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists submissions_submitter_idx on public.submissions (submitter_email);
create index if not exists submissions_status_idx on public.submissions (status);

-- 2) Helper: may the caller review (approve/deny) submissions? --------------
-- VP Ops sits on the e-board, so board/president/admin can review.
create or replace function public.can_review_submissions()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.members m
    where m.email = lower(auth.jwt() ->> 'email')
      and m.role in ('board','president','admin')
  );
$$;

-- 3) Row-Level Security ----------------------------------------------------
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

-- Update: only reviewers (approve/deny). Submitters cannot edit after sending.
drop policy if exists "submissions_update_reviewer" on public.submissions;
create policy "submissions_update_reviewer" on public.submissions
  for update to authenticated
  using (public.can_review_submissions())
  with check (public.can_review_submissions());

-- Delete: reviewers only (optional housekeeping).
drop policy if exists "submissions_delete_reviewer" on public.submissions;
create policy "submissions_delete_reviewer" on public.submissions
  for delete to authenticated
  using (public.can_review_submissions());

-- 4) Proof-photo storage ---------------------------------------------------
-- Private bucket; the client reads via short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

-- Upload: a member may upload only into their own folder (path = "<email>/...").
drop policy if exists "proofs_insert_self" on storage.objects;
create policy "proofs_insert_self" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = lower(auth.jwt() ->> 'email')
  );

-- Read: own folder, or any object for reviewers.
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

-- NOTE ON PLEDGE / POSITION ACCOUNTS
-- Brothers sign in with @rutgers.edu. Pledges get a username -> a synthetic
-- email `<username>@pledge.rutgersakpsi.org`; positions (VP Ops) get e.g.
-- `ops@rutgersakpsi.org`. Create these as Supabase Auth users with a password
-- (Dashboard → Authentication → Add user, or the Admin API) AND add a matching
-- row to public.members with the right role ('pledge' or 'board'). The signup
-- allowlist trigger in supabase-roles.sql still requires a members row to exist.
