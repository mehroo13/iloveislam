# Supabase setup — optional accounts & cloud sync (Stage 7)

Cloud backup is **not configured yet**. Everything in Stage 7 is built and
shipped, but the account buttons in Settings → Account & backup stay
honestly disabled until the steps below are done. No credentials exist
anywhere in this repo and none were invented.

## What Mehran must do (~15 minutes, no card, no payment)

1. **Create a Supabase account** — supabase.com → "Start your project" →
   sign up with his email (or "Continue with GitHub" as `mehroo13`).
   Free. No card asked.
2. **Create a project** — Dashboard → "New project" → name `iloveislam` →
   set a **database password** (save it in his password manager; we never
   need it) → region **Sydney (ap-southeast-2)** → Create. Takes ~2 min.
   Region cannot be changed later.
3. **Copy two values** — Project Settings → API → **Project URL** and
   **anon / publishable key**. Send them to us through the secure form
   (never chat). The anon key is designed to be public in the browser
   build — Row Level Security limits every row to its own user — but it
   still travels only via the secure form.
4. **Confirm email sign-in is on** — Authentication → Providers → Email.
   It is on by default; a 30-second check.
5. **Run the database migration** (we do this once the keys exist, or he
   can) — Supabase Dashboard → SQL Editor → New query → paste the whole
   of `supabase/migrations/0001_auth_sync.sql` → Run. It creates
   `profiles`, `sync_docs`, `test_attempts`, `mistake_events`,
   `challenge_members`, Row Level Security policies, and the
   auto-create-profile trigger. Safe to re-run.

Nothing else. No billing, no card, no custom SMTP, no domain
verification. Google sign-in is deliberately deferred — it needs a
Google Cloud OAuth client and is not required; email magic-link +
password covers registration fully at launch.

## What we do once the keys arrive

1. Add to Vercel (project `iloveislam`, all environments):
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon / publishable key
   - `SUPABASE_SERVICE_ROLE_KEY` = the service-role key (Project
     Settings → API → service_role). **Server-only** — it is used only by
     `app/api/account/delete/route.ts` and must never be exposed to the
     browser. (Get it from the same API settings page; it is NOT the anon
     key and must not be pasted anywhere public.)
2. Run the migration in step 5 above if not already run.
3. Redeploy (pushing any commit to `main` auto-deploys) and verify live:
   - Guest flow unchanged: no account prompts anywhere, no Supabase
     network calls as guest.
   - Settings → Account & backup now offers Create account / Log in.
   - Register with a test email → confirm → local progress uploads
     (check `sync_docs` rows in Supabase → Table Editor).
   - Sign in on a second browser/device → progress merges in.
   - Sign out → local copy stays; Delete my account → rows gone.

## Free-tier limits to watch (tripwires)

- **500 MB database** (~5,000–10,000 registered users at ~50–100 KB
  each). Alert at 350 MB (70%). Levers before paying: tighten the
  test/mistake caps (100 / 500). Then Supabase Pro $25/mo flat → 8 GB.
- **50,000 monthly active users.** Pro raises it to 100k.
- **Free projects auto-pause after 1 week of inactivity.** Restore is
  one click in the dashboard, data intact. A daily-use Quran app will
  essentially never trigger it once live; Pro removes pausing.
- **Auth email rate limit on Free** (reported ~2 emails/hour for
  Supabase-sent mail — verify in the dashboard). If it binds, configure
  custom SMTP (free tiers of Resend/Brevo exist).
- **No automatic backups on Free.** Weekly manual export (Dashboard →
  Database → Backups, or `pg_dump`) saved to Drive until automated.

## Local development

Copy the values into a local `.env.local` (never commit it):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service-role key>   # server only
```

Without these, `isCloudConfigured()` is false and the app runs exactly
as a guest-only app — the account UI shows the honest "not set up yet"
state and every sync helper is a no-op.
