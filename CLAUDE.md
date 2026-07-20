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
  comment live here).
- Performance is a priority: pages are tuned for near-100 Lighthouse
  (image optimization AVIF/WebP via `<picture>`, no render-blocking, a11y).

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

## Key commands

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run preview` — preview built output
- `./deploy.sh` — manual production deploy
