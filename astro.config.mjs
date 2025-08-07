import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Changed to server mode for API routes
  integrations: [
    tailwind({
      // Keep base styles for proper styling
      applyBaseStyles: true,
    })
  ],
  vite: {
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
