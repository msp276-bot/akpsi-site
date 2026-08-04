-- ============================================================================
-- AKPsi Omicron Tau - Member self-edit profiles (with president approval)
-- ============================================================================
-- Members propose edits to their own major / company / LinkedIn / photo. Nothing
-- goes live until a president/admin approves it. All writes go through the
-- SECURITY DEFINER functions below (the table has NO direct-write policy), so a
-- member can only ever touch their OWN pending fields, never the approved
-- (live) fields and never someone else's row.
--
-- RUN ORDER: after db/supabase-roles.sql. Paste into the Supabase SQL editor and
-- run once. Idempotent.

-- 1) Table ------------------------------------------------------------------
create table if not exists public.member_profiles (
  email               text primary key,
  -- Approved (live) values, layered onto the directory card.
  major               text,
  company             text,
  linkedin            text,
  photo_path          text,
  -- Proposed values awaiting approval (a full snapshot, not a diff).
  pending_major       text,
  pending_company     text,
  pending_linkedin    text,
  pending_photo_path  text,
  has_pending         boolean not null default false,
  reviewed_by         text,
  submitted_at        timestamptz,
  updated_at          timestamptz not null default now()
);

-- 2) RLS: read for any signed-in member; NO direct writes (RPCs only) --------
alter table public.member_profiles enable row level security;

drop policy if exists "member_profiles_select_authenticated" on public.member_profiles;
create policy "member_profiles_select_authenticated"
  on public.member_profiles for select
  to authenticated
  using (true);

-- 3) Member submits an edit to their OWN profile -> pending ------------------
create or replace function public.submit_profile_edit(
  p_major text,
  p_company text,
  p_linkedin text,
  p_photo_path text
)
returns void language plpgsql security definer set search_path = public as $$
declare me text := lower(auth.jwt() ->> 'email');
begin
  if me is null then
    raise exception 'Not signed in.';
  end if;
  if not exists (select 1 from public.members m where m.email = me) then
    raise exception 'Only chapter members can edit a profile.';
  end if;

  insert into public.member_profiles (
    email, pending_major, pending_company, pending_linkedin, pending_photo_path,
    has_pending, submitted_at, updated_at
  )
  values (me, p_major, p_company, p_linkedin, p_photo_path, true, now(), now())
  on conflict (email) do update set
    pending_major      = excluded.pending_major,
    pending_company    = excluded.pending_company,
    pending_linkedin   = excluded.pending_linkedin,
    pending_photo_path = excluded.pending_photo_path,
    has_pending        = true,
    submitted_at       = now(),
    updated_at         = now();
end; $$;

-- 4) President/admin approves or rejects a pending edit ---------------------
create or replace function public.approve_profile_edit(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare me text := lower(auth.jwt() ->> 'email');
begin
  if not exists (
    select 1 from public.members m
    where m.email = me and m.role in ('president','admin')
  ) then
    raise exception 'Only a president or admin can approve profiles.';
  end if;

  update public.member_profiles set
    major       = pending_major,
    company     = pending_company,
    linkedin    = pending_linkedin,
    photo_path  = pending_photo_path,
    pending_major = null, pending_company = null,
    pending_linkedin = null, pending_photo_path = null,
    has_pending = false,
    reviewed_by = me,
    updated_at  = now()
  where email = lower(p_email);
end; $$;

create or replace function public.reject_profile_edit(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare me text := lower(auth.jwt() ->> 'email');
begin
  if not exists (
    select 1 from public.members m
    where m.email = me and m.role in ('president','admin')
  ) then
    raise exception 'Only a president or admin can reject profiles.';
  end if;

  update public.member_profiles set
    pending_major = null, pending_company = null,
    pending_linkedin = null, pending_photo_path = null,
    has_pending = false,
    reviewed_by = me,
    updated_at  = now()
  where email = lower(p_email);
end; $$;

revoke all on function public.submit_profile_edit(text, text, text, text) from public, anon;
revoke all on function public.approve_profile_edit(text) from public, anon;
revoke all on function public.reject_profile_edit(text) from public, anon;
grant execute on function public.submit_profile_edit(text, text, text, text) to authenticated;
grant execute on function public.approve_profile_edit(text) to authenticated;
grant execute on function public.reject_profile_edit(text) to authenticated;

-- 5) Avatar photos (public bucket - member photos also appear publicly) ------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_insert_authenticated" on storage.objects;
create policy "avatars_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');
