# AKPsi Omicron Tau Website — Project State (fresh-session handoff)

Chapter website for **Alpha Kappa Psi, Omicron Tau (Rutgers)**: public marketing
pages + a members-only portal (roster, submissions/points/approvals), shipped as
an installable **PWA**. This is the single source of truth for a new session.
Reference material first; **Next steps** and **How to work in this repo** are at
the end.

---

## 1. Overview & stack

- **Public site:** home, about, members directory + per-member profiles, `/media`
  (Instagram highlights), rush, `/offline` (PWA fallback).
- **Portal (`/portal/…`):** dashboard, events, directory, documents,
  announcements, **points** (submit service hours / brother points), **review**
  (VP-Ops approval queue), applications, admin (role management).
- **Next.js 16** (App Router, **Turbopack**), **React 19**, **TypeScript**.
- **Tailwind CSS v4** (`@theme inline` in `globals.css`; tokens: `navy #1a2744`,
  `gold #d4a853`, `blue`, `scarlet`, `ink`, `muted`, `line`). framer-motion +
  lucide-react.
- **Static export** — `next.config.ts`: `output:"export"`, `trailingSlash:true`,
  `images.unoptimized:true`. **No server, no Next API routes, no Server Actions.**
- **Supabase** (`@supabase/supabase-js`) for auth + roster + submissions +
  push-subscription storage — called **from the browser**; security is enforced
  by **Row-Level Security**, never by client code. One **Edge Function**
  (`send-push`) holds the VAPID private key (the one job that cannot run in the
  browser).
- **Fonts:** body = **Hanken Grotesk** (`--font-hanken` → `--font-sans`); display
  serif = **Bodoni Moda** (`--font-display`); hero serif = **Instrument Serif**
  (`--font-instrument`).
- **Repo:** `github.com/msp276-bot/akpsi-site`, branch `main`.
- Preview: `npm run dev`, or serve the export: `npm run build && python3 -m
  http.server 3002 --directory out`.

**Repo gotcha (`AGENTS.md`):** this is a *modified* Next.js with breaking changes
vs. training data — read `node_modules/next/dist/docs/` before using unfamiliar
Next APIs.

---

## 2. Architecture decisions

| Decision | Reasoning | Forecloses |
|---|---|---|
| Static export, no server | Frontend-first, trivial hosting | No server middleware/secrets, **no Server Actions**. Anything needing writes/secrets uses browser-safe Supabase (RLS) or a build-time constant |
| Supabase from the browser | Keeps static export; anon key limited by RLS | Every "president/VP-only" rule is enforced by **RLS + a signup trigger**, NOT client code — never "fix" a permissions bug client-side |
| Roster table = allowlist AND role store | One source of truth; add email ⇒ grant login+role | Roles never come from hardcoded lists |
| Graceful mock fallback (no Supabase env) | Preview works with zero credentials | Mock is localStorage-only, per-browser — a behaviour demo, not real enforcement |
| Roles: pledge<active<board<president<admin | `president` = board perms + `manage:roles`; `admin` = `admin:*` | Review/submit gated by permissions, not hardcoded emails |
| **Photo parallax = `background-attachment: fixed`** | The transform-drift approach needed to oversize the image (visible zoom) for only a subtle effect; `bg-fixed` pins the image so it clearly parallaxes with **no zoom**, matching the Squarespace "Fixed" reference | **iOS Safari ignores `bg-fixed`** and falls back to normal scroll — photos are static on iPhone, not broken. Per-hero framing is set with `background-position` |
| Hero **video** = navy dissolve only (no drift) | Project spec §7 wanted the hero to "dissolve into navy — nothing more"; drift zoomed the video | Video hero does not parallax |
| **Points/submissions = Supabase table + Storage + RLS** | Cross-user (pledge submits → VP Ops reviews on another device) requires a shared backend | Cannot function in mock mode across devices; needs Supabase live |
| Pledge login = username→synthetic email + password | Pledges have no @rutgers.edu; Supabase Auth is email-based | Pledge accounts are provisioned (Auth user + roster row); passwords set server-side |
| PWA, not native | Web reach + app-like UX from one codebase | No App Store; iOS push needs home-screen install |
| Google Calendar = read-only embed + add-links | No backend to hold OAuth tokens | No RSVP write-back into Google |
| Instagram = official `/embed/captioned` iframe, hand-curated | Static site can't hold IG tokens | No live feed; a maintained array of permalinks |

---

## 3. Constraints / gotchas discovered

**Platform / build**
- Static export ⇒ no server code. RLS + the `auth.users` signup trigger are the
  enforcement points, not middleware.
- `app/manifest.ts` **requires `export const dynamic = "force-static"`** under
  `output:"export"` or `npm run build` hard-fails.
- The Deno Edge Function must be excluded from the app's TS: `tsconfig.json`
  `"exclude": ["node_modules", "supabase/functions"]`.
- Lint `react-hooks/set-state-in-effect` (Next 16) is enforced as an **error**.
  Never `setState` synchronously in an effect, and don't call a `useCallback`
  that setStates from an effect body either — inline the async work in the effect
  and setState after `await` (see the `reloadKey` pattern in the points/review
  pages). `npm run build` still succeeds with these lint errors, but keep clean.
- Pre-existing lint error in `Hero.tsx` (`setPaused` in the reduced-motion
  effect) is known and does not block builds.

**Parallax / images**
- `background-attachment: fixed` sizes to the **viewport**, so a short hero at the
  top of the page shows the top slice of a viewport-tall image. Frame each hero
  with `background-position` (About = `center 170%`, Media = `center 220%`;
  values > 100% are valid and push the crop past bottom to lift faces up).
- On a **tall/narrow** viewport a wide image covers by height (no vertical slack),
  so `background-position-Y` has no effect there; it works on wider viewports.
- iOS ignores `bg-fixed` → no parallax on iPhone (graceful, not broken).

**PWA / service worker**
- The service worker (`public/sw.js`) caches aggressively. After a rebuild the
  browser serves the **old** cached page until a hard reload (Cmd+Shift+R) or SW
  unregister. **Bump `CACHE_VERSION`** on meaningful releases so the SW
  self-updates and purges old caches. Currently `akpsi-v3`.
- iOS push requires the app be added to the Home Screen (iOS 16.4+); install +
  offline need HTTPS (not testable on plain localhost).

**Typography / assets**
- Söhne / Neue Haas Grotesk are licensed and not on Google Fonts; **Hanken
  Grotesk** is the free stand-in. Real files → drop `.woff2` in `public/fonts/`
  and switch `layout.tsx` to `next/font/local`.
- Company logos in `public/logos/*.svg` were sourced from **Wikipedia infoboxes**
  (MediaWiki API → `imageinfo` → download from `upload.wikimedia.org` with a real
  `User-Agent`). Static export ⇒ logos must live in `public/`, never hotlinked.
- An `<img>` SVG with only a `viewBox` collapses to height 0 under `max-height`;
  give it a **definite height** (`h-8 w-auto object-contain`).
- **Member headshots:** originals were multi-MB and included `.heic`/`.pdf`
  (browsers can't render those). All were converted with `sips` to
  `<slug>.jpg`, resized to max 900px, ~82 quality (~4MB total for 40). Convention
  = `/members/<slugify(name)>.jpg`. `Olivia Occhipinti Headshot.jpg` was **skipped
  — no matching roster member** (add her to `members.ts` if she belongs, then
  re-run the headshot pipeline).

**Content / style conventions**
- **NO EM DASHES anywhere** (prose, comments, commits). En dashes (`A–Z`,
  `Class of ’28`) are fine.
- **`AKΨ` must NOT appear in on-page copy** — the fonts ship no greek subset, so
  Ψ falls back and mismatches. Use **`AKPsi`** in copy; Ψ survives only in
  OS/browser chrome (`manifest.short_name`, `appleWebApp.title`, `<title>`,
  og:site_name, the Satori og-image, code comments).
- Do not assert unknown facts about real, named people (majors, class years).
- **`SectionHeader` reveal was broken** (every title invisible, frozen at
  `translateY(51.7px)`) and is now **fixed** — see §5.3.

**Open item**
- **Points rules in `src/lib/points.ts` are PLACEHOLDER** (categories, values,
  pledge 30 / brother 20). The chapter must confirm the real numbers.

---

## 4. Data model

### 4a. `members` roster / login allowlist — `db/supabase-roles.sql` (authoritative)
Table is BOTH role store AND allowlist: on it ⇒ can sign in with that role; off
it ⇒ rejected at signup (a `before insert on auth.users` trigger). RLS: any
authed member reads; only president/admin write. Roles:
`pledge|active|board|president|admin`. Email check historically `@rutgers.edu`;
now also allows pledge + chapter position domains (see §5.1).

### 4b. `submissions` — `db/submissions.sql` (NEW; run after supabase-roles.sql)
Service-hours / brother-points submissions with photo proof + approvals.
```sql
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_email   text not null references public.members(email) on delete cascade,
  submitter_name    text not null default '',
  category_id       text not null,
  event_description text not null default '',
  hours             numeric,
  points            numeric not null default 0,
  proof_path        text,            -- path in the private `proofs` Storage bucket
  status            text not null default 'pending'
                    check (status in ('pending','approved','denied')),
  reviewed_by       text references public.members(email),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);
-- helper: can the caller review? board/president/admin (VP Ops sits on the e-board)
create or replace function public.can_review_submissions() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members m
    where m.email = lower(auth.jwt() ->> 'email') and m.role in ('board','president','admin')); $$;
-- RLS: insert as self; select own-or-reviewer; update/delete reviewer-only.
-- Storage: private bucket `proofs`; upload into own "<email>/" folder; read own or reviewer.
```

### 4c. `push_subscriptions` — `db/push-subscriptions.sql`
One row per opted-in browser; RLS lets a member manage only their own rows,
president/admin (or the service-role Edge Function) read all.

### 4d. Public member record — `src/data/members.ts`
No `email` field (privacy). `slug = slugify(name)`; photo path
`/members/<slug>.jpg`. **~55 members after de-duping**; 40 now have real
headshots (board fully covered). Board = President → EVP → VPs.
```ts
export interface Member {
  id: string; slug: string; name: string; position: string;
  major?: string; minor?: string;
  group: "board" | "directors" | "actives" | "alumni";
  cohort?: "Alpha Founding" | "Beta Founding" | "Alpha Tau";
  classYear: string; industry?: string; bio?: string;
  photo?: string; linkedin?: string; // linkedin shown ONLY inside /portal
}
```
De-dupes applied: Abhinav Gunda and Oluwatomisin Abiola each existed as both a
board VP and an "active brother" row — the active duplicates were removed so
they don't render twice on the Members tab (which includes board).

---

## 5. Feature breakdown (load-bearing / new code)

### 5.1 Auth + logins (SECURITY-CRITICAL)
Files: `src/lib/supabase.ts`, `src/lib/roles.ts`, `src/lib/access.ts`,
`src/context/AuthContext.tsx`, `src/app/portal/page.tsx`, `db/supabase-roles.sql`.

- **`roles.ts`** — canonical roles + roster data-access (dual Supabase/mock).
  Added for pledge/position logins:
```ts
export const PLEDGE_EMAIL_DOMAIN = "pledge.rutgersakpsi.org";
export const CHAPTER_EMAIL_DOMAIN = "rutgersakpsi.org";
const ALLOWED_ROSTER_DOMAINS = ["rutgers.edu", PLEDGE_EMAIL_DOMAIN, CHAPTER_EMAIL_DOMAIN];
export function pledgeUsernameToEmail(u: string) { return `${u.trim().toLowerCase()}@${PLEDGE_EMAIL_DOMAIN}`; }
// upsertMember() now allows any of ALLOWED_ROSTER_DOMAINS (was @rutgers.edu only).
// MOCK_SEED also seeds a demo pledge (pledge1@pledge.rutgersakpsi.org, role pledge)
// and a VP-Ops position account (ops@rutgersakpsi.org, role board, "Prakruti Ankem").
```
- **`access.ts`** — `Permission` union adds `"submissions:submit"` and
  `"submissions:review"`. `submit` → all member roles; `review` → board /
  president / admin (admin via `admin:*`). `hasPermission(role, perm)` unchanged.
- **`AuthContext.tsx`** — adds `signInWithPassword(identifier, password)`:
  a bare username maps to `pledgeUsernameToEmail(username)`, an `@`-address is
  used as-is (position accounts / brothers). Supabase mode:
  `supabase.auth.signInWithPassword({email,password})` then `lookupMember` for
  the role (fails closed if not on roster). Mock mode: password is ignored (real
  password checks are Supabase's job) — any roster account signs in. Google
  OAuth + magic link (brothers, @rutgers.edu) unchanged.
- **`portal/page.tsx`** — `PledgeLogin` is a username/password form embedded in
  the **"Pledge portal"** chooser button of `MockSignIn`, and behind a "Pledge or
  position login" toggle in `RealSignIn`. Selecting Pledge portal shows the form
  instead of Google.

**Prak's (VP Ops) login:** identifier `ops@rutgersakpsi.org`, role `board`
(⇒ sees the **Review** tab). *Preview:* choose "Pledge portal" (or the "Pledge or
position login" toggle), enter `ops@rutgersakpsi.org` + any password. *Production:*
create that Supabase Auth user with a real password + a `members` row (role
`board`); she signs in with it. The `ops@` address is a placeholder — any chapter
position email works as long as it's on the roster with a reviewer role.

### 5.2 Portal: submissions + points + approvals (NEW)
Files: `src/lib/points.ts`, `src/lib/submissions.ts`, `src/app/portal/points/`,
`src/app/portal/review/`, `db/submissions.sql`, nav in
`src/components/portal/PortalShell.tsx`.

- **`points.ts`** — PLACEHOLDER config the chapter must confirm:
```ts
export const POINT_CATEGORIES = [
  { id:"service",      label:"Service / Volunteer Hours", kind:"service_hours", pointsPer:1, hint:"…" },
  { id:"professional", label:"Professional Event",        kind:"points",        pointsPer:2 },
  { id:"social",       label:"Social / Brotherhood Event",kind:"points",        pointsPer:1 },
  { id:"fundraising",  label:"Fundraising (RUDM…)",        kind:"points",        pointsPer:2 },
];
export const POINT_REQUIREMENTS = { pledge: 30, brother: 20 } as const;
export function requirementFor(role){ return role==="pledge"?30:20; }
export function pointsForSubmission(catId, hours){ /* service = hours*pointsPer, else pointsPer */ }
```
- **`submissions.ts`** — dual impl. `createSubmission` (uploads proof to the
  `proofs` bucket in Supabase mode; stores a data-URL in mock),
  `listMySubmissions(email)`, `listAllSubmissions()` (RLS-gated to reviewers),
  `reviewSubmission(id, "approved"|"denied", reviewerEmail)`,
  `approvedPoints(subs)`, `pendingCount(subs)`. Supabase reads mint short-lived
  signed URLs for proof photos.
- **`/portal/points`** (`submissions:submit`, incl. pledges) — points summary
  (approved / outstanding / progress), a submit form (category, hours if service,
  event description, photo proof), and "My submissions" with status badges.
  Content lives in an inner `PointsBody` so it only mounts once `PortalShell` has
  an authenticated user. Data loads via an inline async effect keyed on a
  `reloadKey` (bumped after submit) to satisfy the set-state-in-effect lint rule.
- **`/portal/review`** (`submissions:review`) — Pending/All filter, each row with
  name / email / category / hours / points / description + proof photo, Approve /
  Deny buttons; non-reviewers see a "Not authorized" card.
- **`PortalShell` NAV** adds `Points` (permission `submissions:submit`, also added
  to `PLEDGE_NAV`) and `Review` (permission `submissions:review`).

### 5.3 SectionHeader (redesigned + reveal fixed)
`src/components/ui/SectionHeader.tsx`. Old bug: the title animated from
`y:"110%"` inside an `overflow-hidden` wrapper, so the IntersectionObserver
watched an element already outside its clip and the reveal never fired (every
section title was invisible). Now: a **gold/blue kicker + serif title + gold
accent bar**, each fading up on scroll-in via `whileInView` with a small offset
(observed element stays in view). `subtitle` is the kicker (blue on light, gold
on dark).
```tsx
const kickerColor = tone === "light" ? "text-gold" : "text-blue";
// <motion.span> kicker (subtitle) · <motion.h2> title (initial opacity0 y24 → whileInView) · <motion.span> gold bar (w-14 h-[3px], scaleX 0→1)
```

### 5.4 Parallax backdrops (NEW)
`src/components/anim/ParallaxImage.tsx` — decorative full-bleed backdrop using
`background-attachment: fixed` (no client hooks, no zoom):
```tsx
export default function ParallaxImage({ src, className="", position="center" }) {
  return (
    <div aria-hidden
      className={`pointer-events-none absolute inset-0 select-none bg-cover bg-fixed ${className}`}
      style={{ backgroundImage: `url('${src}')`, backgroundPosition: position }} />
  );
}
```
Used on: home `AboutSection` (`/chapter-group.jpg`), `/about` hero
(`/about-chapter.jpg`, `position="center 170%"`), `RushHero`
(`/chapter/stairs-candid.jpg`), `/media` hero (`/chapter/lecture-hall.jpg`,
`position="center 220%"`). Replaced the previous `next/image fill` backdrops
(their `Image` imports were removed). The **home hero video** (`Hero.tsx`) instead
uses framer `useScroll`+`useTransform` for a navy-wash overlay that rises as the
hero scrolls out (dissolve into navy, §7) — no drift, no zoom.

### 5.5 Members directory + photos
`src/components/members/{MembersDirectory,MemberCard,MembersSection}.tsx`,
`src/data/members.ts`. Board is the first/default tab (`TABS=["board","actives",
"alumni"]`); the "Members" tab includes board members. `MemberCard` renders
`member.photo` via `object-cover` in an `aspect-[3/4]` tile, monogram fallback
otherwise. 40 members have `/members/<slug>.jpg` headshots.

### 5.6 "Our Network" logo wall — `src/components/about/LogoMarquee.tsx`
Three infinite marquee rows on the brand-blue band, **no company repeated across
rows** (14 / 15 / 13 = 42): row 1 (`marquee-track-1`, left), row 2
(`marquee-track-2`, right — the chapter's requested list: Crowe … Amazon), row 3
(`marquee-track-3`, left). Compact visible "Our Network" heading. Logos are plain
`<img h-8 w-auto object-contain>` on white chips; 45 SVG/PNG logos in
`public/logos/`.

### 5.7 Other pages (stable)
Home = Hero(video) → AboutSection → PresidentLetter → Testimonials → CTASection.
Testimonials (5 real brothers: Olivia Karanxha, Justin Arnoldi, Jayden Arya,
Judy Ku, David Fordjour). Rush = RushHero → RushTimeline → WhyAkpsi → RushFAQ
("FAQ" heading + "+" toggles) → **RushApply** (external "Application Portal" +
"Interest Form" buttons — URLs are `"#"` placeholders in `RushApply.tsx`, the old
inline `RushForm.tsx` is now unused). Media = photo hero + 4 Instagram embeds.
Contact email sitewide = `rutgersakpsi2024@gmail.com`.

### 5.8 PWA + push (LIVE / dormant)
`app/manifest.ts` (needs `dynamic="force-static"`), icon set, `public/sw.js`
(offline shell + push; `CACHE_VERSION="akpsi-v3"`), `src/lib/push.ts`
(`isPushConfigured` gate), `supabase/functions/send-push/index.ts` (Deno; holds
VAPID private key). Push is built but **dormant** until `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
+ Supabase are set. Setup: `docs/pwa-push-setup.md`.

---

## 6. Current status — DONE

- Public site content complete (home, about, members, media, rush).
- **Our Network**: 3-row logo wall, no repeats; 45 real logos.
- **Section headers redesigned + reveal fixed** (kicker + title + gold bar).
- **Parallax** on all four photo backdrops (`bg-fixed`); About/Media framed
  higher via `background-position`; hero video dissolves into navy.
- **Members**: Board-first tab; **40 real headshots** wired; Abhinav +
  Oluwatomisin de-duped.
- **Portal submissions/points/approvals** feature built (points/review pages,
  data lib, RLS SQL, nav) — works in preview (mock), ready for Supabase.
- **Pledge + VP-Ops logins** (username/password / position email).
- PWA live; push built but dormant.
- Build clean: 82 routes + ~55 member pages; tsc + eslint clean (one known
  pre-existing Hero warning).

---

## 7. NEXT STEPS

### 7a. Supabase go-live (unblocks the portal + real logins) — REQUIRES USER
The portal is Supabase-backed but **cannot share data across devices until
Supabase is live** (currently mock/preview mode). Runbook (`docs/supabase-setup.md`
+ the SQL files):
1. Create a Supabase project. Copy the URL + anon key into env
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`); rebuild.
2. SQL editor: run `db/supabase-roles.sql`, then `db/submissions.sql`, then
   `db/push-subscriptions.sql`. Seed at least one `president`/`admin` roster row.
3. **Provision accounts** (Auth → Add user, plus a matching `members` row):
   - Brothers: their `@rutgers.edu` (Google/magic-link, no password needed).
   - Pledges: create `<username>@pledge.rutgersakpsi.org` Auth users with
     passwords; `members` row role `pledge`. Hand each pledge their username +
     password on day one.
   - VP Ops (Prak): `ops@rutgersakpsi.org` Auth user + password; `members` row
     role `board`.
4. Storage: `db/submissions.sql` creates the private `proofs` bucket + policies.
5. **Confirm the real points rules** and replace the placeholders in
   `src/lib/points.ts` (categories, values, pledge/brother requirements).
6. (Optional) Activate push: `web-push generate-vapid-keys`, set
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, deploy `send-push`, set VAPID secrets.

*I cannot run these — they need your Supabase project + credentials. Everything
in code + SQL is ready; hand me env values or run the runbook and I'll verify.*

### 7b. Member photos — DONE, with follow-ups
40 headshots wired. Remaining: members without a headshot render a monogram
(fine). If `Olivia Occhipinti` is a real member, add her to `members.ts` and drop
`olivia-occhipinti.jpg` (re-run the sips convert). If more headshots arrive, run
the same pipeline: `sips -s format jpeg -s formatOptions 82 -Z 900 "<file>"
--out public/members/<slug>.jpg`, then add `photo:"/members/<slug>.jpg"`.

### 7c. Smaller open items
- Rush **Application Portal / Interest Form** URLs are `"#"` placeholders in
  `src/components/rush/RushApply.tsx` — drop in the real form links.
- Google Calendar must be shared **public** for the `/portal/events` embed to
  show events (Calendar settings, not code).
- Rush video: set `RUSH_VIDEO` on the Media page.
- Optional: majors/bios for members; remaining member headshots.

---

## 8. How to work in this repo

**Verify:** `npx tsc --noEmit --incremental false` (clean) · `npx eslint <files>`
(clean; one known Hero warning) · `npm run build` (static export to `out/`).
**Preview the real build** (not `next dev` — fonts/SW go stale there):
`npm run build && python3 -m http.server 3002 --directory out`, then
**hard-reload** (Cmd+Shift+R) to beat the service-worker cache; bump
`CACHE_VERSION` in `public/sw.js` on real releases.

**Deployment (IMPORTANT):** there is **NO CI/CD** (no workflows/vercel/netlify
config). `rutgersakpsi.com` is served from **S3 + CloudFront** and deploys are
**manual**: `npm run build`, then sync `out/` to the bucket and invalidate the
CDN. **Pushing to GitHub does NOT change the live site.** No AWS creds are in the
repo. Wiring GitHub Actions → S3/CloudFront is an open task.

**Conventions:** no em dashes; `AKPsi` (not `AKΨ`) in copy; commit only when
asked; history commits directly to `main`; end commit messages with
`Co-Authored-By: Claude <noreply@anthropic.com>`.

**Key file map**
| File | Role |
|---|---|
| `src/lib/roles.ts` / `access.ts` / `supabase.ts` | Roster + roles + permissions + client |
| `src/context/AuthContext.tsx` | Auth (Google/magic-link + `signInWithPassword`) |
| `src/app/portal/page.tsx` | Sign-in (RealSignIn / MockSignIn + `PledgeLogin`) |
| `src/lib/points.ts` / `submissions.ts` | Points config (PLACEHOLDER) + submissions data |
| `src/app/portal/points/` / `review/` | Submit + points; VP-Ops review queue |
| `src/components/portal/PortalShell.tsx` | Portal chrome + gated nav (Points, Review) |
| `db/supabase-roles.sql` / `submissions.sql` / `push-subscriptions.sql` | Schema + RLS |
| `src/components/anim/ParallaxImage.tsx` | `bg-fixed` photo backdrops |
| `src/components/ui/SectionHeader.tsx` | Kicker + title + gold bar (reveal fixed) |
| `src/components/sections/Hero.tsx` | Video hero + navy-dissolve on scroll |
| `src/data/members.ts` | Roster (40 headshots wired) |
| `src/components/members/*` | Directory, card, section |
| `src/components/about/LogoMarquee.tsx` | 3-row "Our Network" wall |
| `public/members/<slug>.jpg` | Member headshots (sips-processed) |
| `docs/supabase-setup.md` / `pwa-push-setup.md` | Setup runbooks |

**Git:** branch `main` on `github.com/msp276-bot/akpsi-site`. Recent:
`f07c288` parallax + submissions/points portal + pledge/position logins;
`c78cb5d` section-header redesign + content + Our Network wall.
