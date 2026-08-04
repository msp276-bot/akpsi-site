-- ============================================================================
-- AKPsi Omicron Tau - Chapter-wide leaderboard totals
-- ============================================================================
-- Lets EVERY signed-in member see the points/service-hours leaderboard, without
-- exposing anyone's raw submissions (proof photos + notes stay reviewer-only via
-- the RLS in db/submissions.sql). This SECURITY DEFINER function returns only
-- per-member APPROVED totals, and is callable by any authenticated member.
--
-- RUN ORDER: after db/supabase-roles.sql and db/submissions.sql. Paste into the
-- Supabase SQL editor and run once. Idempotent (create or replace).

create or replace function public.chapter_standings()
returns table (
  email      text,
  full_name  text,
  role       text,
  points     numeric,
  hours      numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.email,
    m.full_name,
    m.role,
    coalesce(sum(s.points) filter (
      where s.type = 'points' and s.status = 'approved'
    ), 0) as points,
    coalesce(sum(s.hours) filter (
      where s.type = 'service_hours' and s.status = 'approved'
    ), 0) as hours
  from public.members m
  left join public.submissions s on s.submitter_email = m.email
  group by m.email, m.full_name, m.role
  order by points desc, hours desc, m.full_name;
$$;

-- Only signed-in members may call it (not the anon key / logged-out visitors).
revoke all on function public.chapter_standings() from public, anon;
grant execute on function public.chapter_standings() to authenticated;
