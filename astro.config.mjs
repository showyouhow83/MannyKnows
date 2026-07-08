import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// Tailwind runs via PostCSS (postcss.config.js) — no Astro integration needed.
export default defineConfig({
  site: 'https://mannyknows.com',
  output: 'server', // Server mode for API routes
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
