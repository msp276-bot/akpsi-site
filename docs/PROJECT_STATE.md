# AKPsi Omicron Tau Website — Project Spec / State

Chapter website for **Alpha Kappa Psi, Omicron Tau (Rutgers)**: public marketing
pages + a members-only portal with a president-managed roster. Single source of
truth for a fresh session. Reference material first; the actual task (if any)
goes last.

---

## 1. Overview & stack

- **Public site:** home, about, members directory + per-member profiles, `/media`
  (Instagram highlights), rush. **Portal (`/portal/…`):** dashboard, events,
  directory, documents, announcements, applications, admin.
- **Next.js 16** (App Router, **Turbopack**), **React 19**, **TypeScript** — the app.
- **Tailwind CSS v4** (`@theme inline` in `globals.css`; tokens: `navy #1a2744`,
  `gold #d4a853`, `blue`, `scarlet`, `ink`, `muted`, `line`). framer-motion +
  lucide-react.
- **Static export** — `next.config.ts`: `output:"export"`, `trailingSlash:true`,
  `images.unoptimized:true`. **No server, no Next API routes.** Chosen because the
  site is frontend-first and hosting stays trivial; every "backend" need is met by
  a browser-callable external service or a build-time constant.
- **Supabase** (`@supabase/supabase-js`) for real auth + the shared roster —
  called **from the browser**, so the site stays a static export. Security is
  enforced by Supabase **Row-Level Security**, never by the client.
- **Repo:** `/Users/marvinpatel/claude code/akpsi-site` · remote
  `github.com/msp276-bot/akpsi-site` · branch `main`.
- Preview: `npm run dev` (or the static export via `python3 -m http.server 3002
  --directory out` after `npm run build`).

**Repo gotcha:** `AGENTS.md` warns this is a *modified* Next.js with breaking
changes vs. training data — read `node_modules/next/dist/docs/` before using
unfamiliar Next APIs.

---

## 2. Data model

### 2a. `members` roster / login allowlist — RUNNABLE, authoritative (`db/supabase-roles.sql`)
This table is BOTH the role store AND the allowlist: on it ⇒ can sign in with
that role; off it ⇒ rejected at signup. Paste into Supabase SQL editor.

```sql
-- 1) Roster table
create table if not exists public.members (
  email       text primary key
              check (email = lower(email) and email like '%@rutgers.edu'),
  full_name   text not null default '',
  role        text not null default 'active'
              check (role in ('pledge','active','board','president','admin')),
  added_by    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2) Helper: does the caller (JWT email) have role-management rights?
create or replace function public.is_roster_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members m
    where m.email = lower(auth.jwt() ->> 'email') and m.role in ('president','admin'));
$$;

-- 3) Row-Level Security: any authed member reads; only president/admin write
alter table public.members enable row level security;
drop policy if exists "members_select_authenticated" on public.members;
create policy "members_select_authenticated" on public.members
  for select to authenticated using (true);
drop policy if exists "members_insert_managers" on public.members;
create policy "members_insert_managers" on public.members
  for insert to authenticated with check (public.is_roster_manager());
drop policy if exists "members_update_managers" on public.members;
create policy "members_update_managers" on public.members
  for update to authenticated using (public.is_roster_manager()) with check (public.is_roster_manager());
drop policy if exists "members_delete_managers" on public.members;
create policy "members_delete_managers" on public.members
  for delete to authenticated using (public.is_roster_manager());

-- 4) Login allowlist: reject signups whose email isn't on the roster
create or replace function public.enforce_member_allowlist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.members m where m.email = lower(new.email)) then
    raise exception 'This email is not on the chapter roster. Ask the chapter president to add you.';
  end if;
  return new;
end; $$;
drop trigger if exists enforce_member_allowlist on auth.users;
create trigger enforce_member_allowlist before insert on auth.users
  for each row execute function public.enforce_member_allowlist();

-- (+ an updated_at touch trigger, + a seed block: insert at least one
--  president/admin to bootstrap — they add everyone else from the website.)
```

### 2b. Member record (public directory) — `src/data/members.ts`
Real roster loaded. **No `email` field exists** (deliberate — see §4 privacy).
```ts
export interface Member {
  id: string; slug: string; name: string; position: string;
  major?: string; minor?: string;
  group: "board" | "directors" | "actives" | "alumni";
  cohort?: "Alpha Founding" | "Beta Founding" | "Alpha Tau";
  classYear: string; industry?: string; bio?: string;
  photo?: string; linkedin?: string; // linkedin shown ONLY inside /portal
}
// slug = slugify(name); getMemberBySlug(slug). President = Abhinav Gunda (id b1).
```

### 2c. `db/schema.sql`
A broader **aspirational** draft (events, announcements, documents w/ archive
columns, applications, audit logs). NOT the live auth model — a header note
points to `supabase-roles.sql` as authoritative. Don't run both `members` defs.

---

## 3. Architecture decisions

| Decision | Reasoning | Forecloses |
|---|---|---|
| Static export, no server | Frontend-first; trivial hosting; nothing forced a server | No server-side middleware/secrets. Anything needing writes/secrets must use a browser-safe external service (Supabase w/ RLS) or a build-time constant |
| Supabase called from the browser | Keeps static export; anon key limited by RLS | "President-only" and the allowlist are enforced by **RLS + a signup trigger**, NOT client code — never "fix" a permissions bug client-side |
| Roster table = allowlist AND role store | One source of truth; add email ⇒ grant login+role | Roles never come from hardcoded email lists; they come from the roster |
| Graceful mock fallback (no Supabase env) | Preview works with zero credentials | Mock is localStorage-only, per-browser, NOT secure — a demo of the behavior, not real enforcement |
| Roles: pledge<active<board<president<admin | `president`=board perms+`manage:roles`; `admin`=`admin:*`(tech). Only those two manage the roster | `manage:roles` gates the Roles panel AND the Admin nav so the president reaches it without full admin |
| Google Calendar = read-only iframe embed + per-event "add" links | No backend/OAuth to hold tokens; public embed + template links need neither | No RSVP write-back / creating events INTO Google from the site — that needs a real backend |
| Instagram = official `/embed/captioned` iframe per post, hand-curated list | Static site can't hold Instagram API tokens; iframe needs no script/key | No live auto-updating feed; posts are a manually maintained array of permalinks |
| Login = Google OAuth **and** magic link (Supabase); mock demo accounts otherwise | User wanted both; magic link needs no Google Cloud setup | Real login needs the Supabase setup done (§7 of `docs/supabase-setup.md`) |

---

## 4. Constraints / gotchas discovered

- **Static export ⇒ no server code.** All persistence/auth is external
  (Supabase, browser-side) or build-time. RLS + the `auth.users` trigger are the
  enforcement points, not middleware.
- **Homepage "all frosted-glass over one flat navy" was built and FULLY REVERTED.**
  The user disliked the flat-blue result. Do NOT re-flatten the homepage. The
  parked idea, if revisited: keep each section's real colors and let the hero
  **video bleed downward and dissolve into navy** — nothing more.
- **Google Calendar embed requires the calendar be shared PUBLIC.** With the ID
  wired but the calendar not public, the embed shows Google's *"Sign in to your
  Google Account"* wall (confirmed live). Fix is in Google Calendar settings
  (Access permissions → "Make available to public"), not code.
- **Instagram login-walls scrapers**, so post URLs can't be auto-fetched — they
  must be provided. The `/embed/captioned` iframe DOES render public posts with
  no login (confirmed live for the 4 chapter posts).
- **Public calendar page was built then removed at the user's request** — the
  calendar now lives ONLY on the members portal (`/portal/events`, "Google" view).
- **Google Fonts fetch can fail `npm run build` in a sandbox** — rerun with
  network access; not a code bug.
- **Lint `react-hooks/set-state-in-effect` (Next 16) is enforced** — never call
  `setState` synchronously in an effect body; do it after an `await`, in an event
  callback, or derive during render. (Pre-existing warnings live only in
  `FluidCanvas/CountUp/Hero/Button/fluidSimulation`; they don't block builds.)
- **Self-lockout guard:** the Roles panel disables editing/removing your own row.

---

## 5. Feature breakdown (load-bearing code reproduced exactly)

### 5.1 Auth + login allowlist  (SECURITY-CRITICAL)
Files: `src/lib/supabase.ts`, `src/lib/roles.ts`, `src/context/AuthContext.tsx`,
`src/lib/access.ts`, `db/supabase-roles.sql`.

- **`src/lib/supabase.ts`** — `isSupabaseConfigured = Boolean(NEXT_PUBLIC_SUPABASE_URL && NEXT_PUBLIC_SUPABASE_ANON_KEY)`;
  `getSupabase()` returns a memoized client or `null` (mock mode). Anon key is
  browser-safe (RLS-limited); the `service_role` key must never appear in the app.

- **`src/lib/roles.ts`** — canonical roles + roster data-access, dual impl:
```ts
export type MemberRole = "pledge" | "active" | "board" | "president" | "admin";
export const MEMBER_ROLES: MemberRole[] = ["pledge","active","board","president","admin"];
export function canManageRoles(r?: MemberRole|null){ return r==="president"||r==="admin"; }
export interface MemberRecord { email:string; fullName:string; role:MemberRole; addedBy:string|null; updatedAt:string|null; }
// Mock store: localStorage key "akpsi.ot.roster", seeded with president@/admin@/tech@/member@/pledge@ rutgers.edu.
// listMembers() / lookupMember(email) / upsertMember({email,fullName,role,actorEmail}) / removeMember(email)
//   → Supabase `members` table when configured, localStorage mock otherwise.
//   upsertMember enforces the @rutgers.edu check; email is always lowercased.
```

- **`src/context/AuthContext.tsx`** — mode = `supabase` when configured, else
  `mock`. Exposes `{user,loading,mode,signInWithGoogle,requestMagicLink,signOut}`.
  Supabase mode resolves the session email → `lookupMember`; **if not on the
  roster it signs the session out** (fail-closed behind the DB trigger). Mock mode
  now ALSO enforces the allowlist (mirrors production). Exact mock sign-in:
```ts
const mockSignIn = useCallback(
  async (email?: string, _membership: "active" | "pledge" = "active") => {
    await new Promise((r) => setTimeout(r, 700));
    const address = (email ?? "member@rutgers.edu").trim().toLowerCase();
    if (!address.endsWith(RUTGERS_DOMAIN)) {
      throw new Error("That account isn't a @rutgers.edu address. The member portal is limited to Rutgers accounts.");
    }
    // Allowlist: only emails on the roster (added by a president / tech / admin)
    // may sign in — mirrors the server-side Supabase enforcement.
    const member = await lookupMember(address);
    if (!member) {
      throw new Error("This email isn't on the chapter roster yet. A president, tech chair, or admin needs to add you before you can sign in.");
    }
    const nextUser: ChapterUser = { email: member.email, name: member.fullName || deriveName(member.email), role: member.role };
    setUser(nextUser);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser)); } catch {}
    return nextUser;
  }, []);
// signInWithGoogle: mock→mockSignIn; supabase→signInWithOAuth({provider:'google', options:{queryParams:{hd:'rutgers.edu'}}}) (redirects)
// requestMagicLink: mock→mockSignIn+{sent:false}; supabase→signInWithOtp({email})+{sent:true}
```

- **`src/lib/access.ts`** — `Permission` union incl. `"manage:roles"` and
  `"admin:*"`; `ROLE_PERMISSIONS` maps each role; `hasPermission(role,perm)`
  (admin:* satisfies all). President's set = board perms + `manage:roles`.
  **Frontend perms here and the DB RLS in `supabase-roles.sql` encode the same
  rules — keep them in sync.**

- **Roles UI** — `src/app/portal/admin/page.tsx`: `MODULES[0]` is
  `{id:"roles", permission:"manage:roles"}` (rest `"admin:*"`); `visibleModules`
  filters by `hasPermission`; `RolesPanel` (add email+name+role / change role /
  remove) calls `upsertMember`/`removeMember`, passes `actorEmail`, disables the
  current user's own row, and shows a Live-vs-Preview banner from
  `isSupabaseConfigured`. `PortalShell` Admin nav item is gated by `manage:roles`.

- **Login page** — `src/app/portal/page.tsx`: `mode==="supabase" ? <RealSignIn>`
  (Google + magic-link) `: <MockSignIn>` (portal chooser + one-click demo accounts
  + free-email box).

### 5.2 Portal ↔ Google Calendar  (`/portal/events`, `src/data/calendar.ts`)
Read-only. `GOOGLE_CALENDAR_ID` is set to the chapter's public calendar
(`c_c1a79396869cbf6257effd4bf694505c102690ef92a6ebd7617e24ebf2ebb0b8@group.calendar.google.com`).
```ts
export function googleCalendarEmbedSrc(id: string): string {
  const p = new URLSearchParams({ src:id, ctz:"America/New_York", mode:"MONTH", showTitle:"0", showPrint:"0", showTabs:"1", showCalendars:"0" });
  return `https://calendar.google.com/calendar/embed?${p.toString()}`;
}
export function addToGoogleCalendarUrl(e:{title:string;start:string;end?:string;location?:string;description?:string}): string {
  const start=new Date(e.start); const end=e.end?new Date(e.end):new Date(start.getTime()+3600000);
  const stamp=(d:Date)=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  const p=new URLSearchParams({ action:"TEMPLATE", text:e.title, dates:`${stamp(start)}/${stamp(end)}`, ctz:"America/New_York" });
  if(e.location)p.set("location",e.location); if(e.description)p.set("details",e.description);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
```
Events page adds a **"Google" view** (4th toggle: Month/Week/List/Google) →
`<GoogleCalendarPanel>` (iframe embed, or a "not connected" placeholder if the ID
is blank). Each event detail's **"Add to Google Calendar"** button is a real
`<a href={addToGoogleCalendarUrl(event)}>`. ⚠️ Embed needs the calendar shared
PUBLIC (see §4) — currently shows Google's sign-in wall until that's set.

### 5.3 Public Media page + Instagram embeds  (`/media`)
`src/components/media/InstagramEmbed.tsx` — parses a permalink/shortcode →
`https://www.instagram.com/{p|reel|tv}/{code}/embed/captioned` iframe (no key, no
script). `src/app/media/page.tsx` maps `INSTAGRAM_POSTS: string[]` (4 real chapter
permalinks) into a responsive grid of embeds (verified rendering live), plus a
`RUSH_VIDEO` slot (mp4 or iframeSrc; "coming soon" placeholder until set).

### 5.4 Header/footer social + privacy
- `src/data/social.ts` — single source: `SOCIAL.instagram =
  "https://www.instagram.com/rutgers.akpsi/"`, `SOCIAL.linkedin =
  "https://www.linkedin.com/company/rutgers-alphakappapsi"`; `hasSocialUrl()`.
  Used by `Navbar` (desktop + mobile icon pair, `target=_blank rel=noopener
  noreferrer`), `Footer`, and the Media page.
- **Privacy:** the public profile `src/app/members/[slug]/page.tsx` renders only
  name/position/photo/bio/academics — **no email, no LinkedIn** (those were
  removed; contact info is portal-only). The data model has no `email` field.

### 5.5 Admin document archive (prior work, in `admin/page.tsx`)
`Archive` module: `ARCHIVED_FILES` mock, search/filter, `overflow-x-auto`
`min-w-[760px]` table (mobile-safe), status labels, restore/delete (UI-only).

---

## 6. Build order / current status (all ✅ done unless noted)

1. ✅ Supabase roles + login allowlist (client + RLS + signup trigger + mock-mode enforcement).
2. ✅ Privacy: strip email/LinkedIn from public member profiles.
3. ✅ Header/footer social icons wired to real URLs.
4. ✅ Public Media page + 4 Instagram embeds.
5. ✅ President updated to **Abhinav Gunda** (directory + home president letter).
6. ✅ Removed the lowercase-blue `SectionHeader` subtitles site-wide.
7. ✅ Portal ↔ Google Calendar (embed view + per-event add links).
8. ⏳ **Google Calendar must be set PUBLIC** (Google-side) for the embed to show.
9. ⏳ Rush video for the Media page (drop an mp4/YouTube URL into `RUSH_VIDEO`).
10. ⏳ Supabase project setup to go live (see `docs/supabase-setup.md`); provide
    the real roster to seed. Until then the app runs in mock mode.

---

## 7. Verify / build

- `npx tsc --noEmit --incremental false` — must be clean.
- `npx eslint <changed files>` — clean (repo has a few pre-existing warnings that
  don't block builds).
- `npm run build` — static export (~40 routes incl. `/media` + 60 member pages).
  If it fails at Google Fonts, that's the sandbox network gotcha (§4).
- Serve `out/` on :3002 and check: `/` and `/media` render (Instagram embeds
  load); no member email/LinkedIn anywhere public; portal "Google" calendar view
  loads (currently the Google sign-in wall until the calendar is public); a
  non-roster email is REJECTED at sign-in; header + footer social both work.
- Cannot verify from the sandbox: real Supabase login (needs the project set up),
  and the Google Calendar showing events (needs the calendar made public).

---

## File map (key files)

| File | Role |
|---|---|
| `src/lib/supabase.ts` / `roles.ts` / `access.ts` | Auth client, roster data-access + roles, permissions |
| `src/context/AuthContext.tsx` | Auth provider (Supabase + mock, allowlist-enforcing) |
| `src/app/portal/page.tsx` | Login (Real vs Mock) |
| `src/app/portal/admin/page.tsx` | Admin center incl. `RolesPanel` + Archive |
| `src/components/portal/PortalShell.tsx` | Portal chrome; Admin nav gated by `manage:roles` |
| `src/app/portal/events/page.tsx` | Calendar incl. "Google" embed view + add-to-gcal links |
| `src/data/calendar.ts` | Google Calendar ID + embed/template-link helpers |
| `src/app/media/page.tsx` + `src/components/media/InstagramEmbed.tsx` | Media page + IG embeds |
| `src/data/social.ts` | Social URLs (header/footer/media) |
| `src/data/members.ts` | Roster for the public directory (president = Abhinav Gunda) |
| `src/app/members/[slug]/page.tsx` | Public profile (no contact info) |
| `src/components/ui/SectionHeader.tsx` | Section titles (lowercase-blue subtitle removed) |
| `db/supabase-roles.sql` | Runnable table + RLS + allowlist trigger + seed |
| `docs/supabase-setup.md` | Step-by-step Supabase setup |

---

## Git state

Remote `github.com/msp276-bot/akpsi-site`, branch `main`. This doc is committed
alongside the batch it describes: president fix, lowercase-blue removal, header
social icons, Media page + Instagram embeds, public-calendar removal, portal
Google Calendar integration, allowlist enforcement in mock, and the privacy fix.
Nothing about the reverted homepage glass redesign is in the tree (it was fully
reverted). Commit only when the user asks.
