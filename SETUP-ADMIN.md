# Admin / CRM — setup guide

The full VLHomes admin (itself the second-generation SLPainting admin) now
lives in this repo, rebranded for MannyKnows. Modules: **Dashboard, Leads,
Quotes (+templates), Projects (+contracts & e-signature), Portfolios,
Contacts, Partners (white-label), Crew (+timeclock kiosk), Calendar,
Media Pool, Web (hero slides + wiki)** — plus the customer-facing pages the
machinery drives: `/quote/[token]`, `/project/[token]`, `/confirm/[token]`,
`/my-project`, and the partner/crew portals.

**The code ships dark.** With no bindings/secrets configured, deploys are
unaffected and `/admin` simply explains it isn't set up yet (503). Nothing on
the public site changes. That means this branch is safe to merge whenever —
the admin activates only as you complete the steps below.

Everything below is one-time, in order of what unlocks what.

## 1. Log-in credentials (5 minutes — unlocks the login)

```bash
npx wrangler secret put ADMIN_USERNAME     # e.g. manny
npx wrangler secret put ADMIN_PASSWORD     # long + random
npx wrangler secret put SESSION_SECRET     # run: openssl rand -base64 32
```

These env credentials are the bootstrap login. Once the database exists you
can create real users (with viewer/admin roles) in D1 `admin_users`, managed
at `/api/admin/users`.

## 2. The database (10 minutes — unlocks everything)

```bash
npx wrangler d1 create mannyknows-db
```

Copy the printed `database_id`, then in `wrangler.jsonc` uncomment the
`d1_databases` block and paste the id. Commit + push (CI deploys), then:

1. Go to `https://mannyknows.com/admin/` and log in.
2. Open `https://mannyknows.com/admin/migrate/` and run
   `002-full-admin.sql` (39 tables, includes starter quote/contract
   templates). The one-click runner exists because the D1 dashboard console
   rejects large multi-statement pastes.

The admin is now fully usable: leads, quotes, projects, contracts, contacts,
calendar, crew, partners.

## 3. Admin app KV (2 minutes — wiki, presence, small caches)

```bash
npx wrangler kv namespace create MK_ADMIN_KV
```

Paste the id into the commented `MK_ADMIN_KV` line in `wrangler.jsonc` and
uncomment it. (Login rate-limiting reuses the existing `MK_KV_SESSIONS`
namespace — nothing to create for that.)

## 4. Email (already half-done)

- `RESEND_API_KEY` is already a secret on this Worker — the admin reuses it.
- Admin emails send from `…@send.mannyknows.com` (quotes from
  `bookings@`, contracts from `contracts@`, replies via `admin@`). **Verify
  the `send.mannyknows.com` domain in the Resend dashboard** or those sends
  will be rejected (the admin itself keeps working; it logs the failure).
- Optional: `npx wrangler secret put NOTIFICATION_EMAIL` — where lead/quote
  alerts go (defaults to mm@mannyknows.com).
- Optional (inbound replies → admin messages): set up Resend inbound or
  Cloudflare Email Routing and `npx wrangler secret put RESEND_WEBHOOK_SECRET`.
  The Email Routing worker handler exists at `scripts/email-handler.js` but is
  **not wired into the build yet** (see §7).

## 5. Media pipeline (optional — Media Pool, photo/video uploads, contract PDFs)

```bash
npx wrangler r2 bucket create mannyknows-media
```

Uncomment the `r2_buckets` block. For direct-from-browser uploads and
Images/Stream integration, also set the ones of these you use:

```bash
npx wrangler secret put CF_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_API_TOKEN      # Images/Stream REST
npx wrangler secret put R2_ACCESS_KEY_ID          # presigned PUTs
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET_NAME            # mannyknows-media
npx wrangler secret put IMAGES_ACCOUNT_HASH       # imagedelivery.net/<hash>
npx wrangler secret put STREAM_CUSTOMER_SUBDOMAIN # customer-… .cloudflarestream.com
```

Media URLs are served from `images.mannyknows.com` (override with a
`MEDIA_PUBLIC_HOST` var): add that as a custom domain/route on this Worker or
on the R2 bucket — the middleware serves the bucket directly when the request
arrives on that hostname. Uncomment the `images` binding to enable `/img/*`
on-the-fly transforms (falls back to originals without it).

Note (shared account): Cloudflare Images + Stream libraries are account-wide.
MannyKnows uploads are namespaced `mk/…` (Images) and prefixed `mk — ` (Stream)
so they're identifiable next to SLPainting's and VLH's media. Never bulk-delete
in those dashboards without filtering.

## 6. SMS + AI assists (optional)

```bash
npx wrangler secret put TWILIO_ACCOUNT_SID   # crew invites + SMS alerts
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_PHONE_NUMBER
npx wrangler secret put NOTIFICATION_PHONE   # comma-separated alert recipients
npx wrangler secret put GEMINI_API_KEY       # "polish text" endpoints + portal concierge
```

All of it degrades gracefully while unset (logs + skips).

## 7. Daily cron (quote follow-ups + lead reminders) — deferred

VLHomes injects a `scheduled` handler into the built worker via its
post-build script. Our adapter (v14) emits a different worker entry, so that
injection is **not wired here yet** — the handlers are kept for reference at
`scripts/scheduled-handler.js` / `scripts/email-handler.js`.

Working alternative today: `POST /api/cron/run` runs the same daily job,
authorized by an admin session OR a `CRON_SECRET` header
(`npx wrangler secret put CRON_SECRET`), so any external scheduler (GitHub
Actions `schedule:`, cron-job.org) can hit it daily.

## Local development

```bash
cp .dev.vars.example .dev.vars                      # then edit the values
# temporarily uncomment MK_APP_DB in wrangler.jsonc with any dummy id
npx wrangler d1 execute MK_APP_DB --local --file database/migrations/002-full-admin.sql
npm run dev                                         # local D1/KV via miniflare
```

Log in at `http://localhost:4321/admin/` with your `.dev.vars` credentials.
(Revert the wrangler.jsonc uncomment before committing.)

## What was verified in the port smoke test (local miniflare, 2026-07-27)

- Migration `002` applies cleanly → 39 tables.
- Login with env credentials → dashboard; leads/quotes/projects/calendar/
  contacts/media-pool/web/migrate pages all render, zero 5xx.
- `POST /api/leads/capture` creates a lead (confirmation code `MK-…`) that
  appears in the dashboard pipeline and the Leads queue.
- A production build with all bindings still commented deploys exactly like
  before (no D1/R2 in `dist/server/wrangler.json`).
