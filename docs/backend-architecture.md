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

The first schema draft lives in [`db/schema.sql`](../db/schema.sql). It covers:

- members and users/auth
- events and RSVPs/check-ins
- announcements
- documents
- rush applications
- audit logs

## RBAC mapping

The frontend mock roles map to backend roles like this:

| Frontend role | Backend role | Meaning |
| --- | --- | --- |
| `pledge` | `member` with pledge cohort flag | pledge-facing portal |
| `active` | `active` / `member` | general chapter member |
| `board` | `eboard` | e-board officer |
| `admin` | `admin` | tech/admin owner |

Frontend permissions live in `src/lib/access.ts`. Server routes should enforce
the same permissions server-side before returning sensitive data.

## Route/API contract

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
- `POST /api/applications`
- `GET /api/applications`
- `GET /api/applications/[id]`
- `PUT /api/applications/[id]`

On static S3/CloudFront hosting, these APIs must live elsewhere, such as API
Gateway + Lambda or Supabase. If the site moves to a server-capable host, these
can be implemented as Next.js route handlers.

## Data entry flows

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
