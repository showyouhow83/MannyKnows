import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

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
    // Retired /products ("Projects") — every entry was a draft, so the index
    // rendered an empty catalogue with no inbound links. Folded into /services,
    // which already covers one-time vs monthly work.
    '/products': '/services/',
  },
  // Astro's built-in origin check rejects cross-origin form POSTs (CSRF guard).
  // That blocks legitimate inbound webhooks like Twilio's status callback, which
  // POST application/x-www-form-urlencoded from Twilio's servers. Our own routes
  // don't rely on it — they receive JSON and enforce token-based CSRFProtection
  // themselves — and the webhook authenticates via the Twilio signature. So it's
  // safe to turn off here.
  security: { checkOrigin: false },
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
        !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    })
  ],
  vite: {
    ssr: {
      external: ['node:fs/promises']
    },
    build: {
      cssCodeSplit: true
    }
  },
  build: {
    inlineStylesheets: "never"
  },
  compressHTML: true
});
