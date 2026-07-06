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
- R2: `MK_R2` (bucket `mannyknows-website-analysis`).
- Static assets served via `ASSETS` binding from `./dist`.
- On Astro 7, access bindings/env through **`cloudflare:workers` `env`**, not
  `Astro.locals.runtime.env` at module scope (see commit 93 hotfix — that caused
  `/api/*` 500s).
- Secrets (not in source): `ADMIN_KEY`, `RESEND_API_KEY` — set with
  `npx wrangler secret put <NAME>`.

## Conventions

- **Business email is `mk@mannyknows.com`** — use it in anything public-facing.
  Do NOT put the owner's personal Gmail (showyouhow83@gmail.com) in committed code.
- `src/layouts/BaseLayout.astro` wraps every page (SEO/OG meta, CSP, view-source
  comment live here).
- Performance is a priority: pages are tuned for near-100 Lighthouse
  (image optimization AVIF/WebP via `<picture>`, no render-blocking, a11y).

## Key commands

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run preview` — preview built output
- `./deploy.sh` — manual production deploy
