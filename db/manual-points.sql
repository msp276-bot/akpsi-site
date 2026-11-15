-- ============================================================================
-- AKPsi Omicron Tau - E-board can add points for members directly
-- ============================================================================
-- VP Ops (or any reviewer: board / president / admin) can credit points to one
-- or more members without the member submitting anything or attaching proof.
-- Each credit is stored as an already-approved `points` submission, so the
-- leaderboard (chapter_standings) and "My Points" count it automatically, and a
-- reviewer can still Deny / Reopen / delete it from the Review page.
--
-- How it stays secure: the only way in is the award_points() function below,
-- which checks can_review_submissions() before writing. It sets a
-- transaction-local flag that the insert trigger honors - and the trigger
-- re-checks the caller is a reviewer, so the flag alone grants nothing.
--
-- RUN ORDER: after db/submissions.sql. Paste into the Supabase SQL editor and
-- run once. Safe to re-run. This file does NOT drop or reset any data
-- (do NOT re-run db/submissions.sql: its section 0 wipes all submissions).

-- 1) Who added it (null = the member submitted it themselves) ---------------
alter table public.submissions add column if not exists added_by text;

-- 2) Insert guard: same as before, plus the manual-award path ----------------
create or replace function public.submissions_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ev_points numeric;
  me text := lower(auth.jwt() ->> 'email');
begin
  if coalesce(current_setting('akpsi.manual_award', true), '') = 'on' then
    -- Manual credit from award_points(): approved on entry, stamped to the
    -- reviewer who added it.
    if not public.can_review_submissions() then
      raise exception 'Only the e-board can add points for members.';
    end if;
    new.type := 'points';
    new.hours := null;
    new.proof_path := null;
    if new.event_id is not null then
      select points_value into ev_points
        from public.point_events where id = new.event_id;
      if ev_points is null then
        raise exception 'That event no longer exists.';
      end if;
      new.points := ev_points;
    else
      new.points := coalesce(new.points, 0);
      if new.points <= 0 then
        raise exception 'Enter a positive number of points.';
      end if;
    end if;
    new.status      := 'approved';
    new.reviewed_by := me;
    new.reviewed_at := now();
    new.added_by    := me;
  else
    -- Normal member submission (unchanged): forced pending, points from event.
    new.status      := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.added_by    := null;

    if new.type = 'points' then
      select points_value into ev_points
        from public.point_events where id = new.event_id and active;
      if ev_points is null then
        raise exception 'That event is not available for submissions.';
      end if;
      new.points := ev_points;
      new.hours  := null;
    else
      new.event_id := null;
      new.points   := 0;
      new.hours    := greatest(0, coalesce(new.hours, 0));
      if new.hours = 0 then
        raise exception 'Service-hour submissions need a positive number of hours.';
      end if;
    end if;
  end if;

  new.submitter_name := coalesce(
    nullif((select full_name from public.members where email = new.submitter_email), ''),
    new.submitter_name,
    ''
  );
  return new;
end;
$$;

-- 3) Update guard: same as before, plus keep added_by fixed ------------------
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
  new.added_by          := old.added_by;

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

-- 4) award_points: credit one event (or a custom amount) to many members -----
-- Members who already have a pending or approved submission for the same event
-- are skipped, so nobody gets double credit. Returns how many were credited.
create or replace function public.award_points(
  p_emails   text[],
  p_event_id uuid,
  p_points   numeric,
  p_note     text
)
returns integer language plpgsql security definer set search_path = public as $$
declare
  e text;
  n integer := 0;
begin
  if not public.can_review_submissions() then
    raise exception 'Only the e-board can add points for members.';
  end if;
  if p_event_id is null then
    if coalesce(p_points, 0) <= 0 then
      raise exception 'Enter a positive number of points.';
    end if;
    if coalesce(trim(p_note), '') = '' then
      raise exception 'Add a short note saying what the points are for.';
    end if;
  end if;

  perform set_config('akpsi.manual_award', 'on', true);

  foreach e in array coalesce(p_emails, '{}') loop
    e := lower(trim(e));
    if not exists (select 1 from public.members m where m.email = e) then
      raise exception 'Not on the roster: %', e;
    end if;
    if p_event_id is not null and exists (
      select 1 from public.submissions s
      where s.submitter_email = e
        and s.event_id = p_event_id
        and s.status in ('pending', 'approved')
    ) then
      continue;
    end if;

    insert into public.submissions (submitter_email, type, event_id, event_description, points)
    values (e, 'points', p_event_id, coalesce(trim(p_note), ''), coalesce(p_points, 0));
    n := n + 1;
  end loop;

  perform set_config('akpsi.manual_award', 'off', true);
  return n;
end;
$$;

revoke all on function public.award_points(text[], uuid, numeric, text) from public, anon;
grant execute on function public.award_points(text[], uuid, numeric, text) to authenticated;
