# Architecture Overview

_Last verified: Aug 2026. If a number here disagrees with `package.json` or
`wrangler.jsonc`, those win — update this file._

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Astro (`output: 'server'`, SSR + prerendered pages) | 7.x |
| Adapter | @astrojs/cloudflare (deployed as a **Worker**, not Pages) | 14.x |
| Styling | Tailwind CSS via PostCSS (no Astro integration) | 3.4.x |
| Sliders | Swiper | 12.x |
| Images | sharp (build-time processing) | — |
| Runtime | Cloudflare Workers (Node ≥ 22.12 locally) | — |
| Data | Cloudflare KV, D1, R2 | — |
| Email | Resend API (`send.mannyknows.com` sender domain) | — |
| Language | TypeScript | 5.9.x |

## Cloudflare Bindings (root `wrangler.jsonc`; deploy uses `dist/server/wrangler.json`)

### KV Namespaces

| Binding | Purpose |
|---------|---------|
| `MK_KV_CHATBOT` | Chat sessions, scanner leads/quota/cache (`scan_*`), first-party metrics (`metric:*`), newsletter |
| `MK_KV_PROFILES` | User profiles |
| `MK_KV_SESSIONS` | Astro Sessions (`sessionKVBindingName`) + admin login rate-limit |
| `MK_KV_SERVICES` | Service configurations |
| `MK_KV_PRODUCTS` | Product data |
| `MK_KV_SCHEDULER` | Discovery calls |

**Gotcha:** `wrangler kv key …` needs `--preview false` on these bindings or
the operation silently targets nothing.

### Other bindings

| Binding | Type | Purpose |
|---------|------|---------|
| `MK_APP_DB` | D1 | Admin CRM (39 tables, `database/migrations/`); site ships dark without it |
| `MK_MEDIA_BUCKET` | R2 | Admin media pool / quote photo uploads |
| `ASSETS` | Static assets | Serves `dist/client`, honors `public/_headers` + `_redirects` |

### Environment Variables / Secrets

Vars: `GA_MEASUREMENT_ID`, `OWNER_EMAIL` (mm@mannyknows.com), `OWNER_TIMEZONE`,
`RESEND_FROM` (`Manny <manny@send.mannyknows.com>`), `ADMIN_EMAIL`.
Secrets (via `npx wrangler secret put`): `RESEND_API_KEY`, `ADMIN_KEY`,
`ADMIN_API_KEY`, admin bootstrap creds. Local dev keys in `.dev.vars`
(gitignored), incl. `GEMINI_API_KEY` for image generation.

**Astro 7 / adapter 14 rule:** access env via `import { env } from
'cloudflare:workers'` — `locals.runtime.env` THROWS in ported admin code.

## Key KV key families (MK_KV_CHATBOT)

| Prefix | Meaning | TTL |
|--------|---------|-----|
| `metric:{date}:{event}[:{page-or-label}]` | First-party analytics (view, quote_open/submit, call_click, scan_run, cta) | 90d |
| `scan_rl:{ip}` | Scanner IP rate limit (8/hr) | 1h |
| `scan_quota:{email}` | One-domain-per-email scanner quota | 30d |
| `scan_cache:v3:{host}` | Scanner result cache | 30m |
| `scan_lead:{ts}:{host}:{email}` | Scanner leads (permanent) | — |
| `scan_lead_note:{email}:{host}` | Owner-alert daily dedupe | 24h |

## Front-end architecture notes

- `BaseLayout.astro` wraps every public page: SEO/OG meta, CSP meta tag,
  GA4 (lazy gtag), the opscloud Remi AI widget, the quote/contact modal, and
  the first-party metrics beacon (auto-labels every a/button click as `cta`).
- Admin (`/admin`, ported from VLHomes) is self-contained: `src/styles/admin.css`,
  own auth (HMAC `mk_admin_session` cookie, `src/middleware.ts` scoped to
  admin/portal namespaces), NOT Tailwind, NOT BaseLayout.
- Shared copy components prevent drift: `SmartWebsiteConcept` (versus panel),
  `PricingPlans`, `Faq` (emits FAQPage schema), `GbpStats`/`GbpComparison`;
  canonical data in `src/data/*.ts` (see CLAUDE.md "Pricing canon").
- `public/_headers`: security headers for static assets + browser-cache rules
  (hashed `/_astro/*` immutable via adapter; mascots 1d; heroes 7d; fonts 1y).

## Build & Deploy

```bash
npm run dev        # local dev
npm run build      # emits dist/client (assets) + dist/server (worker)
./deploy.sh        # manual: builds, strips ._* files, deploys, verifies live
```

- Push to `main` auto-deploys via GitHub Actions (`.github/workflows/deploy.yml`):
  `npm run build` then `npx wrangler deploy -c dist/server/wrangler.json`.
  **Always deploy from `dist/server/wrangler.json`** — the root `wrangler.jsonc`
  no longer carries `main`.
- Routes: `mannyknows.com/*` and `www.mannyknows.com/*` (+ workers.dev origin).
- Expect a few seconds of edge propagation lag after deploy before all
  requests hit the new worker.
- Sitemap: `@astrojs/sitemap` → `/sitemap-index.xml` (robots.txt points there);
  the filter in `astro.config.mjs` must exclude admin/portal pages AND any
  page that 301s. `scripts/indexnow.mjs` pings IndexNow with the sitemap.
