# Onboarding — MannyKnows

_Rewritten Aug 22 2026. The previous version described the January 2026
chatbot-era app (endpoints, folders, and a leaked admin key that no longer
match reality). If something here disagrees with `CLAUDE.md`,
`package.json`, or `wrangler.jsonc`, those win — fix this file._

## What this repo is

The marketing/business site for MannyKnows (custom apps, websites, and AI
automation for small businesses in Western Massachusetts), plus a full
admin/CRM at `/admin` and the customer-facing pages it drives.

Read `CLAUDE.md` first. It carries the rules that matter: copy style, the
pricing canon, the UI primitives, and the security posture. This file is the
map; that file is the law.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Astro 7 (`output: 'server'`, SSR) |
| Adapter | `@astrojs/cloudflare` 14 — deployed as a **Worker**, not Pages |
| Styling (public) | Tailwind 3 via PostCSS (no Astro integration) |
| Styling (admin) | `src/styles/admin.css` — plain CSS, no Tailwind |
| Sliders | Swiper |
| Data | KV (6 namespaces), D1 (`MK_APP_DB`), R2 (`MK_MEDIA_BUCKET`) |
| Email | Resend, sending from `send.mannyknows.com` |
| Node | ≥ 22.12 |

## Layout

```
src/
├── components/          # public UI + admin chrome (AdminNav, AdminMobileDrawer…)
│   ├── ui/              # the primitives: Button, Breadcrumb, SectionHeader, Faq…
│   ├── portal/          # customer portal pieces
│   ├── pricing/         # PricingCards and friends
│   └── sections/        # homepage/section blocks
├── content/portfolio/   # case studies → /work/<slug>
├── data/                # pricing canon: plans.ts, remi.ts, aiTeam.ts, localSeo.ts, apps.ts
├── layouts/BaseLayout.astro
├── lib/                 # server helpers (adminAuth, quote-emails, site-analyzer, security/)
├── middleware.ts        # admin + portal auth, CSRF, media host, HSTS
├── pages/
│   ├── admin/           # the CRM
│   ├── api/             # public + admin API routes
│   ├── quote/ project/ confirm/   # customer-facing token pages
│   └── *.astro          # public marketing pages
├── styles/admin.css     # admin design system
└── utils/               # debug, image, token helpers
database/migrations/     # D1 schema, applied via /admin/migrate/
database/seeds/          # quote-template seed
scripts/                 # build/ops scripts (image gen, indexnow, seed generator)
```

## Bindings

Authoritative list: `wrangler.jsonc`. Summary:

| Type | Binding | Purpose |
| --- | --- | --- |
| KV | `MK_KV_CHATBOT` | scanner leads/quota/cache, first-party metrics, newsletter |
| KV | `MK_KV_PROFILES` | profiles |
| KV | `MK_KV_SESSIONS` | Astro Sessions + admin login rate limits |
| KV | `MK_KV_SERVICES` / `MK_KV_PRODUCTS` / `MK_KV_SCHEDULER` | service/product/scheduling data |
| D1 | `MK_APP_DB` | the admin CRM (`mannyknows-db`) |
| R2 | `MK_MEDIA_BUCKET` | media pool, quote/project uploads, contract PDFs |
| Assets | `ASSETS` | static files from `dist/client` |

Not bound yet: `MK_ADMIN_KV` (limiters fall back to `MK_KV_SESSIONS`) and
`IMAGES`.

**Astro 7 rule:** read env and bindings through
`import { env } from 'cloudflare:workers'`. `locals.runtime.env` throws in
this adapter — never reintroduce it.

**wrangler gotcha:** `wrangler kv key …` against these namespaces needs
`--preview false`, or writes silently target nothing.

## Secrets

Never in the repo. Set with `npx wrangler secret put <NAME>`; local values go
in `.dev.vars` (gitignored). The ones in use: `SESSION_SECRET`,
`ADMIN_USERNAME`/`ADMIN_PASSWORD` (bootstrap login), `ADMIN_KEY` /
`ADMIN_API_KEY` (metric reads), `RESEND_API_KEY`, `SCAN_OWNER_EMAILS`,
`CRON_SECRET`, `GEMINI_API_KEY`, and the optional Twilio/R2/Images/Stream
set (see `SETUP-ADMIN.md`).

## APIs

`docs/API.md` is the reference. Shape: public endpoints under `/api/*`
(contact, newsletter, analyze-site, metric, quote-upload) and the admin CRM
under `/api/admin/*` behind the HMAC `mk_admin_session` cookie enforced by
`src/middleware.ts`. The chatbot-era debug endpoints were deleted in Aug 2026
— if you find a reference to `kv-analysis`, `services-analysis`,
`security-status`, or `verify-meeting-action`, it's stale documentation.

## Commands

```bash
npm run dev        # localhost:4321
npm run build      # dist/client (assets) + dist/server (worker)
npm run preview    # preview the built output
./deploy.sh        # manual deploy: build, clean ._* files, deploy, verify
```

Push to `main` auto-deploys through GitHub Actions (~10 min). `./deploy.sh`
is the fast path (~10s) for iterating. Always deploy from
`dist/server/wrangler.json` — the root `wrangler.jsonc` no longer carries
`main`.

## Local admin data

```bash
npx wrangler d1 execute MK_APP_DB --local --file database/migrations/002-full-admin.sql
npx wrangler d1 execute MK_APP_DB --local --file database/seeds/quote-templates.sql
```

Log in at `http://localhost:4321/admin/` with the `.dev.vars` credentials.
`--local` is miniflare's sqlite under `.wrangler/state`; `--remote` is
production — know which one you're typing.

## Troubleshooting

| Problem | Cause / fix |
| --- | --- |
| `/api/*` returns 500 after an edit | `locals.runtime.env` crept in — use `cloudflare:workers` `env` |
| KV write appears to do nothing | missing `--preview false` |
| Admin page 503s | `MK_APP_DB` unbound (the admin ships dark without it) |
| Deploy looks stale for a few seconds | edge propagation lag — retest before diagnosing |
| `._*` files everywhere | exFAT volume; `node scripts/cleanup-mac-files.js` |
| Email not sending | `RESEND_API_KEY` missing, or `send.mannyknows.com` unverified in Resend |
