-- ============================================================================
-- AKPsi Omicron Tau - LinkedIn links on the PUBLIC members pages
-- ============================================================================
-- Clicking a headshot on rutgersakpsi.org/members opens that brother's
-- LinkedIn. LinkedIns live in member_contacts (seeded) and member_profiles
-- (approved self-edits from My Profile); both tables stay signed-in-only.
--
-- This function is the ONE public door: it returns only (slug, linkedin) -
-- never emails or anything else - and only URLs that point at linkedin.com.
-- An approved My Profile LinkedIn wins over the seeded one, same as the
-- portal directory.
--
-- RUN ORDER: after db/directory-contacts.sql and db/member-profiles.sql.
-- Read-only and idempotent - safe to re-run. Changes no data.

create or replace function public.public_member_linkedins()
returns table (slug text, linkedin text)
language sql stable security definer set search_path = public as $$
  with picked as (
    select
      c.slug,
      coalesce(
        (select nullif(trim(p.linkedin), '')
           from public.member_profiles p
          where (lower(p.email) = lower(c.email) or lower(p.contact_email) = lower(c.email))
            and nullif(trim(p.linkedin), '') is not null
          order by (lower(p.email) = lower(c.email)) desc
          limit 1),
        nullif(trim(c.linkedin), '')
      ) as url
    from public.member_contacts c
  )
  select slug, url
  from picked
  where url ~* '^(https?://)?([a-z0-9-]+\.)?linkedin\.com/';
$$;

revoke all on function public.public_member_linkedins() from public;
grant execute on function public.public_member_linkedins() to anon, authenticated;
