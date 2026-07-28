-- Chapter documents: e-board-managed files and links, organized by folder and
-- gated by visibility. Run AFTER db/supabase-roles.sql (reuses `members`).
-- Independent of the other db/*.sql files, but re-declares the two shared
-- visibility helpers (create-or-replace) so it can be run on its own. Safe to
-- re-run: table uses `create table if not exists`, policies/triggers are
-- drop-and-recreate.
--
-- MODEL
--   Each row is either an uploaded FILE (source_type='file', stored in the
--   private `documents` storage bucket at storage_path) or a LINK
--   (source_type='link', link_url points at Drive/Docs/etc). E-board creates,
--   edits, and deletes; every member reads the rows their role may see.
--
-- SECURITY
--   The anon key runs in the browser, so who-can-write is enforced by RLS here.
--   uploaded_by / uploaded_by_name are stamped from the JWT + roster by a
--   trigger so they cannot be forged.

-- 1) Shared helpers (mirrors db/portal-content.sql; create-or-replace is a no-op
--    if that file already defined them). ---------------------------------------
create or replace function public.member_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.members where email = lower(auth.jwt() ->> 'email');
$$;

create or replace function public.can_manage_content()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.member_role() in ('board','president','admin'), false);
$$;

create or replace function public.can_view_visibility(vis text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when public.can_manage_content()   then true
    when vis in ('public','members')   then true
    when vis = 'active'                then public.member_role() = 'active'
    when vis = 'pledge'                then public.member_role() = 'pledge'
    else false
  end;
$$;

-- 2) Documents table --------------------------------------------------------
create table if not exists public.documents (
  id                uuid primary key default gen_random_uuid(),
  folder            text not null default 'General',
  name              text not null,
  kind              text not null default 'doc'
                    check (kind in ('doc','sheet','link')),
  source_type       text not null default 'file'
                    check (source_type in ('file','link')),
  storage_path      text,                 -- file rows: path in the `documents` bucket
  link_url          text,                 -- link rows: external URL
  visibility        text not null default 'members'
                    check (visibility in ('public','members','active','pledge','eboard')),
  uploaded_by       text references public.members(email) on delete set null,
  uploaded_by_name  text not null default '',
  created_at        timestamptz not null default now()
);
create index if not exists documents_folder_idx on public.documents (folder, created_at desc);

-- Stamp uploader from the JWT + roster on insert (cannot be forged).
create or replace function public.documents_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.uploaded_by := lower(auth.jwt() ->> 'email');
  new.uploaded_by_name := coalesce(
    nullif((select full_name from public.members where email = new.uploaded_by), ''),
    new.uploaded_by_name, ''
  );
  return new;
end;
$$;
drop trigger if exists documents_before_insert on public.documents;
create trigger documents_before_insert
  before insert on public.documents
  for each row execute function public.documents_before_insert();

alter table public.documents enable row level security;

drop policy if exists "documents_select_by_visibility" on public.documents;
create policy "documents_select_by_visibility" on public.documents
  for select to authenticated
  using (public.can_view_visibility(visibility));

drop policy if exists "documents_write_managers" on public.documents;
create policy "documents_write_managers" on public.documents
  for all to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

-- 3) Private storage bucket for uploaded files -------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Any signed-in member may read (download via signed URL). The row's visibility
-- gates what appears in the list; object paths aren't exposed otherwise. Only
-- e-board may upload/replace/delete objects.
drop policy if exists "documents_obj_select_authenticated" on storage.objects;
create policy "documents_obj_select_authenticated" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents');

drop policy if exists "documents_obj_insert_managers" on storage.objects;
create policy "documents_obj_insert_managers" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.can_manage_content());

drop policy if exists "documents_obj_update_managers" on storage.objects;
create policy "documents_obj_update_managers" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and public.can_manage_content())
  with check (bucket_id = 'documents' and public.can_manage_content());

drop policy if exists "documents_obj_delete_managers" on storage.objects;
create policy "documents_obj_delete_managers" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and public.can_manage_content());
