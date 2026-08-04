-- ============================================================================
-- AKPsi Omicron Tau - Rush application intake + review
-- ============================================================================
-- Public applicants (logged-out) can SUBMIT an application and upload a resume.
-- Only reviewers (board / president / admin on the roster) can READ applications,
-- download resumes, and record keep/pass decisions. Resumes live in a PRIVATE
-- storage bucket; reviewers fetch them via short-lived signed URLs.
--
-- RUN ORDER: after db/supabase-roles.sql (needs public.members for the reviewer
-- check). Paste into the Supabase SQL editor and run once. Idempotent.

-- 1) Table ------------------------------------------------------------------
create table if not exists public.rush_applications (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  email           text not null,
  phone           text,
  grad_year       int,
  major           text,
  gpa             text,
  referral_source text,
  pitch           text,
  resume_path     text,
  status          text not null default 'pending'
                  check (status in ('pending','interview','accepted','rejected','waitlist')),
  decision        text check (decision in ('keep','pass')),
  reviewer        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 2) Reviewer check ---------------------------------------------------------
create or replace function public.can_review_applications()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.members m
    where m.email = lower(auth.jwt() ->> 'email')
      and m.role in ('board','president','admin')
  );
$$;

-- 3) Row-Level Security -----------------------------------------------------
alter table public.rush_applications enable row level security;

-- Anyone (logged-out recruits included) may SUBMIT an application. The client
-- can only set the intake fields; status/decision/reviewer are left at their
-- safe defaults and can't be escalated because reviewers-only own UPDATE.
drop policy if exists "rush_applications_insert_public" on public.rush_applications;
create policy "rush_applications_insert_public"
  on public.rush_applications for insert
  to anon, authenticated
  with check (
    status = 'pending' and decision is null and reviewer is null
  );

-- Only reviewers may read, update (decisions/status), or delete.
drop policy if exists "rush_applications_select_reviewer" on public.rush_applications;
create policy "rush_applications_select_reviewer"
  on public.rush_applications for select
  to authenticated using (public.can_review_applications());

drop policy if exists "rush_applications_update_reviewer" on public.rush_applications;
create policy "rush_applications_update_reviewer"
  on public.rush_applications for update
  to authenticated
  using (public.can_review_applications())
  with check (public.can_review_applications());

drop policy if exists "rush_applications_delete_reviewer" on public.rush_applications;
create policy "rush_applications_delete_reviewer"
  on public.rush_applications for delete
  to authenticated using (public.can_review_applications());

-- keep updated_at fresh
create or replace function public.rush_applications_touch()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists rush_applications_touch on public.rush_applications;
create trigger rush_applications_touch before update on public.rush_applications
  for each row execute function public.rush_applications_touch();

-- 4) Resume storage bucket (private) ----------------------------------------
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Applicants may UPLOAD a resume; only reviewers may read them back.
drop policy if exists "resumes_insert_public" on storage.objects;
create policy "resumes_insert_public"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'resumes');

drop policy if exists "resumes_select_reviewer" on storage.objects;
create policy "resumes_select_reviewer"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'resumes' and public.can_review_applications());
