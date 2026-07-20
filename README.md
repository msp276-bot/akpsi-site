# Alpha Kappa Psi — Omicron Tau Chapter (Rutgers University)

Marketing site + member portal for the Omicron Tau chapter of Alpha Kappa Psi.
Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**,
**Framer Motion**, and **Lucide** icons.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Home — cinematic video hero ("Shaping People, Shaping Business."), stats, members, CTA | Public |
| `/about` | Chapter story, national AKΨ, stats bar, "Our Network" logo marquee, Benefits zigzag | Public |
| `/members` | Full directory — tabs, search, sort; cards link to profiles | Public |
| `/members/[slug]` | Individual member profile (bio, LinkedIn, click-to-reveal email) | Public |
| `/rush` | Recruitment — hero, timeline, values, FAQ, **application form** | Public |
| `/api/applications` | Mock application intake (validates `@rutgers.edu`, GPA range) | POST |
| `/portal` | Sign-in (mock Google OAuth, `@rutgers.edu` gated) | Public |
| `/portal/dashboard` | Member home — upcoming events, RSVPs, quick links | Protected |
| `/portal/events` | Events calendar (month/list, filters, slide-out detail, RSVP) | Protected |
| `/portal/directory` | Searchable/filterable member directory + profile modal | Protected |
| `/portal/documents` | Folder/file browser (upload is board-only) | Protected |
| `/portal/announcements` | Board announcement feed (pin, like, comment) | Protected |

SEO: per-page metadata, `robots.txt`, `sitemap.xml` (includes member profiles),
and a generated OG image (`src/app/opengraph-image.tsx`).

## Design system

Brand tokens live in `src/app/globals.css` under `@theme` (Tailwind v4):

- `navy #1a2744`, `navy-2 #2d3e5f`, `gold #d4a853`, `blue #5b8ec6`,
  `scarlet #cc0033` (Rutgers accent), plus `ink`/`muted`/`line`.
- Fonts (all via `next/font` in `src/app/layout.tsx`):
  **Inter** (sans/body), **Bodoni Moda** (`.headline` display serif — logo,
  section titles), **Instrument Serif** (`font-cinematic` — hero headline).
- Logo lockup (`src/components/ui/Logo.tsx`): scarlet R shield +
  "ALPHA KAPPA PSI" serif wordmark + gold chapter subtitle; the navbar carries
  a scarlet accent rule across the top edge.

All animations respect `prefers-reduced-motion`.

## Where to plug in real data

Everything below is mock and typed for a clean swap:

- **Members** — `src/data/members.ts` (`Member[]`). Add a `photo` URL per member
  to replace the scarlet initials fallback. Drives the home grid + directory.
- **Events** — `src/data/events.ts` (`ChapterEvent[]`). Powers the dashboard and
  calendar. The demo "today" is pinned in `src/lib/date.ts` (`DEMO_NOW`).
- **Documents / Announcements** — currently inline mock arrays in their page
  files; move to `src/data/` or a CMS when wiring a backend.

## Swapping in real authentication

Auth is mocked in `src/context/AuthContext.tsx`:

- `signInWithGoogle()` simulates the OAuth round-trip and enforces the
  `@rutgers.edu` domain (mirrors an OAuth hosted-domain `hd` restriction).
  Session persists in `localStorage`.
- To go live, replace the body of `signInWithGoogle` with a real provider
  (e.g. Auth.js / NextAuth Google provider, or Supabase Auth), keep the
  `@rutgers.edu` check as a `hd` param + server-side guard, and swap the
  `localStorage` hydration for the provider's session.
- The "Use a specific email (demo)" control on `/portal` exists only to exercise
  the domain validation — remove it once real OAuth is connected.
- Board-only affordances key off `user.role === "board"` (see `BOARD_EMAILS`).

## Rush application form

`src/components/rush/RushForm.tsx` posts to `/api/applications`
(`src/app/api/applications/route.ts`) — currently an in-memory mock with the
same validation a real backend would enforce. To go live, replace the store
with a DB insert (Supabase/Prisma) and upload the resume to object storage;
the route's doc comment spells out the intended schema. Success fires a
lightweight canvas confetti (`src/lib/confetti.ts`).

## Notable implementation notes

- The home hero is a fullscreen looping background video with liquid-glass
  CTAs (`src/components/sections/Hero.tsx`); a pause pill stops the video and
  `prefers-reduced-motion` starts it paused. A full WebGL Navier–Stokes fluid
  simulation also exists (`src/components/FluidCanvas.tsx` +
  `src/lib/fluidSimulation.ts`) and can be swapped back in as the hero
  background if the chapter prefers the interactive effect.

- Backgrounds (`src/components/backgrounds/`) are intentionally GPU-cheap: the
  hero "silk" uses soft-stop gradients (no `blur()` filters) and the gold
  particle canvas pauses when off-screen or the tab is hidden.
- Route protection is client-side (`PortalShell` redirects unauthenticated
  users to `/portal`). With real auth, add a server-side check in middleware.
