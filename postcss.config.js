// Tailwind 3 runs through PostCSS (the @astrojs/tailwind integration is EOL and
// not compatible with Astro 7). This keeps the exact same Tailwind version +
// config as the old site, so styles are unchanged.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
