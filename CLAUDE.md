# MannyKnows — Project Guide

Marketing/business site for MannyKnows (custom apps, websites, and AI automation
for small businesses in Western Massachusetts).

## Stack — get this right

- **Astro 7** (`output: 'server'`, SSR — it has API routes, not a static site).
- **Deployed as a Cloudflare *Worker*** via `@astrojs/cloudflare` v14.
  **NOT Cloudflare Pages.** Do not describe or configure it as Pages.
- **Tailwind 3** via **PostCSS** (`postcss.config.js`) — no Astro Tailwind integration.
- Swiper for sliders. Node >= 22.12.

## Deployment — how code goes live

- **Push to `main` auto-deploys.** Mechanism: **GitHub Actions**
  (`.github/workflows/deploy.yml`) runs `npm run build` then
  `npx wrangler deploy -c dist/server/wrangler.json`. This is *not* Cloudflare's
  git integration — it's Actions calling wrangler.
- Astro 7 / adapter v14 emits a self-contained `dist/server/wrangler.json`
  (with `main` + merged bindings). Always deploy from **that**, not the root
  `wrangler.jsonc` (which no longer carries `main`).
- Manual deploy: `./deploy.sh` (or `npm run deploy`) — builds and runs
  `wrangler deploy -c dist/server/wrangler.json` locally.
- Production URLs: https://mannyknows.com and https://www.mannyknows.com
  (also the `*.showyouhow83.workers.dev` origin).

## Cloudflare bindings (in root `wrangler.jsonc`)

- KV: `MK_KV_CHATBOT`, `MK_KV_PROFILES`, `MK_KV_SESSIONS` (Astro Sessions —
  set via `sessionKVBindingName`), `MK_KV_SERVICES`, `MK_KV_PRODUCTS`,
  `MK_KV_SCHEDULER`.
- Static assets served via `ASSETS` binding from `./dist`.
- On Astro 7, access bindings/env through **`cloudflare:workers` `env`**, not
  `Astro.locals.runtime.env` at module scope (see commit 93 hotfix — that caused
  `/api/*` 500s).
- Secrets (not in source): `ADMIN_KEY`, `RESEND_API_KEY` — set with
  `npx wrangler secret put <NAME>`.

## Conventions

- **Business email is `mm@mannyknows.com`** — use it in anything public-facing.
  Do NOT put the owner's personal Gmail (showyouhow83@gmail.com) in committed code.
- `src/layouts/BaseLayout.astro` wraps every page (SEO/OG meta, CSP, view-source
  comment, analytics beacon live here).
- Performance is a priority: pages are tuned for near-100 Lighthouse
  (image optimization AVIF/WebP via `<picture>`, no render-blocking, a11y).
  Bot Fight Mode stays ON (Manny's call) — it caps lab TBT/Best Practices;
  don't re-investigate it as a perf lead.

## Copy rules (house style — enforced across every public word)

- **Naming:** "Manny" = the human. "Manny AI" and "Remi AI" = AI agents.
  Never blur agent and company ("Manny AI builds websites" is wrong; "we" do).
- **Remi AI capability ladder never drifts (Aug 2026 restructure):** Remi AI
  sells standalone at /ai-booking-agent — `src/data/remi.ts` is the source of
  truth. Lite $40/mo answers & captures leads only; Remi $75/mo adds the full
  customization admin (personality, widget styling, suggested questions,
  test & correct); Pro $145/mo adds booking (into the admin calendar, synced
  to the client's own) plus opening lines, quick buttons, scoped menus, and
  the domain allowlist; Custom from $2,500 quoted (phone IVR, integrations),
  its running monthly quoted with the build. All plans carry the $195 setup,
  waived on a prepaid year. Tiers differ by which ADMIN PANELS they unlock —
  never by managed service (Manny configures at setup + trains, then the
  admin is the client's). On website plans nothing moved: booking arrives at
  Get Booked, selling at Get Growing. No page may promise a cheaper tier a
  pricier tier's verb. There is ONE Remi Lite: the One-Page Website
  ($195 + $40/mo, aiWebsite.ts derives from remi.ts) is the same
  subscription with a one-page site included for buyers without a website —
  never describe them as two products.
- **Prices appear ONLY in pricing sections, tier cards, and cost FAQs** —
  never in narrative copy, nav labels, or hero prose.
- **No "clause: elaboration" colon splices** in copy (swept Aug 2026). Write
  real sentences or connectors. Keep colons for genuine lists, labels
  ("Disconnected: scripts & tools"), SERP title separators, and the approved
  punchline "One team. One brain. One boss: you."
- **AI-team framing (Aug 2026):** agents are "added to your business" /
  "ready to work" — never a hiring process. "Hire Manny by the week"
  (the human, Multimedia Agency) is the approved exception, as is a customer
  "ready to hire" a business.
- **Lead niche:** web design & marketing for **dental & medical practices**,
  backed by Manny's MedNet Technologies (NY) experience — hundreds of practice
  sites overseen there. That was the employer's work: state it as experience,
  NEVER show or link those sites as portfolio (/about + websites-for-clinics
  carry the approved wording).
- **Card headers:** icon/number chips share the title's row
  (`flex items-center gap-3`) — never an icon on a row of its own. StepCards
  is the shared numbered-card component; PricingCards the only pricing grid.
- **Banned words:** "genuinely", "honestly", "no catch", "plain English"
  (use "clear"). Don't protest sincerity — prove with specifics.
- **Honesty rule:** never publish invented stats, clients, or capabilities.
  Cited figures keep their citations. Never mention Costa Rica in public copy.
- Meta descriptions 110–160 chars; titles ≤ 60. JSON-LD prices compute from
  the data files (plans.ts / aiTeam.ts / aiWebsite.ts) — never hardcode.

## Pricing canon

- **Single sources of truth:** `src/data/plans.ts` (website + store + ads +
  agency), `src/data/remi.ts` (Remi AI ladder $40/$75/$145 + $195 setup +
  admin matrix — aiWebsite.ts and aiTeam.ts's desi price derive from it),
  `src/data/aiTeam.ts` (agents/bundles/setup fee),
  `src/data/aiWebsite.ts` (One-Page $195 + $40/mo, derived from remi.ts),
  page-local `PACKAGES` in local-seo.astro ($245/$495) and `TIERS` in
  apps.astro ($300/$600/$2,500 at flat $75/hr). Most surfaces (nav search,
  JSON-LD, comparison tables) interpolate from these; **on a reprice only
  local-seo and apps need hand updates** (noted in a NavBar comment).
- **All pricing-card grids render through `PricingCards.astro`** (Aug 2026):
  /plans, /ecommerce, /apps, /local-seo, /ai-booking-agent, and the tier
  grids on /plans/business-ads + /plans/multimedia-agency. New pricing cards
  join that component; never hand-roll another card style.
- Mentions of Manny the human in plan copy link to /about/ — a `linkManny()`
  helper in plans.astro + plans/[slug].astro does it at render time (word-
  bound, never matches "MannyKnows"/"Manny AI"; Faq accepts `html: true`).
- Yearly = 10× monthly, 2 months free, everywhere.
- **Setup-fee rule (Aug 2026 — replaced the 6-month build-coverage clause):**
  website and store plans charge a **one-time setup fee** for the build on
  month-to-month billing, **waived in full on a prepaid year**. There is **no
  minimum term and no exit charge** — "cancel anytime" is now literally true
  and may be published without qualification. Both figures live in
  `plans.ts` (`setupFee`, `buildValue`) and /terms/#build-fee interpolates
  them, so a reprice touches one file. **setupFee = 40% of buildValue rounded
  to the nearest -5:** Get Found $595/$1,500 · Get Booked $895/$2,250 ·
  Get Growing & Get Ahead $1,195/$3,000 · Sell Online $745/$1,875 ·
  Sell More $1,045/$2,625 · Sell Smarter $1,345/$3,375 ·
  Sell Everywhere $1,645/$4,125. Never reintroduce recapture/clawback copy,
  a minimum term, or "no setup fee" claims on plans.
- **5-business-day refund window** from *kickoff* on both billing modes,
  refunding everything paid including the setup fee. After it, setup fees and
  prepaid years are non-refundable. **Plan switches** are a published formula at
  /terms/#setup-on-switch — `due = new tier's setup − setup already paid,
  floored at $0` (so moving down or sideways is free, and a waived yearly setup
  counts as $0 paid). Quote that anchor rather than improvising a number.
- Products that front no build keep a truthful cancel-anytime with no setup
  fee of ours: /local-seo packages, Business Ads, Multimedia Agency. The
  One-Page Website ($195) and AI Agents Team already had their own setup fees.
- **Shopify subscription is NOT included** in store tiers (unbundled Aug 2026):
  the account is opened in the client's name and billed by Shopify (Basic at
  Sell Online/More, Grow at Smarter/Everywhere).
- **Remi AI never transfers on exit** — the agents are service software on our
  infrastructure; the client keeps content and captured leads, not the agent.
  The One-Page GitHub repo excludes Remi. Stated in terms + ownership FAQs.

## Analytics & measurement (first-party + GA4)

- `POST /api/metric` counts events into `MK_KV_CHATBOT` (keys
  `metric:{YYYY-MM-DD}:{event}[:{page-or-label}]`, 90-day TTL): `view`,
  `quote_open`, `quote_submit`, `call_click`, `scan_run`, and labeled `cta`.
- The BaseLayout beacon auto-tracks **every a/button click** as `cta` with
  label `"{path}|{data-track || modal context || visible text || aria-label}"`,
  mirrored to GA4 as `cta_click` (G-J0V35RZNZB). `[data-no-track]` opts out.
  Renamed button copy starts a new label line.
- Read: `GET /api/metric?k=<ADMIN_KEY|ADMIN_API_KEY>&days=30`. The metric that
  judges copy changes is **quote_submit ÷ view per page**, before vs after a
  deploy (correlate with git log).

## Free AI Website Analysis (scanner)

- `/free-ai-website-analysis/` + `src/pages/api/analyze-site.ts` +
  `src/lib/site-analyzer.ts`. Server-side fetch of one page + robots/llms/
  sitemap; regex heuristics; NO JS execution.
- **The full report is EMAILED** (Resend, from `manny@send.mannyknows.com`);
  the page shows only a teaser (score + pillar bars). Fake emails get nothing —
  that's the verification. Falls back to on-page render if the send fails.
- Quota: **one domain per normalized email per rolling 30 days**
  (`scan_quota:{email}`; gmail dots/plus-tags folded; www stripped; burned
  only on successful scans). Re-scans of the same domain stay free.
- Every scan also emails Manny a "SCANNER LEAD" alert (deduped daily per
  email+host) — that alert is a summary by design; the lead's report is the
  separate "Your website report: …" email.

## Mascots & site imagery

- Assets in `public/mascot/` — processed with sharp: `.trim()` →
  `.resize()` → `.webp({quality:~82})`. Mascots are overwritten in place on
  art updates, hence the 1-day cache TTL in `public/_headers`.
- Two placement patterns: **edge peek** (absolute at a section edge,
  `--mascot-height/-peek/-rotate` CSS vars, hidden ≤639px — needs side
  gutters; never on full-width grids) and **corner stand** (absolute
  bottom-0, ~110px, inside a `relative overflow-hidden` section).
- **Alt policy:** decorative mascots carry a short descriptive alt AND
  `aria-hidden="true"` (screen readers skip, crawlers satisfied). Image SEO
  keywords belong ONLY on meaningful images (portfolio screenshots via
  `imageAlt` in selectedWork.ts, blog banners, hero slides) — never stuffed
  into decorative alts.
- Image generation: `scripts/generate-blog-photo.mjs` (Gemini
  `gemini-3.1-flash-image`, key in .dev.vars). Character-consistent scenes:
  pass a mascot PNG as an image input part with the prompt (see the Holyoke
  test in the Aug 2026 session).

## Ops gotchas

- `./deploy.sh` for rapid iterations (self-verifying, ~10s); push-to-main
  Actions takes ~10 min and cancels superseded runs. Right after a deploy the
  API edge can serve the previous worker for a few seconds (propagation lag) —
  retest before diagnosing.
- `wrangler kv key …` against these bindings **requires `--preview false`**
  (they have preview_ids; without the flag, writes/deletes silently fail).
- `public/_headers` carries browser-cache rules (mascots 1d, heroes 7d,
  fonts immutable) AND the security headers for static assets.
- The sitemap filter (astro.config.mjs) must exclude any page that becomes a
  redirect (e.g. /free-360-photo) — sitemaps list final URLs only.
  `node scripts/indexnow.mjs` pings IndexNow after meaningful content ships.
- exFAT volume drops `._*` AppleDouble files: `node scripts/cleanup-mac-files.js`.
- The `<h1>` on /ai-website rotates its last word by JS — SEO crawlers will
  report "H1 changed" every crawl; that's the animation, not a regression.

## Portfolio / case studies

- Content collection **`portfolio`** (`src/content/portfolio/*.md`, schema in
  `src/content.config.ts`) drives per-project case-study pages.
- Detail page: `src/pages/work/[...slug].astro` (hero, "at a glance" panel with
  tech stack/role/timeline, goals, result stat tiles, narrative, gallery).
  Index: `src/pages/work/index.astro`. Route base is **`/work`**.
- **Honesty rule (matches `selectedWork.ts`): never publish invented details.**
  New case studies start `draft: true` — draft entries build no page. Duplicate
  `sl-painting.md` (the template) to add one; fill every field, then flip
  `draft: false`.
- Homepage cards (`selectedWork.ts` → `SelectedWork.astro`) link to `/work/<slug>`
  when the item has a `caseStudy` slug; otherwise to the live site. Only set
  `caseStudy` once that case study is published.
- Images reuse the responsive pipeline: `public/works/<base>-<width>.<ext>`
  (AVIF/WebP). `heroImage`/`gallery` accept a base name OR a literal path/URL.

## Admin / CRM (ported from VLHomes, July 2026)

- Full CRM at **`/admin`**: Dashboard, Leads, Quotes (+templates), Projects
  (+contracts/e-signature), Portfolios, Contacts, Partners (white-label), Crew
  (+`/admin/timeclock` kiosk — deliberately NOT auth-gated), Calendar,
  Media Pool, Web (hero slides + wiki). Customer-facing machinery pages:
  `/quote/[token]`, `/project/[token]`, `/confirm/[token]`, `/my-project`,
  partner/crew portals. Setup + resource creation: **`SETUP-ADMIN.md`**.
- **Live since Aug 2026**: `MK_APP_DB` (D1) and `MK_MEDIA_BUCKET` (R2) are
  bound in `wrangler.jsonc` — the admin runs in production. Still
  commented-out: `MK_ADMIN_KV` and `IMAGES`. Login rate-limit reuses
  `MK_KV_SESSIONS`.
- **Styling follows the homepage design language (Aug 2026 recolor):**
  admin.css tokens carry it — canvas `#0a0a14` / lifted `#12121f`, violet
  `rgba(124,58,237,…)` + blue washes (pink retired), magenta `#d946ef`
  secondary, brand button gradient `#2563eb→#d946ef`, wordmark gradient
  `#a78bfa→#e879f9→#f472b6`, glass cards white-3%/10%-border. Page-local
  styles were re-paletted to match (projects' orange `#e05f00` is gone).
  Recolor via tokens only; never rename behavioral classes (`active`,
  `selected`, `collapsed`, …) — quotes/projects detail panes build DOM from
  JS strings.
- **Adapter-v14 rule (the port's one real breakage):** `locals.runtime.env`
  THROWS on any access — every ported file uses
  `import { env as cfEnv } from 'cloudflare:workers'`. Never reintroduce
  `locals.runtime.env` in admin code.
- Auth: HMAC-signed `mk_admin_session` cookie (PBKDF2 users in D1
  `admin_users`, env-var bootstrap creds), enforced by `src/middleware.ts`,
  which is **scoped to admin/portal namespaces only** — public pages pass
  through untouched (their CSP/caching stay in BaseLayout). Viewer-role
  sessions are write-blocked centrally there.
- D1 schema: `database/migrations/002-full-admin.sql` (39 tables), applied via
  the one-click runner at `/admin/migrate/`. Register new migration files in
  `src/pages/api/admin/run-migration.ts` (bundled with `?raw`).
- Styling is self-contained (`src/styles/admin.css`; customer pages use
  `src/styles/portal.css` + `src/components/portal/*`) — NOT Tailwind, NOT
  BaseLayout. The admin wordmark is drawn by `.logo-gradient-wrapper::after`.
- Admin emails send from `…@send.mannyknows.com` via the existing
  `RESEND_API_KEY` — that domain must be verified in Resend before sends work.
- Daily cron (follow-ups/reminders) is NOT wired yet: adapter v14's worker
  entry differs from VLH's injection target. `POST /api/cron/run`
  (admin session or `CRON_SECRET` header) runs the same job; handlers kept in
  `scripts/scheduled-handler.js` / `scripts/email-handler.js`.
- Contractor-shaped content (service types, quote/contract templates, crew
  pay constants) was inherited on purpose — "we'll readapt this admin to our
  agency" is the next phase. Crew pay/bonus values need Manny's sign-off
  before real use.

## Key commands

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run preview` — preview built output
- `./deploy.sh` — manual production deploy
