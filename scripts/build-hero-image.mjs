// Build the self-hosted hero derivatives for HeroSwiper.
//
// Why this exists: the homepage hero is the LCP element, so it must be
// self-hosted (no third-party request in front of it) and it must not ship a
// multi-megabyte original. Dropping a raw export into public/ and pointing the
// slide at it costs both. This turns one source file into the 16:9 AVIF/WebP
// ladder the component expects at public/hero/<name>-<width>.{avif,webp}, plus
// a single JPEG fallback.
//
//   node scripts/build-hero-image.mjs <source-image> <output-name> [leftTrim]
//
// e.g. node scripts/build-hero-image.mjs ~/Downloads/hero.jpg remi-books-the-job 900
//
// leftTrim crops dead space off the left edge before the 16:9 window is taken —
// useful when the subject sits right of centre. Pass 0 to keep the full frame.
// Delete the source afterwards; it should not live in public/.

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const WIDTHS = [640, 960, 1280, 1600];
const FALLBACK_WIDTH = 1280;
const OUT_DIR = 'public/hero';

const [src, name, leftTrimArg] = process.argv.slice(2);
if (!src || !name) {
  console.error('usage: node scripts/build-hero-image.mjs <source-image> <output-name> [leftTrim]');
  process.exit(1);
}
const leftTrim = Number(leftTrimArg ?? 0) || 0;

const { width: srcW, height: srcH } = await sharp(src).metadata();

// Take the widest 16:9 window available after the left trim, centred vertically.
const width = Math.min(srcW - leftTrim, Math.round(srcH * (16 / 9)));
const height = Math.round((width * 9) / 16);
const top = Math.max(0, Math.round((srcH - height) / 2));

console.log(`source ${srcW}x${srcH} -> crop ${width}x${height} at (${leftTrim}, ${top})`);

await mkdir(OUT_DIR, { recursive: true });
const base = sharp(src).extract({ left: leftTrim, top, width, height });

for (const w of WIDTHS) {
  await base.clone().resize(w).avif({ quality: 52 }).toFile(`${OUT_DIR}/${name}-${w}.avif`);
  await base.clone().resize(w).webp({ quality: 70 }).toFile(`${OUT_DIR}/${name}-${w}.webp`);
}
await base
  .clone()
  .resize(FALLBACK_WIDTH)
  .jpeg({ quality: 74, mozjpeg: true })
  .toFile(`${OUT_DIR}/${name}-${FALLBACK_WIDTH}.jpg`);

console.log(`wrote ${WIDTHS.length * 2 + 1} files to ${OUT_DIR}/ as ${name}-*`);
console.log(`point the slide at: image: '/hero/${name}'`);
