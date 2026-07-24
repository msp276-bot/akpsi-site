# AKPsi Omicron Tau Website - Project Spec / State

Chapter website for **Alpha Kappa Psi, Omicron Tau (Rutgers)**: public marketing
pages + a members-only portal with a president-managed roster, shipped as an
**installable PWA** for brothers. Single source of truth for a fresh session.
Reference material first; the actual task (if any) goes last.

---

## 1. Overview & stack

- **Public site:** home, about, members directory + per-member profiles, `/media`
  (Instagram highlights), rush, `/offline` (PWA fallback).
  **Portal (`/portal/…`):** dashboard, events, directory, documents,
  announcements, applications, admin.
- **Next.js 16** (App Router, **Turbopack**), **React 19**, **TypeScript** - the app.
- **Tailwind CSS v4** (`@theme inline` in `globals.css`; tokens: `navy #1a2744`,
  `gold #d4a853`, `blue`, `scarlet`, `ink`, `muted`, `line`). framer-motion +
  lucide-react.
- **Static export** - `next.config.ts`: `output:"export"`, `trailingSlash:true`,
  `images.unoptimized:true`. **No server, no Next API routes, no Server Actions.**
  Chosen because the site is frontend-first and hosting stays trivial; every
  "backend" need is met by a browser-callable external service or a build-time
  constant.
- **Supabase** (`@supabase/supabase-js`) for real auth + the shared roster +
  push-subscription storage - called **from the browser**, so the site stays a
  static export. Security is enforced by Supabase **Row-Level Security**, never
  by the client. One **Edge Function** (`send-push`) exists for the one job that
  structurally cannot run in the browser (holding the VAPID private key).
- **Fonts:** body = **Hanken Grotesk** (`next/font/google`, `--font-hanken` →
  `--font-sans`); display serif = **Bodoni Moda** (`--font-display`); hero serif =
  **Instrument Serif** (`--font-instrument`). See §3/§4 on why not Söhne.
- **Repo:** `/Users/marvinpatel/claude code/akpsi-site` · remote
  `github.com/msp276-bot/akpsi-site` · branch `main`.
- Preview: `npm run dev` (or the static export via `python3 -m http.server 3002
  --directory out` after `npm run build`).

**Repo gotcha:** `AGENTS.md` warns this is a *modified* Next.js with breaking
changes vs. training data - read `node_modules/next/dist/docs/` before using
unfamiliar Next APIs.

---

## 2. Data model

### 2a. `members` roster / login allowlist - RUNNABLE, authoritative (`db/supabase-roles.sql`)
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
--  president/admin to bootstrap - they add everyone else from the website.)
```

### 2b. `push_subscriptions` - RUNNABLE (`db/push-subscriptions.sql`)
One row per browser/device that opted into push. Run AFTER `supabase-roles.sql`
(reuses `is_roster_manager()` and FKs to `members`).

```sql
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

-- A member may add/update/delete ONLY their own subscriptions.
drop policy if exists "push_insert_self" on public.push_subscriptions;
create policy "push_insert_self" on public.push_subscriptions
  for insert to authenticated
  with check (member_email = lower(auth.jwt() ->> 'email'));

drop policy if exists "push_update_self" on public.push_subscriptions;
create policy "push_update_self" on public.push_subscriptions
  for update to authenticated
  using (member_email = lower(auth.jwt() ->> 'email'))
  with check (member_email = lower(auth.jwt() ->> 'email'));

drop policy if exists "push_delete_self" on public.push_subscriptions;
create policy "push_delete_self" on public.push_subscriptions
  for delete to authenticated
  using (member_email = lower(auth.jwt() ->> 'email'));

-- Read: own rows, or all rows for president/admin. The Edge Function uses the
-- service role and bypasses RLS to read everyone.
drop policy if exists "push_select_self_or_manager" on public.push_subscriptions;
create policy "push_select_self_or_manager" on public.push_subscriptions
  for select to authenticated
  using (
    member_email = lower(auth.jwt() ->> 'email')
    or public.is_roster_manager()
  );
```

### 2c. Member record (public directory) - `src/data/members.ts`
Real roster loaded (~60 members). **No `email` field exists** (deliberate - §4 privacy).

```ts
export interface Member {
  id: string; slug: string; name: string; position: string;
  major?: string; minor?: string;
  group: "board" | "directors" | "actives" | "alumni";
  cohort?: "Alpha Founding" | "Beta Founding" | "Alpha Tau";
  classYear: string; industry?: string; bio?: string;
  photo?: string; linkedin?: string; // linkedin shown ONLY inside /portal
}
export const GROUP_LABELS: Record<MemberGroup, string> = {
  board: "Board", directors: "Directors", actives: "Actives", alumni: "Alumni",
};
// slug = slugify(name); getMemberBySlug(slug).
// President = Abhinav Gunda (id b1), the ONLY member with a real photo so far:
// { id:"b1", name:"Abhinav Gunda", position:"President", group:"board",
//   cohort:"Alpha Founding", classYear:"2027", photo:"/members/abhinav-gunda.jpg" }
```

### 2d. `db/schema.sql`
A broader **aspirational** draft (events, announcements, documents w/ archive
columns, applications, audit logs). NOT the live model - a header note points to
`supabase-roles.sql` as authoritative. Don't run both `members` defs.

---

## 3. Architecture decisions

| Decision | Reasoning | Forecloses |
|---|---|---|
| Static export, no server | Frontend-first; trivial hosting; nothing forced a server | No server-side middleware/secrets, **no Server Actions**. Anything needing writes/secrets must use a browser-safe external service (Supabase w/ RLS) or a build-time constant |
| Supabase called from the browser | Keeps static export; anon key limited by RLS | "President-only" and the allowlist are enforced by **RLS + a signup trigger**, NOT client code - never "fix" a permissions bug client-side |
| Roster table = allowlist AND role store | One source of truth; add email ⇒ grant login+role | Roles never come from hardcoded email lists; they come from the roster |
| Graceful mock fallback (no Supabase env) | Preview works with zero credentials | Mock is localStorage-only, per-browser, NOT secure - a demo of the behavior, not real enforcement |
| Roles: pledge<active<board<president<admin | `president`=board perms+`manage:roles`; `admin`=`admin:*`(tech). Only those two manage the roster | `manage:roles` gates the Roles panel AND the Admin nav so the president reaches it without full admin |
| **PWA, not a native app** | Reach of the web + app-like UX from ONE codebase; instant updates, no store review/fees | No App Store/Play presence. iOS push only works **after** home-screen install (§4) |
| **Push via Supabase Edge Function + `web-push`**, not Server Actions | Static export can't run Server Actions - the Next PWA guide explicitly says static exports must call an external API instead | The VAPID **private** key lives only in Supabase secrets; it must never enter the client bundle |
| **Push ships dormant, gated on env** | Lets the PWA ship before Supabase go-live | Toggle renders "not available yet" and `sendPushToChapter()` no-ops until `NEXT_PUBLIC_VAPID_PUBLIC_KEY` **and** Supabase are both set |
| Push sender restricted to roster managers | Prevents any member from spamming the chapter | The Edge Function re-verifies the caller's JWT against `members.role` server-side; client-side gating is not the control |
| **Body font = Hanken Grotesk (Google Fonts)** | Söhne / Neue Haas Grotesk are **commercial** and cannot be downloaded or bundled; Hanken is the closest free neutral grotesk | Using the real Söhne/NHG requires purchased `.woff2` files + `next/font/local` (§4) |
| Google Calendar = read-only iframe embed + per-event "add" links | No backend/OAuth to hold tokens; public embed + template links need neither | No RSVP write-back / creating events INTO Google from the site - that needs a real backend |
| Instagram = official `/embed/captioned` iframe per post, hand-curated list | Static site can't hold Instagram API tokens; iframe needs no script/key | No live auto-updating feed; posts are a manually maintained array of permalinks |
| Login = Google OAuth **and** magic link (Supabase); mock demo accounts otherwise | Both wanted; magic link needs no Google Cloud setup | Real login needs the Supabase setup done (`docs/supabase-setup.md`) |

---

## 4. Constraints / gotchas discovered

**Platform / build**
- **Static export ⇒ no server code.** All persistence/auth is external
  (Supabase, browser-side) or build-time. RLS + the `auth.users` trigger are the
  enforcement points, not middleware.
- **`app/manifest.ts` REQUIRES `export const dynamic = "force-static"`** under
  `output:"export"`. Without it `npm run build` hard-fails with
  *"export const dynamic = 'force-static' … not configured on route
  /manifest.webmanifest"*. Confirmed, not a guess.
- **The Deno Edge Function must be excluded from the app's TypeScript.**
  `tsconfig.json` has `"exclude": ["node_modules", "supabase/functions"]` -
  otherwise `tsc` fails on `Deno`, `jsr:` and `npm:` specifiers.
- **`next/font` HMR goes stale when you swap font imports.** The running dev
  server will keep serving the OLD font and report `--font-sans` as unset.
  **Verify font changes against a production build** (`npm run build` + serve
  `out/`), not the dev server. In the built CSS, `--font-sans:var(--font-hanken),…`
  is emitted correctly and `body{font-family:var(--font-sans)}` resolves.
- **Google Fonts fetch can fail `npm run build` in a sandbox** - rerun with
  network access; not a code bug.
- **Lint `react-hooks/set-state-in-effect` (Next 16) is enforced** - never call
  `setState` synchronously in an effect body; do it after an `await`, in an event
  callback, or derive during render. (Pre-existing warnings live only in
  `FluidCanvas/CountUp/Hero/Button/fluidSimulation`; they don't block builds.)

**PWA / push**
- **iOS push requires the app be added to the Home Screen and opened from
  there** (iOS 16.4+). A bookmarked Safari tab gets nothing. Install + offline
  also require **HTTPS**, so neither is fully testable on plain `localhost`.
- **Push cannot be verified until Supabase is live** - it depends on real auth,
  the `push_subscriptions` table, and deployed VAPID secrets. Don't claim push
  works from a session that can't reach that infra.
- Service worker is plain `public/sw.js` (no Serwist/webpack plugin) precisely
  because static export + Turbopack make build-time SW generation awkward.

**Typography / assets**
- **Söhne and Neue Haas Grotesk are licensed commercial fonts.** They are not on
  Google Fonts and cannot be fetched or bundled. Hanken Grotesk is the stand-in.
  If the real files are ever purchased, drop `.woff2` into `public/fonts/` and
  switch `layout.tsx` to `next/font/local` - that is the only change needed.
- **App icons are generated from `public/akpsi-logo.png`** (Pillow script):
  `icon-192`, `icon-512` (transparent, "any"), `icon-maskable-512` (navy bg,
  badge at 80% for the safe zone), `apple-icon.png` (180px, **opaque navy** -
  iOS ignores transparency). The source badge was center-cropped off a larger
  canvas by detecting the **gold ring** bbox; a naive alpha-bbox trim leaves it
  off-center because faint shadow specks span the whole artboard.

**Content / style conventions**
- **NO EM DASHES anywhere in the codebase.** All 64 were removed site-wide
  (prose ` - ` → ` - `; empty-value placeholders → `-`). En dashes (`A–Z`,
  `Class of ’28`) are fine and were deliberately preserved. Do not reintroduce
  em dashes in copy, comments, or commit messages.
- **Do not assert facts about real, named people that aren't known.** Fabricated
  majors were removed from the testimonials rather than attached to real
  brothers' names.
- **Homepage "all frosted-glass over one flat navy" was built and FULLY REVERTED.**
  Do NOT re-flatten the homepage. The parked idea, if revisited: keep each
  section's real colors and let the hero **video bleed downward and dissolve into
  navy** - nothing more.
- **Public calendar page was built then removed** - the calendar lives ONLY on
  the portal (`/portal/events`, "Google" view).
- **Google Calendar embed requires the calendar be shared PUBLIC.** ID is wired;
  until it's public the embed shows Google's *"Sign in to your Google Account"*
  wall (confirmed live). Fix is in Google Calendar settings (Access permissions →
  "Make available to public"), not code.
- **Instagram login-walls scrapers**, so post URLs can't be auto-fetched - they
  must be provided. The `/embed/captioned` iframe DOES render public posts with
  no login (confirmed live for the 4 chapter posts).
- **Self-lockout guard:** the Roles panel disables editing/removing your own row.
- **Homepage sections must keep their own backgrounds.** The one photo backdrop
  that exists (`AboutSection`, §5.4) is scoped to that single section on purpose.
  It is NOT permission to glass/flatten Hero, PresidentLetter, Testimonials or
  CTASection - see the reverted redesign above.
- **`AKΨ` must NOT appear in on-page copy.** Hanken Grotesk ships no greek
  subset (`cyrillic-ext, latin, latin-ext, vietnamese`), and neither Bodoni Moda
  nor Instrument Serif has one either, so U+03A8 falls back to a system font and
  visibly mismatches its neighbours. Page copy uses **`AKPsi`**. Ψ survives ONLY
  where the OS or browser chrome renders it: `manifest.short_name`,
  `appleWebApp.title`, the `<title>` template, `og:site_name`, the
  `opengraph-image` (Satori), and code comments. There is no subset to add.
- **Two home-page "flow" experiments were built and FULLY REVERTED.** Do not
  redo either without being asked:
  1. `SectionFade`, a gradient ramp dissolving each section into the next. Read
     as odd, and measurably hurt contrast: the CTA eyebrow fell 6.72:1 → 3.90:1
     and the Testimonials eyebrow 3.42:1 → 2.44:1 under a 17% wash on mobile.
  2. Full-height scroll-snap panels (`html:has(#home)` + `min-h-svh` +
     `snap-start`). On a phone four of five panels overflow the viewport by
     271-600px, so snapping fought the content.
  Both reverted to `3bb8aee` exactly; `git diff 3bb8aee HEAD -- src/` was empty
  after each. The underlying complaint (dark→light→dark→light→dark reads blocky)
  is still open. Untried ideas: make Testimonials navy so there are two long
  tonal runs instead of a checkerboard, or tint the pure whites toward navy.

**Open bugs (pre-existing, UNFIXED)**
- **Every `SectionHeader` title on the site renders INVISIBLE.** Confirmed live
  on `/rush` (all 4) and `/about` ("Our Network", "Benefits"); also affects
  "Our Members" on `/members`. Root cause in
  `src/components/ui/SectionHeader.tsx`: the `motion.h2` starts at `y:"110%"`,
  which places it entirely outside its own `overflow-hidden` wrapper, so the
  IntersectionObserver behind `whileInView` sees zero visible area, the
  `amount:0.4` threshold never trips, and the reveal never fires. The title
  stays frozen at `translateY(51.743px)` forever. Fix = move the `whileInView`
  trigger to the wrapper and animate the child via variants, rather than
  observing the clipped element. Left unfixed because it changes headings on
  every page and was never scoped.
- **"Our Network" blue band fails WCAG AA for its small text.** White on the
  brand blue `#5b8ec6` measures **3.43:1** - fine for the large heading, short
  of the 4.5:1 the 18px wordmarks and 12px caption need. Solid white is the best
  available on this blue (navy would be 4.32:1, also short). A deeper blue is
  the real fix; `#3a6ca8` measures 5.4:1 and still reads as blue.

---

## 5. Feature breakdown (load-bearing code reproduced exactly)

### 5.1 Auth + login allowlist  (SECURITY-CRITICAL)
Files: `src/lib/supabase.ts`, `src/lib/roles.ts`, `src/context/AuthContext.tsx`,
`src/lib/access.ts`, `db/supabase-roles.sql`.

- **`src/lib/supabase.ts`** - `isSupabaseConfigured = Boolean(NEXT_PUBLIC_SUPABASE_URL && NEXT_PUBLIC_SUPABASE_ANON_KEY)`;
  `getSupabase()` returns a memoized client or `null` (mock mode). Anon key is
  browser-safe (RLS-limited); the `service_role` key must never appear in the app.

- **`src/lib/roles.ts`** - canonical roles + roster data-access, dual impl:
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

- **`src/context/AuthContext.tsx`** - mode = `supabase` when configured, else
  `mock`. Exposes `{user,loading,mode,signInWithGoogle,requestMagicLink,signOut}`.
  Supabase mode resolves the session email → `lookupMember`; **if not on the
  roster it signs the session out** (fail-closed behind the DB trigger). Mock mode
  ALSO enforces the allowlist (mirrors production). Exact mock sign-in:
```ts
const mockSignIn = useCallback(
  async (email?: string, _membership: "active" | "pledge" = "active") => {
    await new Promise((r) => setTimeout(r, 700));
    const address = (email ?? "member@rutgers.edu").trim().toLowerCase();
    if (!address.endsWith(RUTGERS_DOMAIN)) {
      throw new Error("That account isn't a @rutgers.edu address. The member portal is limited to Rutgers accounts.");
    }
    // Allowlist: only emails on the roster (added by a president / tech / admin)
    // may sign in - mirrors the server-side Supabase enforcement.
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
// useAuth() throws outside an AuthProvider.
```

- **`src/lib/access.ts`** - `Permission` union incl. `"manage:roles"` and
  `"admin:*"`; `ROLE_PERMISSIONS` maps each role; `hasPermission(role,perm)`
  (admin:* satisfies all). President's set = board perms + `manage:roles`.
  **Frontend perms here and the DB RLS in `supabase-roles.sql` encode the same
  rules - keep them in sync.**

- **Roles UI** - `src/app/portal/admin/page.tsx`: `MODULES[0]` is
  `{id:"roles", permission:"manage:roles"}` (rest `"admin:*"`); `visibleModules`
  filters by `hasPermission`; `RolesPanel` (add email+name+role / change role /
  remove) calls `upsertMember`/`removeMember`, passes `actorEmail`, disables the
  current user's own row, and shows a Live-vs-Preview banner from
  `isSupabaseConfigured`. `PortalShell` Admin nav is gated by `manage:roles`.

- **Login page** - `src/app/portal/page.tsx`: `mode==="supabase" ? <RealSignIn>`
  (Google + magic-link) `: <MockSignIn>` (portal chooser + one-click demo accounts
  + free-email box).

### 5.2 PWA (LIVE) + Push notifications (BUILT, DORMANT)
Full setup guide: `docs/pwa-push-setup.md`.

**`src/app/manifest.ts`** - note the `force-static` line is mandatory (§4):
```ts
import type { MetadataRoute } from "next";

// Required for `output: "export"` - emit a static /manifest.webmanifest.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alpha Kappa Psi - Omicron Tau",
    short_name: "AKΨ - Rutgers",   // Android home-screen label
    description:
      "The members app for Alpha Kappa Psi, Omicron Tau at Rutgers University - events, directory, documents, and announcements.",
    id: "/", start_url: "/", scope: "/",
    display: "standalone", orientation: "portrait",
    background_color: "#1a2744", theme_color: "#1a2744",
    categories: ["education", "social", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

**`src/app/layout.tsx`** - fonts + PWA metadata (`themeColor` lives on the
separate `viewport` export in Next 16; Next emits `mobile-web-app-capable`):
```tsx
import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Bodoni_Moda, Instrument_Serif } from "next/font/google";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"], display: "swap" });
const bodoni = Bodoni_Moda({ variable: "--font-display", subsets: ["latin"], weight: ["600","700","800","900"], display: "swap" });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal","italic"], display: "swap" });

export const metadata: Metadata = {
  /* …title/desc/openGraph/twitter unchanged… */
  icons: { icon: "/favicon.ico", apple: "/apple-icon.png" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AKΨ - Rutgers" },  // iOS home-screen label
};
export const viewport: Viewport = { themeColor: "#1a2744" };

// <html className={`${hanken.variable} ${bodoni.variable} ${instrument.variable} h-full`}>
//   <body …><AuthProvider>{children}</AuthProvider><ServiceWorkerRegister /></body>
```
`globals.css` (inside `@theme inline`): `--font-sans: var(--font-hanken), "Helvetica Neue", Arial, sans-serif;`
and `body { font-family: var(--font-sans); }`.

**`public/sw.js`** - offline shell + push. Bump `CACHE_VERSION` when `PRECACHE`
changes. Navigations are network-first → cache → `/offline/`; static assets are
cache-first. Cross-origin (Supabase/Google/Instagram) is passed straight through.
```js
const CACHE_VERSION = "akpsi-v1";
const PRECACHE = ["/", "/offline/", "/manifest.webmanifest",
                  "/icon-192.png", "/icon-512.png", "/akpsi-logo.png"];
// install → cache.addAll(PRECACHE) + skipWaiting()
// activate → delete stale caches + clients.claim()
// fetch → GET + same-origin only; navigate: network-first, fallback cache, then "/offline/";
//         else cache-first, then network (cache res.ok && res.type === "basic")
self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = { title: "AKΨ Omicron Tau", body: event.data ? event.data.text() : "" }; }
  const options = {
    body: payload.body || "", icon: payload.icon || "/icon-192.png",
    badge: "/icon-192.png", vibrate: [100,50,100], tag: payload.tag || "akpsi",
    data: { url: payload.url || "/portal/" },
  };
  event.waitUntil(self.registration.showNotification(payload.title || "AKΨ Omicron Tau", options));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/portal/";
  event.waitUntil(self.clients.matchAll({ type:"window", includeUncontrolled:true }).then((list) => {
    for (const c of list) { if ("focus" in c) { c.navigate(target); return c.focus(); } }
    return self.clients.openWindow(target);
  }));
});
```

**`src/lib/push.ts`** - client push. `isPushConfigured` is the dormancy gate.
Note `urlBase64ToUint8Array` must allocate over an explicit `ArrayBuffer` or
`tsc` rejects `applicationServerKey`.
```ts
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
export const isPushConfigured = Boolean(VAPID_PUBLIC_KEY) && isSupabaseConfigured;

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator &&
    "PushManager" in window && "Notification" in window;
}
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(new ArrayBuffer(raw.length)); // explicit ArrayBuffer: TS
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
// getExistingSubscription(): reg.pushManager.getSubscription()
// subscribeToPush(memberEmail): Notification.requestPermission() → pushManager.subscribe
//   ({userVisibleOnly:true, applicationServerKey}) → supabase.from("push_subscriptions")
//   .upsert({endpoint,p256dh,auth,member_email}, {onConflict:"endpoint"})
// unsubscribeFromPush(): sub.unsubscribe() + delete row by endpoint
export async function sendPushToChapter(payload:{title:string;body:string;url?:string}): Promise<boolean> {
  if (!isPushConfigured) return false;              // dormant no-op
  const supabase = getSupabase(); if (!supabase) return false;
  const { error } = await supabase.functions.invoke("send-push", { body: payload });
  if (error) { console.error("send-push failed:", error.message); return false; }
  return true;
}
```

**`supabase/functions/send-push/index.ts`** (Deno) - the ONLY server-side piece.
Verifies the caller is `president`/`admin` against `members`, fans out with
`web-push`, prunes 404/410 endpoints. Secrets: `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
are injected). **Private key never leaves Supabase.**

**UI:** `ServiceWorkerRegister.tsx` (registers `/sw.js` on `load`, scope `/`,
`updateViaCache:"none"`, no UI) mounted in `layout.tsx`;
`InstallPrompt.tsx` (dismissible via `localStorage["akpsi.pwa.install-dismissed"]`,
hidden when `display-mode: standalone` or `navigator.standalone`; Android uses
`beforeinstallprompt`, iOS shows Share → Add to Home Screen) and
`NotificationsToggle.tsx` (renders "Not available yet…" while `!isPushConfigured`)
both live on `/portal/dashboard`.
Publishing an announcement calls `sendPushToChapter(...)` (no-op while dormant).

### 5.3 Branding: logo, icons, fonts
- **`src/components/ui/Logo.tsx`** renders `/akpsi-logo.png` at `h-9 w-9` (square)
  plus the serif wordmark and gold "OMICRON TAU | RUTGERS UNIVERSITY" subtitle.
  One component drives **navbar, footer, portal login, and portal shell**.
  The old Rutgers block-R (`public/rutgers-r.svg`) was deleted.
- `public/akpsi-logo.png` is a 376×376 center-cropped square of the badge; the
  PWA icon set is derived from it (§4).

### 5.4 Home page composition (current, exact)
```tsx
// src/app/page.tsx
<Navbar />
<main className="flex-1">
  <Hero />            {/* no eyebrow pill above the headline - removed */}
  <AboutSection />    {/* "We Are A Lifelong Family" - chapter photo backdrop */}
  <PresidentLetter /> {/* real photo; caption is just "President" */}
  <Testimonials />    {/* "More Than a Résumé Line" - real brother names */}
  <CTASection />
</main>
<Footer />
```
- **Removed and deleted:** `TrustedBy` ("Our brothers land at the leading firms")
  and `CraftExperiences` ("Craft an experience you'll carry for life"). Both
  component files are gone - re-adding means rewriting them.
- **`AboutSection`** ("Who We Are" / "We Are A Lifelong Family") is backed by the
  chapter group photo at `public/chapter-group.jpg` (2000×1065), rendered as a
  `next/image` `fill` `object-cover` backdrop. Legibility comes from THREE
  stacked scrims, all white, in this order: a flat `bg-white/55` wash, a vertical
  gradient that reaches full white only at the very top and bottom edges (so the
  section resolves cleanly against its neighbours), and a radial pool of white
  behind the headline and body copy. The foreground stays dark-on-light (navy
  headline, `text-ink/80` body); the stat cards are `bg-white/85` +
  `backdrop-blur-md` so they hold up over the picture, and `GoldParticles` keeps
  its light-background tuning (`color="196,150,58"`, `intensity={2.4}`).
  ⚠️ The scrim opacities are tuned by eye against real screenshots at both
  desktop and mobile. A first pass at ~82% hid the photo completely; if you
  change the wash, re-check the picture is still visible AND the copy still
  reads, at BOTH breakpoints.
- **`PresidentLetter`** uses a `Portrait()` component: `next/image` `fill` +
  `object-cover object-top` inside an `aspect-[4/5]` rounded frame, pointing at
  `/members/abhinav-gunda.jpg`, with the gold radial corner accent retained.
- **`Testimonials`** - 5 entries, real brothers, no invented majors:
  Rayyan Ahmed / Justin Arnoldi / John Baylock / Anika Batki (all "Active Brother")
  and Ashna Narielwala ("VP of Alumni Relations · Class of ’28").

### 5.5 Members directory (`src/components/members/MembersDirectory.tsx`)
Three tabs, "Members" first and default; the "All" tab and the "N members" count
were both removed.
```ts
type Tab = MemberGroup;
const TABS: Tab[] = ["actives", "board", "alumni"];
const TAB_LABELS: Record<Tab, string> = { ...GROUP_LABELS, actives: "Members" };
// ^ overrides ONLY the tab label; GROUP_LABELS.actives stays "Actives" for other consumers.

const [tab, setTab] = useState<Tab>("actives");
const inTab = (m: Member) => {
  // Board members are active brothers too - include them under Members.
  if (tab === "actives") return m.group === "actives" || m.group === "board";
  return m.group === tab;
};
// Sort: board first (roster order = President → EVP → VPs), then A-Z or class year.
// The "Members" tab renders cohort sections in COHORT_ORDER
// ["Alpha Founding","Beta Founding","Alpha Tau"]; other tabs render a flat grid.
```

### 5.6 Portal ↔ Google Calendar  (`/portal/events`, `src/data/calendar.ts`)
Read-only. `GOOGLE_CALENDAR_ID` =
`c_c1a79396869cbf6257effd4bf694505c102690ef92a6ebd7617e24ebf2ebb0b8@group.calendar.google.com`
(the `?cid=` base64 in a Google share link decodes to exactly this).
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
Events page has a 4th toggle (Month/Week/List/**Google**) → `<GoogleCalendarPanel>`
iframe, plus a real `<a href={addToGoogleCalendarUrl(event)}>` per event.
⚠️ Needs the calendar shared PUBLIC (§4).

### 5.7 Media page + Instagram (`/media`)
`InstagramEmbed.tsx` parses a permalink/shortcode →
`https://www.instagram.com/{p|reel|tv}/{code}/embed/captioned` iframe (no key, no
script). `media/page.tsx` maps `INSTAGRAM_POSTS: string[]` (4 real permalinks)
into a grid, plus a `RUSH_VIDEO` slot (mp4 or iframeSrc; placeholder until set).

### 5.8 Social + privacy
- `src/data/social.ts` - single source: `SOCIAL.instagram =
  "https://www.instagram.com/rutgers.akpsi/"`, `SOCIAL.linkedin =
  "https://www.linkedin.com/company/rutgers-alphakappapsi"`; `hasSocialUrl()`.
  Used by `Navbar`, `Footer`, Media page (`target=_blank rel=noopener noreferrer`).
- **Privacy:** `src/app/members/[slug]/page.tsx` renders only
  name/position/photo/bio/academics - **no email, no LinkedIn**. The public data
  model has no `email` field at all.

### 5.9 Admin document archive
`Archive` module in `admin/page.tsx`: `ARCHIVED_FILES` mock, search/filter,
`overflow-x-auto` `min-w-[760px]` table (mobile-safe), restore/delete (UI-only).

### 5.10 About page (`src/app/about/page.tsx`)
Composition, in order: navy hero → "Our Story" + "National AKΨ" card →
`<LogoMarquee />` → `<Benefits />` → CTA.
- **The navy stats bar (60+ / 200+ / 10+ / 10+) was REMOVED**, along with its
  `STATS` array and the `CountUp` / `cardIn` imports. Do not re-add it. The
  "60+ active members … 200+" figures still appear as prose inside "Our Story",
  which is deliberate: that is body copy, not the stat section.
- **`LogoMarquee`** ("Our Network") sits on the **brand blue** (`bg-blue`,
  `#5b8ec6`) with **solid white** wordmarks and a light-tone `SectionHeader`.
  It was deliberately compressed from ~550px to ~340px tall: `py-12 sm:py-14`,
  `mt-7` header gap, `py-2` rows, `gap-12`, `text-base sm:text-lg` wordmarks.
  Keep it short if you touch it.
  ⚠️ **Known contrast shortfall:** white on `#5b8ec6` measures **3.43:1**. That
  passes AA for the large heading but is under the 4.5:1 needed for the 18px
  wordmarks and 12px caption. Solid white is the best available on this blue
  (navy would be 4.32:1, also short). Fixing it properly means a deeper blue
  for the band; `#3a6ca8` measures 5.4:1 and still reads as blue.
- **`Benefits`** renders 4 pillars, each with a REAL chapter photo (§5.12). The
  old `PlaceholderImage` (navy gradient + "Chapter photo" label) is gone,
  replaced by `PillarImage`: `next/image` `fill` `object-cover` with the pillar
  title plated over a `from-navy/90 via-navy/45 to-transparent` bottom scrim, so
  the label never sits on bare photo. Alt text describes the SCENE, not the
  pillar.

### 5.11 Portal shell on mobile (`src/components/portal/PortalShell.tsx`)
The portal was unusable on a phone; all three of these are load-bearing.
- **Header used to overflow its container by ~104px.** The `Logo` lockup is
  `whitespace-nowrap` and measures 287px, so it cannot shrink; with the 172px
  icon cluster it blew past a 375px viewport and pushed the avatar and sign-out
  off-screen. Fixes: `Logo` gained an optional **`wordmarkClassName`** prop and
  the portal passes `"hidden sm:flex"` to drop the wordmark below `sm`; the
  sign-out label collapses to its icon (`<span className="hidden sm:inline">`);
  name/email and the role chip move to `lg:block`; gaps tighten to `gap-2`.
  Header overflow now measures 0.
- **There was NO mobile navigation at all.** The sidebar is `hidden lg:block`,
  so Events / Directory / Documents / Announcements / Applications / Admin were
  unreachable on a phone. A sticky horizontally scrollable pill strip now sits
  under the header (`sticky top-16 z-30 … lg:hidden`, scrollbar hidden via
  `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`). Verified all 7 items
  render for an admin and the strip scrolls (871px of content in 375px).
- **No nav item ever highlighted, mobile OR desktop.** `trailingSlash: true`
  makes `usePathname()` return `/portal/events/` while the `NAV` hrefs omit the
  slash, so `pathname === href` never matched. Both navs now use:
```ts
const currentPath = pathname.replace(/\/+$/, "");
const isActive = (href: string) => currentPath === href.replace(/\/+$/, "");
```
- **Dashboard event rows** were truncating titles ("Resume Workshop with Alu…").
  The row is now `flex flex-wrap` with the content column on `basis-48`, so the
  RSVP button wraps to its own full-width line on a phone; `truncate` removed
  from the `<h3>`. All 5 seeded titles render in full.

### 5.12 Chapter photography (`public/chapter/`)
Six real chapter photos, resized to ≤1600px wide (2000px for the rush hero) and
re-encoded q82 progressive - `output:"export"` disables Next's image
optimisation, so anything dropped in `public/` ships at whatever size it is.
Total 1.4MB across six files.

| File | Used by |
|---|---|
| `stairs-candid.jpg` (2000px) | RushHero backdrop |
| `lecture-hall.jpg` | Media page hero backdrop |
| `hoodies.jpg` | Benefits → Community |
| `suits-seated.jpg` | Benefits → Leadership |
| `stairs-formal.jpg` | Benefits → Network |
| `auditorium.jpg` | Benefits → Development |

Plus `public/chapter-group.jpg` (2000×1065), the AboutSection backdrop (§5.4).

**RushHero backdrop, exact:** `next/image` `fill` + `priority`, behind
`bg-navy/50` and a centre-light vignette
`radial-gradient(120%_100%_at_50%_35%, rgba(45,62,95,0.30) 0%, rgba(26,39,68,0.62) 55%, rgba(19,29,51,0.88) 100%)`.
The copy block carries `[text-shadow:0_2px_12px_rgba(10,16,30,0.55)]` so the
gold eyebrow survives the bright staircase behind it.
⚠️ **Positioning it needs `scale`, not `object-position`.** At a 1440×900 hero
the container aspect (1.6) is wider than the photo (1.5), so `object-cover`
scales by width and horizontal overflow is exactly **0** - there is no slack to
pan into sideways, and only 60px vertically. Current fix:
`scale-[1.15] translate-x-[4%] translate-y-[3.5%]`. The 1.15 zoom buys 7.5% of
slack per side, so both translates stay inside it and the photo still fully
covers the section (verified at 1440×900 and at mobile, where the aspect
mismatch is far larger).

---

## 6. Build order / current status

**Done ✅**
1. Supabase roles + login allowlist (client + RLS + signup trigger + mock enforcement).
2. Privacy: no email/LinkedIn on public profiles.
3. Header/footer social icons wired to real URLs.
4. Media page + 4 Instagram embeds.
5. President = **Abhinav Gunda**, with real headshot on the directory card and
   the president letter; caption is just "President".
6. Removed lowercase-blue `SectionHeader` subtitles site-wide.
7. Portal ↔ Google Calendar (embed view + per-event add links).
8. Branding: AKPsi badge replaces the Rutgers R everywhere.
9. Em dashes eliminated site-wide (convention, §4).
10. Members directory: "All" tab and member count removed; "Members" tab first.
11. Homepage trimmed: `TrustedBy` + `CraftExperiences` sections and the hero
    eyebrow pill removed; testimonials use real brothers.
12. Body font → **Hanken Grotesk**.
13. **PWA live**: manifest, icon set, service worker, offline page, install prompt.
14. **Push built but dormant**: `push.ts`, toggle UI, `push_subscriptions.sql`,
    `send-push` Edge Function, announcement trigger, `docs/pwa-push-setup.md`.
15. Deleted dead files: `TrustedBy.tsx`, `CraftExperiences.tsx`, `rutgers-r.svg`.
16. About page: navy stats bar (60+/200+/10+/10+) removed; "Our Network" marquee
    compressed to ~340px and moved onto the brand blue with white wordmarks;
    home `AboutSection` backed by the chapter group photo behind a white scrim
    (§5.4, §5.10). Commit `23b207b`.

17. **Portal made usable on mobile** (§5.11): header overflow fixed, mobile nav
    strip added, `trailingSlash` active-state bug fixed, dashboard event rows
    wrap instead of truncating. Commit `3bb8aee`.
18. **PWA home-screen label = `AKΨ - Rutgers`** (`manifest.short_name` +
    `appleWebApp.title`). Same commit.
19. **`AKΨ` → `AKPsi` in all on-page copy** (§4 greek-subset constraint). Same commit.
20. **Recruiting cycle is Fall '26**, not Spring '27 - all 10 user-facing refs
    updated (hero + CTA buttons, rush metadata + hero, rush form heading, About
    recruitment line, media page, seeded rush event, portal announcement and
    document names). `ARCHIVED_FILES`' "Spring 2026 Rush Applications.csv" is
    deliberately untouched: a genuinely past semester. Commit `d2c56c8`.
21. **"the second founding" removed** from the president letter's closing line;
    it now reads "As the President of Alpha Kappa Psi Omicron Tau, …". Same commit.
22. **Six real chapter photos placed** (§5.12) across RushHero, the Media hero,
    and all four Benefits pillars. Commits `37bb94d`, `11d7a16`.

**Pending ⏳ (in the codebase)**
23. **`SectionHeader` reveal never fires** - every section title on the site is
    invisible. Root cause + fix sketched in §4 "Open bug". Touches every page,
    so it needs a deliberate go-ahead.
24. **"Our Network" blue fails contrast** at 3.43:1 for its small text (§5.10).
    One-line fix is a deeper blue for the band.
25. **Home section transitions still read blocky** - the original complaint that
    prompted two reverted experiments (§4). Untried ideas listed there.

**Pending ⏳ (require action outside the codebase)**
26. **Make the Google Calendar PUBLIC** (Google Calendar settings) so the portal
    embed shows events instead of the sign-in wall.
27. **Rush video** - drop an mp4/YouTube URL into `RUSH_VIDEO` on the Media page.
28. **Supabase go-live** (`docs/supabase-setup.md`) + seed the real roster. Until
    then the whole portal runs in mock mode.
29. **Activate push** (needs #28 first), per `docs/pwa-push-setup.md`:
    run `db/push-subscriptions.sql` → `web-push generate-vapid-keys` → set
    `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + redeploy → `supabase functions deploy
    send-push` + `supabase secrets set VAPID_*`.
30. Optional: real majors for the testimonial brothers; photos for the other ~59
    members (drop files in `public/members/` and set `photo` in `members.ts`).

---

## 7. Verify / build

- `npx tsc --noEmit --incremental false` - must be clean.
- `npx eslint <changed files>` - clean (a few pre-existing warnings don't block).
- `npm run build` - static export (~40 routes + ~60 member pages). Must emit
  `out/manifest.webmanifest`, `out/sw.js`, `out/icon-192.png`, `out/icon-512.png`,
  `out/apple-icon.png`, `out/offline/index.html`.
- Serve the export and test there (NOT the dev server, §4 font staleness):
  ```bash
  npm run build && python3 -m http.server 3002 --directory out
  ```
  Then check: `/` and `/media` render; navbar/footer show the AKPsi badge;
  `--font-sans` computes to `"Hanken Grotesk", …` on `<body>`; no member
  email/LinkedIn anywhere public; a non-roster email is REJECTED at sign-in;
  service worker registers (`navigator.serviceWorker.getRegistrations()`);
  manifest fetches with `display:"standalone"` and 3 icons.
- **Cannot be verified from a sandbox / plain localhost:** real Supabase login,
  push delivery end-to-end, iOS home-screen install behavior, and the Google
  Calendar showing events (needs the calendar made public). Say so rather than
  claiming these work.

---

## File map (key files)

| File | Role |
|---|---|
| `src/lib/supabase.ts` / `roles.ts` / `access.ts` | Auth client, roster data-access + roles, permissions |
| `src/context/AuthContext.tsx` | Auth provider (Supabase + mock, allowlist-enforcing) |
| `src/app/layout.tsx` | Fonts, SEO metadata, PWA manifest/appleWebApp, `viewport.themeColor`, SW mount |
| `src/app/manifest.ts` | PWA manifest (**needs `dynamic = "force-static"`**) |
| `public/sw.js` | Service worker: offline cache + push handlers |
| `src/lib/push.ts` | Client push subscribe/unsubscribe + `sendPushToChapter()` |
| `src/components/pwa/*` | `ServiceWorkerRegister`, `InstallPrompt`, `NotificationsToggle` |
| `supabase/functions/send-push/index.ts` | Manager-only push fan-out (Deno; excluded from tsconfig) |
| `db/supabase-roles.sql` / `push-subscriptions.sql` | Runnable schema + RLS + allowlist trigger |
| `src/app/page.tsx` | Home composition (Hero→About→President→Testimonials→CTA) |
| `src/components/home/PresidentLetter.tsx` / `Testimonials.tsx` | President portrait + real-name testimonials |
| `src/components/sections/AboutSection.tsx` | "We Are A Lifelong Family" + chapter photo backdrop / white scrims (§5.4) |
| `src/app/about/page.tsx` | About page; stats bar removed (§5.10) |
| `src/components/about/LogoMarquee.tsx` | "Our Network" blue marquee, height-constrained (§5.10) |
| `public/chapter-group.jpg` | Chapter group photo, 2000×1065; backdrop for `AboutSection` |
| `public/chapter/*.jpg` | Six chapter photos (§5.12) - rush hero, media hero, 4 Benefits pillars |
| `src/components/about/Benefits.tsx` | 4 pillars with real photos via `PillarImage` (§5.10) |
| `src/components/rush/RushHero.tsx` | "Join the Omicron Tau Chapter" + photo backdrop, scrim, scale/translate (§5.12) |
| `src/app/portal/dashboard/page.tsx` | Dashboard; event rows wrap on mobile (§5.11) |
| `src/components/members/MembersDirectory.tsx` | 3-tab directory ("Members" first, no count) |
| `src/data/members.ts` | Public roster (president = Abhinav Gunda, has `photo`) |
| `src/app/members/[slug]/page.tsx` | Public profile (no contact info) |
| `src/components/ui/Logo.tsx` | AKPsi badge lockup; `wordmarkClassName` drops the wordmark on tight bars (§5.11) |
| `src/app/portal/admin/page.tsx` | Admin center incl. `RolesPanel` + Archive |
| `src/components/portal/PortalShell.tsx` | Portal chrome; mobile nav strip + normalised active state (§5.11); Admin nav gated by `manage:roles` |
| `src/app/portal/events/page.tsx` + `src/data/calendar.ts` | Calendar embed + add-to-gcal links |
| `src/app/media/page.tsx` + `src/components/media/InstagramEmbed.tsx` | Media page (photo hero, §5.12) + IG embeds |
| `src/data/social.ts` | Social URLs |
| `src/app/offline/page.tsx` | PWA offline fallback |
| `docs/supabase-setup.md` / `docs/pwa-push-setup.md` | Setup runbooks |

---

## Git state

Remote `github.com/msp276-bot/akpsi-site`, branch `main`, **working tree clean
and fully pushed** (`main` == `origin/main`).

Recent history (newest first):
```
11d7a16  Reposition the rush hero photo down and to the right
37bb94d  Add real chapter photos across the site
d2c56c8  Recruit for Fall '26; drop "second founding" from the president letter
20a0712  Revert "Make the home page a deck of full-height snap panels"
15727d0  Make the home page a deck of full-height snap panels      <- reverted, see §4
3bb8aee  Fix portal mobile layout; set app name; stop psi glyph falling back
a1d2834  Refresh PROJECT_STATE spec; finish em dash sweep
23b207b  Drop About stats bar, shrink network marquee, add chapter photo backdrop
4f67fa7  Switch body font to Hanken Grotesk; remove unused files
```
Neither reverted experiment (the homepage glass redesign, `SectionFade`, or the
snap panels) survives in the tree. **Commit only when asked.**

---

## Deployment (IMPORTANT)

**There is NO CI/CD.** No `.github/workflows`, no `vercel.json`, no `.vercel`,
no `netlify.toml`. Pushing to GitHub updates the repo and **nothing else** -
`rutgersakpsi.com` does not change.

Per `README.md`, hosting is manual: build, then upload `out/` to S3 behind
CloudFront. Wiring up GitHub Actions or AWS Amplify is an explicit open task,
not something already in place. Do not tell the user a push has deployed.

```bash
npm run build   # emits out/
# then sync out/ to the S3 bucket and invalidate CloudFront
```
