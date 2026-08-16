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
  don't re-investigate it as a perf lead. The other Best-Practices deduction
  (console 404 on `/cdn-cgi/rum/`) is Cloudflare Web Analytics' auto-injected
  beacon posting to a RUM endpoint that answers 404 — a dashboard toggle
  (Analytics & Logs → Web Analytics), not code.

## UI primitives (Aug 2026 normalization — every public page uses these)

- **`src/components/ui/Button.astro`** is the ONE button. Pill, `min-h-12`,
  `variant` primary (blue→violet→pink gradient, white) · secondary (hairline
  outline) · ghost (text link); `size` sm/md/lg; `arrow` right/down/external;
  slot for the label; `data-*`/`aria-*`/`target`/`rel` pass through. Never
  hand-roll a CTA anchor again. The only deliberate exception is the glass
  `.tier-cta` inside PricingCards (carries the column's accent).
- **`src/components/ui/Breadcrumb.astro`** renders every interior breadcrumb
  and its BreadcrumbList JSON-LD. Trail mirrors the URL: flat routes are
  `Home / Page` (no "Services" middle crumb); only `/blog/<slug>`,
  `/plans/<slug>`, `/work/<slug>` carry a parent crumb.
- **`src/components/ui/SectionHeader.astro`** (default `size="section"`) is
  the interior section header: centred `max-w-2xl mb-10`, h2
  `sf-bold text-2xl md:text-3xl` gradient text, `mt-3 text-base` subtitle;
  `size="hero"` is the homepage-scale statement header. `StepCards` and
  `Faq` are the shared card/FAQ blocks; city pages render through
  `LocalAreaPage.astro`. (The `/websites-for-<vertical>` profession pages
  were retired Aug 2026 — they re-pitched /plans and added a click; each URL
  301s to its blog article, see astro.config redirects.)
- Interior hero shape (from /plans): breadcrumb → mascot (`h-[220px]`) →
  eyebrow chip → gradient h1 → intro → primary + secondary pill → optional
  highlighted panel on the right (`rounded-3xl border-primary-blue/40 ring-1`).
  The simple/centred variant is /contact's (`pb-12 px-4`, chip, h1, intro).
- **Style canon (Aug 16 2026 sitewide audit + fix pass — keep it):** content
  width `max-w-6xl` for card grids, tables, FAQ blocks and banners (never
  4xl/5xl/7xl; PricingCards grids fill the Container); prose `max-w-3xl`;
  `Faq.astro` is `max-w-6xl` with the default heading everywhere; standard
  card `rounded-2xl border-light-tertiary dark:border-dark-accent bg-white
  dark:bg-dark-secondary p-6` + hover `border-primary-blue/40 shadow-xl
  shadow-primary-blue/10`; chip `h-11 w-11 rounded-xl` brand gradient on the
  title row; h3 `text-lg font-bold leading-snug`; labels `text-xs font-bold
  uppercase tracking-wider …tertiary`; only token colours (no hex/gray/slate
  on public pages); prose on blog/work/terms/privacy renders through the one
  `.mk-prose` block in global.css. `text-text-*-tertiary` tokens exist again
  (same values as secondary — no greys, Manny). Dead components were deleted
  (ReviewsSection/ReviewCard/StatsCard, AiWebsiteShowcase, BlogHighlights,
  LinkBanner).

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
  never describe them as two products. On /pricing there is NO One-Page
  section (Manny, Aug 16: "makes no sense" as a separate product) — the Remi
  section carries the "no website? Lite includes a one-page site" line, and
  /ai-website's pricing grid renders the Remi AI Lite card
  (`remiCards()[0]`) with two explainer cards for what setup vs monthly buys.
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
- **Lead niche (SITEWIDE, Aug 2026):** web design & marketing for **dental &
  medical practices**, backed by Manny's MedNet Technologies (NY) experience.
  Approved phrasing: **"hundreds of dental and medical practice websites
  designed, built, and launched"** — NEVER "overseeing/oversaw" (Manny: "I
  made them come alive"), and agency voice, not a person pleading ("It's the
  work Manny knows deepest — he oversaw…" is retired). That was the
  employer's work: state it as experience, NEVER show or link those sites as
  portfolio. The niche is woven into the sitewide copy, NOT a separate landing
  page: homepage subhead (the H1 and <title> stay broad — "AI Agents,
  Websites, SEO & Apps" — Manny's call), the first hero slide (the practice
  reception scene carrying the plans copy "Get Found. Get Booked. Get
  Growing." → /plans/ — one slide, never a practice slide AND a plans slide),
  JSON-LD description/knowsAbout, BaseLayout default description, search
  index ("dental" queries → /plans/), footer tagline + first Web & Apps link
  (→ /plans/), /services subhead, plans "Built for" line and whoFor copy, and
  city pages' audience sentences (practices named first). The how-to lives in
  the blog cluster (`websites-for-dental-medical-practices` pillar,
  `dental-website-cost`, `dentist-near-me-local-seo-springfield`,
  `ai-agent-for-medical-practices`; tag "Dental & Medical"). Other verticals
  stay — "practices first, every business that runs on appointments after" is
  the frame.
- **Card headers:** icon/number chips share the title's row
  (`flex items-center gap-3`) — never an icon on a row of its own. StepCards
  is the shared numbered-card component; PricingCards the only pricing grid.
- **Banned words:** "genuinely", "honestly", "no catch", "plain English"
  (use "clear"). Don't protest sincerity — prove with specifics.
- **Honesty rule:** never publish invented stats, clients, or capabilities.
  Cited figures keep their citations. Never mention Costa Rica in public copy
  — with ONE exception: the Cherry Vibes case study/testimonial/blurb keeps
  its "started in Costa Rica → migrated to the U.S." origin story (Manny's
  call, Aug 2026); don't strip CR from Cherry Vibes.
- Meta descriptions 110–160 chars; titles ≤ 60. JSON-LD prices compute from
  the data files (plans.ts / aiTeam.ts / aiWebsite.ts) — never hardcode.

## Pricing canon

- **Single sources of truth:** `src/data/plans.ts` (website + store + ads +
  agency), `src/data/remi.ts` (Remi AI ladder $40/$75/$145 + $195 setup +
  admin matrix — aiWebsite.ts and aiTeam.ts's desi price derive from it),
  `src/data/aiTeam.ts` (agents/bundles/setup fee),
  `src/data/aiWebsite.ts` (One-Page $195 + $40/mo, derived from remi.ts),
  `src/data/localSeo.ts` (`PACKAGES` $245/$495/$995 + `ONDEMAND` one-times +
  the $145 plan-client add-on) and `src/data/apps.ts` (`TIERS` $300/$600/
  $2,500 at flat `APPS_HOURLY` $75/hr) — both moved out of their pages Aug
  2026 so /pricing can import them. Most surfaces (nav search, JSON-LD,
  comparison tables, the nav search index) interpolate from these — a reprice
  touches only the data file.
- **`/pricing/` is the menu** (Aug 2026): simple centred hero (the /contact
  shape), then one section per product rendering the SAME `PricingCards`
  grid its product page renders — the card rows come from
  `src/lib/pricingCards.ts` (`websitePlanCards()`, `storeCards()`,
  `remiCards()`, `onePageCards()`, `localSeoCards()`, `appTierCards()`,
  `serviceTierCards(slug)`), which the product pages import too, so the two
  surfaces can't drift. Manny tried compact rows first and rejected them
  ("horrible") — keep the cards. Billing rules live in its FAQ, the two free
  offers as house cards, OfferCatalog JSON-LD computed from the same cards.
  Top-level "Pricing" nav link + footer/search entries; /services title has
  no "& Pricing".
- **AI Agents Team = Manny AI, priced per WORKFLOW** (Manny, Aug 16 2026):
  the story is the manager that adds as many agents as each workflow (one
  defined business process) needs — "your own AI multimedia agency". Never
  price per agent or per head count; never publish bundle/per-agent figures
  (aiTeam.ts keeps them for internal math only). Public numbers: the $195
  setup (waived on a prepaid year); the monthly is quoted per workflow on the
  diagnostic until Manny sets a workflow ladder. On /pricing and /plans the
  section is `AiTeamBanner.astro` (Manny AI avatar, no roster, no Remi) —
  Remi AI is deliberately absent from AI-team surfaces so the two aren't
  confused; Remi lives in its own section.
- **All pricing-card grids render through `PricingCards.astro`** (Aug 2026):
  /plans, /ecommerce, /apps, /local-seo, /ai-booking-agent, and the tier
  grids on /plans/business-ads + /plans/multimedia-agency. New pricing cards
  join that component; never hand-roll another card style (/pricing's rows
  are a menu, not cards).
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
- **Email must be deliverable:** after the syntax regex, the domain is checked
  over Cloudflare DNS-over-HTTPS (MX, then A/AAAA fallback; NXDOMAIN → reject,
  resolver error → fail open). "gmail.cpom"-style typos get a one-click
  "Use …@gmail.com" suggestion (`suggestDomain`, major providers only). Resend
  otherwise ACCEPTS a send to a nonexistent domain and it just bounces — no
  retry loop on our side, but the report would vanish and the quota burn.
- **Owner unlock:** `SCAN_OWNER_EMAILS` worker secret (comma-separated; set
  via `wrangler secret put`, also in .dev.vars) + any `@mannyknows.com`
  address = no quota, no "scanner lead" alert to himself, full report on the
  page (`owner: true` in the JSON) as well as emailed, 5× the per-IP rate
  cap, and may scan mannyknows.com itself. Never hardcode a personal email.
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

## Security posture (hardened Aug 2026 — don't regress these)

- **Uploads:** `/api/r2-upload` POST needs an admin or crew session; PUT
  additionally accepts a portal token header (`X-Crew-Token` /
  `X-Client-Token`, resolved in D1) restricted to `progress/`, add-only (no
  overwrite), KV rate-limited; `contracts/` is admin-only. MIME allowlists are
  EXACT matches on the normalized media type (never `startsWith`); PDFs are
  magic-byte checked; upload keys are server-shaped. Error bodies are generic.
- **Serving media:** everything read back from the bucket (media host in
  middleware, `/r2-local/`, `/api/leads/image/`) goes through
  `src/lib/security/mediaHeaders.ts` `safeMediaHeaders()` — only real
  image/video/audio/PDF types render inline (SVG sandboxed), everything else
  is octet-stream + attachment, always `nosniff`. Never serve a stored
  Content-Type raw.
- **CSRF:** middleware refuses cookie-authenticated POST/PUT/PATCH/DELETE
  whose `Sec-Fetch-Site` isn't same-origin/none (Origin/Referer host fallback)
  on `/api/admin/*` and any `/api/*` carrying the admin cookie. Session-based
  mutators must be POST (cron/run's session path is POST-only). Admin/crew
  cookies: HttpOnly + Secure + SameSite=Lax.
- **Auth:** admin login is IP-limited (5/15 min) AND per-account locked
  (10 fails/30 min), unknown users burn the same PBKDF2 cost, failures are
  logged (`[security]` console.warn → Workers Logs). `adminOnlyGuard` gates
  user management + migrations; `viewerGuard` gates every other write. No
  hardcoded session-secret fallback — missing `SESSION_SECRET` fails closed.
  Sessions are stateless HMAC (24 h): there is no password-change flow yet, so
  revoking a session = rotate `SESSION_SECRET` (known gap).
- **Rate limits are KV-backed** (`src/lib/rateLimit.ts` fails open without
  KV): `MK_ADMIN_KV` is NOT bound, so limiters use
  `env.MK_ADMIN_KV || env.MK_KV_SESSIONS`. Public writers all have one:
  contact 6/h, newsletter 6/h + 1 confirm email/address/day, leads 10/h,
  scanner 8/h, metric 300/h, crew login 10/15 min (IP + name), portal chat
  30/h/token, portal auth + project lookup per IP + email.
- **Public input:** leads/capture cleans + caps every field, validates
  phone/email, only accepts our own image URLs, HTML-escapes both emails, and
  never builds the confirm link from the Host header. Admin pages render
  public data via textContent/escapeHtml — never raw innerHTML.
- **HSTS** is set on every response (public/_headers for static, middleware
  for SSR). Webhooks fail closed without their secret (Svix inbound, Twilio
  compliance). `/api/metric` reads take the key via `x-admin-key` header.

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
