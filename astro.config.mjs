import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Server mode for API routes
  adapter: cloudflare(), // Cloudflare adapter for production
  image: {
    service: {
      entrypoint: 'astro/assets/services/compile'
    }
  },
  integrations: [
    tailwind({
      // Keep base styles for proper styling
      applyBaseStyles: true,
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
