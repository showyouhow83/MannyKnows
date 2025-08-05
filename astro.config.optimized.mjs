import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [
    tailwind({
      // Apply base styles and components
      applyBaseStyles: false, // Disable default base styles to reduce CSS
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
