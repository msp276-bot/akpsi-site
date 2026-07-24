-- ============================================================================
-- Web Push subscriptions for the AKPsi Omicron Tau PWA.
--
-- Each row is one browser/device that opted into push, tied to a roster email.
-- The `send-push` Edge Function (service role) reads these to fan out pushes;
-- members manage only their own rows via RLS. Run AFTER supabase-roles.sql
-- (it reuses public.is_roster_manager() and the members allowlist model).
-- ============================================================================

create table if not exists public.push_subscriptions (
  endpoint     text primary key,
  p256dh       text not null,
  auth         text not null,
  member_email text not null references public.members(email) on delete cascade,
  created_at   timestamptz not null default now()
);

create index if not exists push_subscriptions_member_idx
  on public.push_subscriptions (member_email);

alter table public.push_subscriptions enable row level security;

-- A member may add a subscription only for their own JWT email.
drop policy if exists "push_insert_self" on public.push_subscriptions;
create policy "push_insert_self" on public.push_subscriptions
  for insert to authenticated
  with check (member_email = lower(auth.jwt() ->> 'email'));

-- A member may update/delete only their own subscriptions.
drop policy if exists "push_update_self" on public.push_subscriptions;
create policy "push_update_self" on public.push_subscriptions
  for update to authenticated
  using (member_email = lower(auth.jwt() ->> 'email'))
  with check (member_email = lower(auth.jwt() ->> 'email'));

drop policy if exists "push_delete_self" on public.push_subscriptions;
create policy "push_delete_self" on public.push_subscriptions
  for delete to authenticated
  using (member_email = lower(auth.jwt() ->> 'email'));

-- A member may read their own rows; roster managers (president/admin) may read
-- all (useful for debugging / a future "who's subscribed" view). The Edge
-- Function uses the service role and bypasses RLS to read everyone.
drop policy if exists "push_select_self_or_manager" on public.push_subscriptions;
create policy "push_select_self_or_manager" on public.push_subscriptions
  for select to authenticated
  using (
    member_email = lower(auth.jwt() ->> 'email')
    or public.is_roster_manager()
  );
