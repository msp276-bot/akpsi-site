-- AKPsi Omicron Tau backend schema draft.
-- Target database: PostgreSQL via Supabase, Neon, or Prisma migrations.

create extension if not exists pgcrypto;

create table members (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) unique not null check (email ilike '%@rutgers.edu'),
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  slug varchar(100) unique not null,
  display_name varchar(100),
  class_year integer not null,
  major varchar(100) not null,
  minor varchar(100),
  gpa decimal(3,2),
  position varchar(50),
  committee varchar(50),
  bio text,
  linkedin_url varchar(255),
  phone varchar(20),
  photo_url varchar(500),
  initials_avatar varchar(2),
  profile_visibility varchar(20) default 'members'
    check (profile_visibility in ('public', 'members', 'eboard')),
  is_eboard boolean default false,
  is_admin boolean default false,
  is_alumni boolean default false,
  status varchar(20) default 'active'
    check (status in ('active', 'inactive', 'alumni', 'suspended')),
  created_at timestamp default now(),
  updated_at timestamp default now(),
  last_login timestamp
);

create table users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) unique not null check (email ilike '%@rutgers.edu'),
  name varchar(200),
  image varchar(500),
  role varchar(20) default 'member'
    check (role in ('member', 'active', 'eboard', 'admin')),
  google_id varchar(255) unique,
  email_verified timestamp,
  created_at timestamp default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  title varchar(200) not null,
  description text,
  event_type varchar(30) not null
    check (event_type in ('professional', 'social', 'recruitment', 'general', 'eboard_only')),
  start_time timestamp not null,
  end_time timestamp,
  location varchar(200),
  location_url varchar(500),
  visibility varchar(20) default 'members'
    check (visibility in ('public', 'members', 'active', 'pledge', 'eboard')),
  created_by uuid references members(id),
  is_recurring boolean default false,
  recurrence_rule varchar(100),
  max_attendees integer,
  requires_rsvp boolean default false,
  rsvp_deadline timestamp,
  status varchar(20) default 'published'
    check (status in ('draft', 'published', 'cancelled')),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table event_attendees (
  event_id uuid references events(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  status varchar(20) default 'going'
    check (status in ('going', 'maybe', 'declined', 'waitlist')),
  rsvp_at timestamp default now(),
  checked_in boolean default false,
  checked_in_at timestamp,
  primary key (event_id, member_id)
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title varchar(200) not null,
  body text not null,
  author_id uuid references members(id),
  is_pinned boolean default false,
  visibility varchar(20) default 'members'
    check (visibility in ('members', 'active', 'pledge', 'eboard')),
  attachment_url varchar(500),
  category varchar(30),
  published_at timestamp default now(),
  expires_at timestamp
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  title varchar(200) not null,
  file_url varchar(500) not null,
  file_type varchar(50),
  file_size_bytes integer,
  folder varchar(50),
  uploaded_by uuid references members(id),
  visibility varchar(20) default 'members'
    check (visibility in ('public', 'members', 'active', 'pledge', 'eboard')),
  download_count integer default 0,
  created_at timestamp default now()
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null check (email ilike '%@rutgers.edu'),
  full_name varchar(200) not null,
  phone varchar(20),
  grad_year integer not null,
  major varchar(100) not null,
  minor varchar(100),
  gpa decimal(3,2),
  why_akpsi text,
  resume_url varchar(500),
  linkedin_url varchar(255),
  referral_source varchar(50),
  status varchar(20) default 'pending'
    check (status in ('pending', 'interview', 'accepted', 'rejected', 'waitlist')),
  interview_scheduled timestamp,
  interview_notes text,
  bid_offered boolean default false,
  bid_accepted boolean,
  reviewed_by uuid references members(id),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references members(id),
  action varchar(50) not null,
  target_table varchar(50),
  target_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp default now()
);

create index members_email_idx on members(email);
create index members_slug_idx on members(slug);
create index events_start_time_idx on events(start_time);
create index events_visibility_idx on events(visibility);
create index applications_status_idx on applications(status);
create index audit_logs_actor_created_idx on audit_logs(actor_id, created_at desc);
