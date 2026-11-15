-- ============================================================================
-- AKPsi Omicron Tau - Points requirements (editable by the e-board)
-- ============================================================================
-- Each member's points requirement used to be hard-coded in the site
-- (src/data/pointThresholds.ts). It now lives here so VP Ops / any e-board
-- member can change it from the portal (Portal -> Point Requirements).
--
-- One row per key:
--   * a member's login email (lowercased)  -> that member's own requirement
--   * 'default:pledge' / 'default:brother' -> the fallback for anyone without
--                                             their own row
--
-- RUN ORDER: after db/submissions.sql (reuses can_review_submissions()).
-- Then run db/point-requirements-seed.local.sql (gitignored - it holds member
-- emails) to load the current spreadsheet values. Safe to re-run; this file
-- never deletes or overwrites existing requirements.

-- 1) Table ------------------------------------------------------------------
create table if not exists public.point_requirements (
  key         text primary key,
  required    numeric not null check (required >= 0),
  updated_by  text,
  updated_at  timestamptz not null default now()
);

-- 2) RLS: every signed-in member reads (the leaderboard shows everyone's
--    meter); only reviewers (board / president / admin) write. ---------------
alter table public.point_requirements enable row level security;

drop policy if exists "point_requirements_select_authenticated" on public.point_requirements;
create policy "point_requirements_select_authenticated"
  on public.point_requirements for select
  to authenticated
  using (true);

drop policy if exists "point_requirements_write_reviewers" on public.point_requirements;
create policy "point_requirements_write_reviewers"
  on public.point_requirements for all
  to authenticated
  using (public.can_review_submissions())
  with check (public.can_review_submissions());

-- 3) Stamp who changed it and when; normalize the key -----------------------
create or replace function public.point_requirements_stamp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.key        := lower(trim(new.key));
  new.updated_by := lower(auth.jwt() ->> 'email');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists point_requirements_stamp on public.point_requirements;
create trigger point_requirements_stamp
  before insert or update on public.point_requirements
  for each row execute function public.point_requirements_stamp();

-- 4) Defaults (only inserted if missing - edits made in the portal are kept) --
insert into public.point_requirements (key, required) values
  ('default:pledge', 30),
  ('default:brother', 20)
on conflict (key) do nothing;
