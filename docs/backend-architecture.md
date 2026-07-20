# Backend Architecture Plan

This site is currently deployed as a static Next.js export for cheap
S3/CloudFront hosting. The public marketing site and mock portal can run without
a server. The real chapter management system should add an API/database layer
behind the same UI.

## Recommended stack

- PostgreSQL via Supabase or Neon
- Auth.js / NextAuth Google OAuth with hosted-domain restriction for
  `@rutgers.edu`
- File storage in S3 or Supabase Storage
- Email notifications via Amazon SES, Resend, or SendGrid
- Scheduled reminders via EventBridge + Lambda, Supabase Edge Functions, or a
  small cron worker

## Database source of truth

Two files:

- [`db/supabase-roles.sql`](../db/supabase-roles.sql) — **implemented and
  runnable.** The `members` roster/allowlist table, its Row-Level Security, and
  the auth-signup trigger that powers real login + role management today. Run
  this in Supabase to switch the site from mock mode to live mode.
- [`db/schema.sql`](../db/schema.sql) — broader design draft for later tables
  (events, announcements, documents, applications, audit logs). Aspirational.

## Roles, allowlist & auth (implemented)

Login and role management run against Supabase, called directly from the browser
(the site stays a static export). See [`docs/supabase-setup.md`](./supabase-setup.md)
for setup.

- **Roster = allowlist.** The `members` table (email primary key) is the single
  source of truth for who can log in and what role they have. An email not on it
  cannot sign in — enforced by a `before insert` trigger on `auth.users` that
  rejects unknown emails at signup (Google or magic link).
- **President-only writes.** Only `president` and `admin` roles may insert /
  update / delete rows, enforced by RLS (`is_roster_manager()`), not just the
  UI. The client anon key can't bypass it.
- **Login methods.** Google OAuth (hosted-domain hint `@rutgers.edu`) and magic
  link email. Both resolve the signed-in email to a role via the roster.
- **Graceful fallback.** When `NEXT_PUBLIC_SUPABASE_*` are unset the app runs in
  mock mode (in-browser demo accounts) so previews work with no backend.

Data-access layer: [`src/lib/roles.ts`](../src/lib/roles.ts) (Supabase +
mock impls); auth: [`src/context/AuthContext.tsx`](../src/context/AuthContext.tsx);
UI: the **Roles & access** module in `src/app/portal/admin/page.tsx`.

## RBAC mapping

| Frontend role | Backend role (roster) | Meaning |
| --- | --- | --- |
| `pledge` | `pledge` | pledge-facing portal |
| `active` | `active` | general chapter member |
| `board` | `board` | e-board officer |
| `president` | `president` | e-board + manages the roster/roles |
| `admin` | `admin` | tech/admin owner (full command center) |

Frontend permissions live in `src/lib/access.ts` (`manage:roles` gates the Roles
& access screen). Server enforcement lives in the RLS policies in
`db/supabase-roles.sql` — the two must stay in sync.

## Route/API contract

Roster/roles are handled via the Supabase client (`src/lib/roles.ts`), not
custom endpoints — the equivalent operations are: list members, upsert a member
(add/change role), and delete a member, all gated by RLS.

Future API endpoints:

- `GET /api/members`
- `GET /api/members/[slug]`
- `PUT /api/members/[id]`
- `POST /api/members`
- `DELETE /api/members/[id]`
- `POST /api/members/[id]/photo`
- `GET /api/events`
- `POST /api/events`
- `PUT /api/events/[id]`
- `DELETE /api/events/[id]`
- `POST /api/events/[id]/rsvp`
- `GET /api/events/[id]/attendees`
- `POST /api/events/[id]/checkin`
- `GET /api/announcements`
- `POST /api/announcements`
- `PUT /api/announcements/[id]`
- `DELETE /api/announcements/[id]`
- `GET /api/documents`
- `POST /api/documents`
- `DELETE /api/documents/[id]`
- `GET /api/documents/archive`
- `POST /api/documents/[id]/archive`
- `POST /api/documents/[id]/restore`
- `POST /api/applications`
- `GET /api/applications`
- `GET /api/applications/[id]`
- `PUT /api/applications/[id]`

On static S3/CloudFront hosting, these APIs must live elsewhere, such as API
Gateway + Lambda or Supabase. If the site moves to a server-capable host, these
can be implemented as Next.js route handlers.

## Data entry flows

### Document archive

Older documents should stay out of the member-facing document library without
being immediately deleted. Admins can archive stale folders, expired rush files,
old meeting minutes, financial packets, and sensitive exports.

Recommended behavior:

- member document views only return documents where `archived_at is null`
- admin archive views return archived documents with folder, owner, retention
  status, and restore/delete actions
- restricted or financial records should require admin permission to hard-delete
- archive and restore actions should write audit log rows
- archived files should keep their object storage path unless a lifecycle policy
  moves them into colder storage

Recommended object paths:

```text
documents/{folder}/{document_id}/{filename}
archive/documents/{folder}/{document_id}/{filename}
```

### Profile setup

1. Admin creates an invite token for `/portal/setup?token=...`
2. Member signs in with Google OAuth
3. Wizard verifies name/class year/major
4. Member uploads headshot, bio, LinkedIn
5. Admin or automated rule publishes the profile

### Bulk import

Admin uploads CSV with:

```csv
email,first_name,last_name,class_year,major,minor,position,committee
en123@rutgers.edu,Emily,Nguyen,2027,Business Administration,Economics,President,Executive
```

Validation rules:

- all emails must end in `@rutgers.edu`
- slugs are generated from names
- initials avatars are generated automatically
- invite emails are sent after import

### Photo storage

Recommended object paths:

```text
members/{member_id}/headshot.jpg
members/{member_id}/headshot-thumb.jpg
members/{member_id}/headshot-lg.jpg
applications/{application_id}/resume.pdf
documents/{folder}/{document_id}/{filename}
```

## Notifications

Initial notification triggers:

- new application submitted → email e-board
- application status changed → email applicant
- event created → in-app + email members with access
- RSVP confirmed → in-app member notification
- event reminder 24h before → email RSVP list
- pinned announcement → in-app + email members with access
- document uploaded → in-app members with access

The portal shell now includes a notification bell placeholder so the UI has a
home for this system.

## Current frontend scaffolding

- `/portal/applications` shows a mock e-board application pipeline
- `/portal/admin` shows the future admin command center
- `src/lib/access.ts` centralizes role permissions and visibility checks
- `src/data/applications.ts` provides typed mock application data

These pages are static-safe and can be deployed to S3/CloudFront today.
