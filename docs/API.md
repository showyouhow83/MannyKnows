# API Reference

_Last verified: Aug 2026. The admin CRM adds ~35 endpoints under
`/api/admin/*` (see SETUP-ADMIN.md); this file covers the public site's APIs._

## Public APIs

### Contact / Quote form
`/api/contact`

Backs the sitewide quote+contact modal (`QuoteFormModal.astro`, which
intercepts `#quote`, `#contact`, `[data-quote]`, `[data-contact]`).

- **GET** — CSRF token for the session
- **POST** — submit; body includes `name, email, subject, message, service,
  context, csrf_token, session_id`. Sends the owner an email via Resend.
  Photo attachments upload first through `POST /api/quote-upload` (R2).

### Website analysis scanner
`/api/analyze-site`

- **POST** `{ url, email }` — fetches ONE page of the target (plus
  robots.txt / llms.txt / sitemap.xml), runs `src/lib/site-analyzer.ts`
  heuristics, then **emails the full report to the visitor** and returns a
  teaser (`{ overall, grade, pillars[], findings, emailed, sentTo }`).
  Falls back to returning the full report if the email send fails.
- Guards: SSRF-safe URL normalization; 8 scans/hr per IP; **one domain per
  normalized email per 30 days** (gmail dots/+tags folded; re-scans of the
  same domain free; quota burned only on success); 30-min result cache per
  host; mannyknows.com itself refused.
- Side effects: permanent `scan_lead:*` KV record + "SCANNER LEAD" owner
  email (deduped daily per email+host) + `scan_run` metric bump.

### First-party metrics
`/api/metric`

- **POST** `{ e, p?, l? }` — count an event. `e` ∈ `view | quote_open |
  quote_submit | call_click | scan_run | cta`. `p` = pathname; `cta` uses
  `l` = label (`"/path|button text"`). Writes per-day sitewide + per-page/
  label counters (90-day TTL). Never fails the page; no cookies.
- **GET** `?k=<ADMIN_KEY|ADMIN_API_KEY>&days=30` — aggregated report:
  `{ events: { <event>: { total, byDay, byPage } } }` (for `cta`, `byPage`
  holds labels). 403 without a valid key.
- Fired automatically by the BaseLayout beacon (views, tel: taps, labeled
  a/button clicks — mirrored to GA4 as `cta_click`) and by
  `QuoteFormModal` (open/submit). `[data-no-track]` opts a subtree out.

### Newsletter
`/api/newsletter` — GET (CSRF) / POST subscribe. `/unsubscribe` page pairs it.

### Uploads
- `POST /api/quote-upload` — quote-modal photos → R2.
- `/api/r2-upload`, `/api/r2-upload-url`, `/api/r2-presigned-url`,
  `/api/cloudflare-images-upload` — admin/media plumbing.

### Cron
`POST /api/cron/run` — runs the daily follow-ups/reminders job (admin
session or `CRON_SECRET` header). A real scheduled trigger is NOT wired yet
(adapter-v14 worker entry differs from the old injection target); handlers
live in `scripts/scheduled-handler.js` / `scripts/email-handler.js`.

## Admin APIs

`/api/admin/*` (~35 endpoints: leads, quotes, projects, contracts, crew,
portfolios, contacts, partners, media-pool, migrations runner, …) — all
behind the HMAC `mk_admin_session` cookie enforced by `src/middleware.ts`
(scoped to admin/portal namespaces; viewer-role sessions are write-blocked
centrally). With `MK_APP_DB` unbound the whole namespace answers a 503
explainer. Register new migrations in `src/pages/api/admin/run-migration.ts`.

## Legacy / debug

`/api/kv-analysis`, `/api/debug-kv`, `/api/debug-services`,
`/api/dev-check-kv`, `/api/dev-reset-rate-limits` — Bearer `ADMIN_API_KEY`.
Older chatbot-era endpoints not listed above are candidates for removal, not
documentation.

## Rate limits (public surface)

| Endpoint | Limit |
|----------|-------|
| analyze-site | 8/hr per IP + 1 domain per email / 30 days |
| contact | CSRF + per-session |
| metric | none (counters only, validated event names) |
