import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://mannyknows.com',
  output: 'server', // Server mode for API routes
  adapter: cloudflare({
    imageService: 'compile' // Explicitly set image service for Cloudflare
  }),
  image: {
    service: {
      entrypoint: 'astro/assets/services/compile'
    }
  },
  integrations: [
    tailwind({
      // Keep base styles for proper styling
      applyBaseStyles: true,
    }),
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
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return '_astro/[name].[hash][extname]';
            }
            return '_astro/[name].[hash][extname]';
          }
        }
      }
    },
    css: {
      transformer: 'postcss'
    }
  },
  build: {
    inlineStylesheets: "never"
  },
  compressHTML: true
});
