// Generate responsive screenshot variants for the homepage "Selected Work" grid.
//
// Input:  high-res source PNGs in  src/assets/works/<base>.png
// Output: AVIF + WebP at each width in  public/works/<base>-<width>.<ext>
//
// SelectedWork.astro references these by base name via <picture> (see
// src/data/selectedWork.ts -> `image`). The homepage is server-rendered, so we
// pre-generate here instead of using astro:assets (which only optimizes images
// on prerendered pages under the Cloudflare `compile` image service).
//
// Usage:  node scripts/optimize-work-images.mjs
import sharp from 'sharp';
import { statSync } from 'node:fs';

const srcDir = './src/assets/works/';
const outDir = './public/works/';
const bases = ['slpainting-desktop', 'cherry-vibes-d', 'vl-d', 'enVictoria-d'];
const widths = [400, 640, 960, 1280];
const kb = (b) => (b / 1024).toFixed(0) + ' KB';

let total = 0;
for (const base of bases) {
  const src = srcDir + base + '.png';
  const meta = await sharp(src).metadata();
  const parts = [];
  for (const w of widths) {
    if (w > meta.width) continue; // never upscale
    const webp = `${outDir}${base}-${w}.webp`;
    const avif = `${outDir}${base}-${w}.avif`;
    await sharp(src).resize({ width: w }).webp({ quality: 80, effort: 6 }).toFile(webp);
    await sharp(src).resize({ width: w }).avif({ quality: 55, effort: 6 }).toFile(avif);
    const wb = statSync(webp).size, ab = statSync(avif).size;
    total += wb + ab;
    parts.push(`${w}w[webp ${kb(wb)} / avif ${kb(ab)}]`);
  }
  console.log(`${base} (src ${meta.width}x${meta.height}): ${parts.join('  ')}`);
}
console.log(`\nAll variants total: ${kb(total)}`);
