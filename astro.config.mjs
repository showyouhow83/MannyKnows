// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import compress from 'astro-compress';

// https://astro.build/config
export default defineConfig({
  site: 'https://mannyknows.com',
  output: 'static',
  integrations: [
    tailwind(),
    compress({
      CSS: true,
      HTML: true,
      Image: true,
      JavaScript: true,
      SVG: true
    })
  ],
  build: {
    // Enable compression and minification
    inlineStylesheets: 'auto',
    // Remove unused CSS
    assets: '_astro'
  },
  vite: {
    build: {
      // Enable minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,  // Remove console.log in production
          drop_debugger: true, // Remove debugger statements
          pure_funcs: ['console.log', 'console.warn', 'console.error'] // Remove logging
        }
      },
      // Enable CSS minification
      cssMinify: true,
      // Optimize bundle splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Only keep essential chunks
            'settings': ['src/components/SettingsModal.astro']
          }
        },
        external: (id) => id.includes('._') || id.includes('.DS_Store')
      }
    },
    // Optimize assets
    assetsInclude: ['**/*.svg']
  }
});
