# Connecting the shared backend (Supabase)

The portal works in two modes:

- **Mock mode** (default, nothing to set up): demo accounts, everything lives in
  the browser. Great for previewing.
- **Live mode**: real logins and a shared roster. Only emails the president adds
  can sign in, and only the president/admin can change roles — enforced on the
  server, so it's actually secure.

This guide switches the site to **Live mode**. Budget ~20–30 minutes. You only
do it once.

---

## What you'll end up with

- A free Supabase project (the database + login system).
- A `members` roster table that doubles as the **allowlist**: on it = can log in,
  off it = turned away.
- Two login options for members: **Continue with Google** and **magic link
  email**.
- A president who manages everyone else directly from **Portal → Admin → Roles &
  access**.

---

## Step 1 — Create the Supabase project

1. Go to <https://supabase.com>, sign in, and click **New project**.
2. Name it (e.g. `akpsi-omicron-tau`), set a database password (save it
   somewhere), pick a region near NJ (e.g. `us-east-1`), and create it.
3. Wait ~2 minutes for it to finish provisioning.

## Step 2 — Create the roster table + security rules

1. In the project, open **SQL Editor → New query**.
2. Open [`db/supabase-roles.sql`](../db/supabase-roles.sql) from this repo.
3. **Before running**, scroll to the bottom (`Step 5 — Seed`) and replace the
   two example emails with your real **president** and **tech-admin** emails.
   You need at least one of these so someone can log in first.
4. Paste the whole file into the SQL editor and click **Run**. You should see
   "Success".

> This creates the `members` table, turns on Row-Level Security (president/admin
> write only), and installs the trigger that blocks non-roster emails from
> signing in.

## Step 3 — Turn on the login methods

In **Authentication → Sign In / Providers**:

### Magic link (email) — easiest, on by default
1. Make sure **Email** is enabled.
2. That's it — members can request a login link with their @rutgers.edu email.

### Google sign-in — nicer, a bit more setup
1. In **Google Cloud Console** (<https://console.cloud.google.com>): create (or
   pick) a project → **APIs & Services → Credentials → Create Credentials →
   OAuth client ID → Web application**.
2. Under **Authorized redirect URIs**, add the callback URL Supabase shows on
   its Google provider page. It looks like:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Copy the generated **Client ID** and **Client secret**.
4. Back in Supabase → **Authentication → Providers → Google**: enable it, paste
   the Client ID and secret, and save.

> The app already asks Google to prefer `@rutgers.edu` accounts, but the real
> guarantee is the roster allowlist from Step 2 — even a valid Google account
> can't get in unless the president added the email.

## Step 4 — Set the site URLs

In **Authentication → URL Configuration**:

- **Site URL**: your live site (e.g. `https://akpsiomicrontau.com`). For local
  testing use `http://localhost:3000`.
- **Redirect URLs**: add both your live URL and `http://localhost:3000/portal/`
  (and your production `/portal/`) so login links return to the right place.

## Step 5 — Give the app its keys

1. In Supabase → **Project Settings → API**, copy:
   - **Project URL**
   - **anon public** key
2. In the repo, copy `.env.local.example` to `.env.local` and fill them in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon public key>
   ```

3. Add the same two variables to your hosting provider's environment settings
   (wherever the site is deployed), then redeploy.

   > Both keys are safe to expose in the browser — the anon key can only do what
   > Row-Level Security allows. **Never** add the `service_role` key here.

## Step 6 — First login + hand off to the president

1. Restart the dev server (or redeploy). The login page now shows **Continue
   with Google** + the magic-link box instead of the demo accounts.
2. Sign in with the **president** email you seeded in Step 2.
3. Go to **Portal → Admin → Roles & access** and add every member: name,
   @rutgers.edu email, and role. Each person you add can now log in; anyone you
   don't add is turned away.

That's the whole thing. From then on, roles are managed entirely from the
website by the president.

---

## Roles at a glance

| Role        | Can do                                                        |
|-------------|---------------------------------------------------------------|
| `pledge`    | Pledge calendar, resources, announcements                     |
| `active`    | Events, directory, documents, announcements                   |
| `board`     | Everything above + applications, publishing, e-board content  |
| `president` | Everything the board can do **+ manage the roster/roles**     |
| `admin`     | Full admin command center (tech committee)                    |

Only `president` and `admin` can open **Roles & access** and change who has
access.

## Troubleshooting

- **"This email is not on the chapter roster."** Working as intended — the email
  isn't in `members`. Add it from Roles & access (as president/admin) or via SQL.
- **Locked out with no president?** Add one directly in Supabase: **Table Editor
  → members → Insert row** (or re-run the seed in Step 2 with the right email).
- **Login link goes to the wrong place.** Re-check the Redirect URLs in Step 4.
- **Still seeing demo accounts?** The env vars aren't loaded — confirm
  `.env.local` exists and restart the dev server / redeploy.
