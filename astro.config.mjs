import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

import fs from 'node:fs';

// ── Real sitemap lastmod dates for the blog ──────────────────────────────────
// Every URL used to ship `lastmod: new Date()`, i.e. "the whole site changed"
// on every deploy — a signal crawlers learn to ignore, which wastes it on the
// posts that genuinely did change. Frontmatter is read here at config time
// (content collections aren't available in this file) and only the URLs we
// know a real date for get a lastmod; the sitemap spec makes it optional, and
// omitting it beats asserting something false.
const BLOG_DIR = new URL('./src/content/blog/', import.meta.url);
const blogLastmod = new Map();
for (const file of fs.readdirSync(BLOG_DIR)) {
  // exFAT sprays AppleDouble sidecars into this directory; they are not posts.
  if (!file.endsWith('.md') || file.startsWith('._')) continue;
  const fm = fs.readFileSync(new URL(file, BLOG_DIR), 'utf8').split('---')[1] ?? '';
  if (/^draft:\s*true/m.test(fm)) continue;
  const pick = (key) => fm.match(new RegExp(`^${key}:\\s*["']?(\\d{4}-\\d{2}-\\d{2})`, 'm'))?.[1];
  // A rewritten post reports its revision date, not its original publish date.
  const date = pick('updatedDate') ?? pick('pubDate');
  if (date) blogLastmod.set(`/blog/${file.replace(/\.md$/, '')}/`, date);
}
// The index changes whenever its newest entry does.
const newestPost = [...blogLastmod.values()].sort().pop();
if (newestPost) blogLastmod.set('/blog/', newestPost);


// https://astro.build/config
// Tailwind runs via PostCSS (postcss.config.js) — no Astro integration needed.
export default defineConfig({
  site: 'https://mannyknows.com',
  output: 'server', // Server mode for API routes
  // 301s for retired /services/* URLs (old taxonomy) that now 404. Agent/bot/
  // analytics topics point at /ai-team; web-design/optimization at /services.
  // Redirect targets keep their trailing slash: Cloudflare serves the canonical
  // `/path/` form and 307s the bare `/path`, so a slashless target would turn
  // every one of these into a redirect *chain*.
  redirects: {
    // The real sitemap is @astrojs/sitemap's /sitemap-index.xml (declared in
    // robots.txt). This alias exists purely for crawlers/tools that probe the
    // conventional /sitemap.xml path and flag a 404.
    '/sitemap.xml': '/sitemap-index.xml',
    '/services/ai-agents': '/ai-team/',
    '/services/customer-service-bots': '/ai-team/',
    '/services/appointment-booking-bots': '/ai-team/',
    '/services/lead-generation-bots': '/ai-team/',
    '/services/competitor-analysis': '/ai-team/',
    '/services/analytics': '/ai-team/',
    '/services/behavioral-analytics': '/ai-team/',
    '/services/adaptive-layouts': '/services/',
    '/services/conversion-optimization': '/services/',
    '/services/crm-automation': '/services/',
    // Retired /work index (July 2026): the homepage portfolio section covers the
    // same ground, so the listing page was redundant. The case studies themselves
    // stay at /work/<slug> — this redirect is the index only, and the trailing
    // slash matters (see the note above about redirect chains).
    '/work': '/#work',
    // Retired /products ("Projects") — every entry was a draft, so the index
    // rendered an empty catalogue with no inbound links. Folded into /services,
    // which already covers one-time vs monthly work.
    '/products': '/services/',
    // Retired: the smart-website explainer was folded into /plans (the page
    // where those plans are actually sold) rather than floating on its own.
    '/smart-websites': '/plans/',
    // Plan rename (July 2026): outcome names replaced the AI Smart Website I/II/III
    // family — 301 the old slugs so links and rankings carry.
    '/plans/basic-website': '/plans/get-found/',
    '/plans/plus-website': '/plans/get-booked/',
    '/plans/smart-website': '/plans/get-growing/',
    // Online stores moved off /plans onto their own page (July 2026): the four
    // website tiers answer "get me found and booked"; a store is a different
    // decision, with its own build and its own economics.
    '/plans/online-store': '/ecommerce/',
    '/plans/sell-online': '/ecommerce/',
    // Retired the /websites-for-<vertical> landing pages (Aug 2026): they
    // re-pitched /plans with the trade name swapped and added a click. The
    // niche framing lives in the sitewide copy now; the vertical how-to lives
    // in the blog, so each old URL lands on its article.
    '/websites-for-clinics': '/blog/websites-for-dental-medical-practices/',
    '/websites-for-contractors': '/blog/lead-engine-for-contractors/',
    '/websites-for-daycares': '/blog/daycare-website-that-fills-enrollment/',
  },
  // Astro's built-in origin check rejects cross-origin form POSTs (CSRF guard).
  // That blocks legitimate inbound webhooks like Twilio's status callback, which
  // POST application/x-www-form-urlencoded from Twilio's servers. Our own routes
  // don't rely on it — they receive JSON and enforce token-based CSRFProtection
  // themselves — and the webhook authenticates via the Twilio signature. So it's
  // safe to turn off here.
  security: { checkOrigin: false },
  // Dev-only: hide Astro's floating toolbar in `npm run dev` (Manny's call,
  // Aug 2026 — it sat over the admin's bottom-left corner). No production
  // effect; the toolbar never ships in builds.
  devToolbar: { enabled: false },
  adapter: cloudflare({
    imageService: 'compile', // Explicitly set image service for Cloudflare
    // v14 auto-enables Astro Sessions on a KV binding; point it at our existing
    // namespace instead of the default "SESSION" binding (which we don't have).
    sessionKVBindingName: 'MK_KV_SESSIONS'
  }),
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/my-project') &&
        !page.includes('/unsubscribe') &&
        !page.includes('/404') &&
        // 301 to /local-seo/#free-360-photo — sitemaps list final URLs only.
        !page.includes('/free-360-photo'),
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        const date = blogLastmod.get(new URL(item.url).pathname);
        if (date) item.lastmod = new Date(`${date}T00:00:00Z`).toISOString();
        return item;
      },
    })
  ],
  vite: {
    // Builds and the dev server share node_modules/.vite by default, and a
    // build wipes the dev server's optimized-deps cache out from under it
    // ("file does not exist at .vite/deps_ssr/..."). Separate cache dirs so
    // `npm run build` / deploy.sh can run beside a live `npm run dev`.
    cacheDir: process.argv.includes('build')
      ? 'node_modules/.vite-build'
      : 'node_modules/.vite',
    ssr: {
      external: ['node:fs/promises']
    },
    build: {
      cssCodeSplit: true,
      // Governs which stylesheets inlineStylesheets:"auto" inlines. Default is
      // 4KB; page-level sheets (index.css ~7.5KB) sat just above it and stayed
      // render-blocking. CSS under 16KB inlines; everything else (and every
      // non-CSS asset) keeps the default so images never become data URIs.
      assetsInlineLimit: (filePath, content) =>
        filePath.endsWith('.css') ? content.length < 16384 : undefined
    }
  },
  build: {
    // "auto" inlines small per-page stylesheets into the HTML (killing their
    // render-blocking request) while big shared sheets stay external and
    // browser-cached across pages. Was "never" — Lighthouse flagged the two
    // small sheets as render-blocking (Aug 2026).
    inlineStylesheets: "auto"
  },
  compressHTML: true
});
