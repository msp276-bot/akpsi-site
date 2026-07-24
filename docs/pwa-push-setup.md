# PWA + Push Notifications

The site is an installable **Progressive Web App**. Brothers can add it to their
home screen and get a full-screen, app-like experience that also works offline.
Push notifications are **built but dormant** — they turn on once the Supabase
backend is live and VAPID keys are set.

---

## What already works (no setup needed)

- **Installable app** — manifest at `/manifest.webmanifest` (`src/app/manifest.ts`),
  AKΨ icons (`public/icon-*.png`, `public/apple-icon.png`), navy theme color.
- **Offline shell** — `public/sw.js` caches visited pages + the app shell and
  serves `/offline/` when there's no connection. Registered by
  `src/components/pwa/ServiceWorkerRegister.tsx` (mounted in `layout.tsx`).
- **Install prompt** — `src/components/pwa/InstallPrompt.tsx` on the portal
  dashboard (Android install button / iOS "Add to Home Screen" hint).

> Note: install + offline require **HTTPS** (production). On iOS, push only works
> _after_ the app is added to the Home Screen and opened from there (iOS 16.4+).

---

## Turning on push notifications

Prerequisite: the Supabase project from `docs/supabase-setup.md` is live
(`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` set) and
`db/supabase-roles.sql` has been run.

### 1. Create the subscriptions table
Paste `db/push-subscriptions.sql` into the Supabase SQL editor and run it.
(Creates `public.push_subscriptions` + RLS; depends on the `members` table.)

### 2. Generate VAPID keys
```bash
npm install -g web-push
web-push generate-vapid-keys
```
This prints a **public** and **private** key.

### 3. Add the public key to the site
In the hosting env (and `.env.local` for dev):
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
```
Rebuild/redeploy. The dashboard "Push notifications" toggle now activates
(`isPushConfigured` = VAPID public key **and** Supabase both present).

### 4. Deploy the send-push Edge Function
```bash
supabase functions deploy send-push
supabase secrets set \
  VAPID_PUBLIC_KEY=<public key> \
  VAPID_PRIVATE_KEY=<private key> \
  VAPID_SUBJECT=mailto:president@rutgers.edu
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.
The private key lives **only** in Supabase secrets — never in the app bundle.

### 5. Done
- A brother opens the portal → toggles **Push notifications** on → the browser
  subscribes and the row lands in `push_subscriptions`.
- When the president/an admin **publishes an announcement**
  (`/portal/announcements`), the app calls `sendPushToChapter()`
  (`src/lib/push.ts`), which invokes `send-push`. The function verifies the
  caller is a roster manager, fans the push out to every subscription, and
  prunes any that have expired.

---

## How the pieces fit

| Piece | File | Role |
|---|---|---|
| Manifest | `src/app/manifest.ts` | App name, icons, colors, `display: standalone` |
| Service worker | `public/sw.js` | Offline cache + `push` / `notificationclick` handlers |
| SW registration | `src/components/pwa/ServiceWorkerRegister.tsx` | Registers `/sw.js` at app root |
| Install prompt | `src/components/pwa/InstallPrompt.tsx` | Add-to-home-screen UX |
| Notifications toggle | `src/components/pwa/NotificationsToggle.tsx` | Opt in/out on the dashboard |
| Client push lib | `src/lib/push.ts` | Subscribe/unsubscribe + `sendPushToChapter()` |
| Subscriptions table | `db/push-subscriptions.sql` | Stores subscriptions (RLS: self-manage) |
| Sender | `supabase/functions/send-push/index.ts` | Manager-only fan-out via web-push |

**Dormant-safe:** with no VAPID key, the toggle shows "not available yet", and
`sendPushToChapter()` is a no-op — so everything above ships without breaking the
static build or the mock-mode preview.
