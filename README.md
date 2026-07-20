# Alpha Kappa Psi — Omicron Tau Chapter (Rutgers University)

Marketing site + member portal for the Omicron Tau chapter of Alpha Kappa Psi.
Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**,
**Framer Motion**, and **Lucide** icons.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static production build in out/
```

## Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Home — cinematic video hero ("Shaping People, Shaping Business."), stats, members, CTA | Public |
| `/about` | Chapter story, national AKΨ, stats bar, "Our Network" logo marquee, Benefits zigzag | Public |
| `/members` | Full directory — tabs, search, sort; cards link to profiles | Public |
| `/members/[slug]` | Individual member profile (bio, LinkedIn, click-to-reveal email) | Public |
| `/rush` | Recruitment — hero, timeline, values, FAQ, **application form** | Public |
| `/portal` | Sign-in (mock Google OAuth, `@rutgers.edu` gated) | Public |
| `/portal/dashboard` | Member home — upcoming events, RSVPs, quick links | Protected |
| `/portal/events` | Events calendar (month/list, filters, slide-out detail, RSVP) | Protected |
| `/portal/directory` | Searchable/filterable member directory + profile modal | Protected |
| `/portal/documents` | Folder/file browser (upload is board-only) | Protected |
| `/portal/announcements` | Board announcement feed (pin, like, comment) | Protected |
| `/portal/applications` | Mock rush application review pipeline | E-Board/Admin |
| `/portal/admin` | Backend-ready admin module map | Admin |

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
- **Backend architecture** — see `docs/backend-architecture.md` and
  `db/schema.sql` for the PostgreSQL schema, API contract, RBAC model, audit
  logging, application pipeline, and notification plan.

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

`src/components/rush/RushForm.tsx` is currently a front-end demo flow because
the site is prepared for static S3/CloudFront hosting. It validates the form in
the browser, shows a polished success state, and fires lightweight canvas
confetti (`src/lib/confetti.ts`).

To collect real applications on AWS, connect the form to a backend such as API
Gateway + Lambda + DynamoDB/S3, or use a hosted form service. S3 static hosting
cannot run a Next.js API route by itself.

## Deployment notes

This repo is pushed to GitHub at:

<https://github.com/msp276-bot/akpsi-site>

When Codex updates the website, the change is not magically on GitHub until it
is committed and pushed. In practice, ask Codex to “push it,” and it will update
the GitHub `main` branch.

For cheap public hosting at `https://rutgersakpsi.com`, build the static site:

```bash
npm run build
```

Then upload the contents of `out/` to S3 and serve the bucket through
CloudFront. If you later add GitHub Actions or AWS Amplify, pushes to GitHub can
automatically redeploy the live site.

## Hero video quality

The front-page hero is ready to use a true 4K MP4. Set this build-time
environment variable to a 3840×2160 MP4 hosted on S3/CloudFront:

```bash
NEXT_PUBLIC_HERO_VIDEO_4K_URL=https://your-cloudfront-domain/path/hero-4k.mp4
```

If that variable is not set, the site falls back to the current CloudFront video
in `src/components/sections/Hero.tsx`. CSS can display the video fullscreen, but
true 4K quality requires the source video itself to be 4K.

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
