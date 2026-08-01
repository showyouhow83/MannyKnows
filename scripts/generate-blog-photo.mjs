#!/usr/bin/env node
/**
 * Generate a photographic blog banner with the Gemini API, then build the
 * responsive derivatives the post template expects.
 *
 *   node scripts/generate-blog-photo.mjs <slug> [--prompt "..."] [--model ...]
 *                                        [--variants 3] [--no-derivatives] [--dry-run]
 *
 * The key is read from GEMINI_API_KEY, falling back to .dev.vars (gitignored).
 * Get one free at https://aistudio.google.com/apikey — never paste it into chat
 * or a committed file.
 *
 * Masters land in .blog-image-masters/ (gitignored) so a bad take can be
 * discarded without touching public/. Derivatives are written straight to
 * public/blog/<slug>.{jpg,avif,webp} — the same set the other banners ship.
 *
 * Generating several variants at once is the point: photographic prompts are a
 * dice roll, and picking the best of three beats re-running one at a time.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { buildPrompt } from './blog-photo-prompts.mjs';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DEFAULT_MODEL = 'gemini-3.1-flash-image';
const MASTERS = '.blog-image-masters';
const OUT_DIR = 'public/blog';

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

if (!slug) {
  console.error('usage: node scripts/generate-blog-photo.mjs <slug> [--prompt "..."] [--variants 3]');
  process.exit(1);
}

async function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (existsSync('.dev.vars')) {
    const m = (await readFile('.dev.vars', 'utf8')).match(/^\s*GEMINI_API_KEY\s*=\s*"?([^"\n]+)"?/m);
    if (m) return m[1].trim();
  }
  console.error(
    'No GEMINI_API_KEY found.\n' +
      '  1. Create a key at https://aistudio.google.com/apikey\n' +
      '  2. Add this line to .dev.vars (already gitignored):\n' +
      '       GEMINI_API_KEY="your-key-here"\n'
  );
  process.exit(1);
}

const prompt = flag('prompt') ?? buildPrompt(slug);
const model = flag('model', DEFAULT_MODEL);
const variants = Number(flag('variants', '1')) || 1;

// Sizing economics (gemini-3.1-flash-image, July 2026): 512px $0.045,
// 1K $0.067, 2K $0.101, 4K $0.151 per image.
//
// 2K is the floor for a real banner — we deliver at 1280px wide, so 1K would
// upscale. Draft sizes are NOT a preview: there is no seed, so a 512px draft
// and a 2K final from the same prompt are different photographs. Use --size
// 512px only to test whether a NEW prompt direction behaves (logos creeping
// in, AI sheen, wrong composition) when several rounds are likely; otherwise
// generate 2K finals directly and use --variants to pick.
const size = flag('size', '2K');

if (has('dry-run')) {
  console.log(`model:  ${model}\nslug:   ${slug}\nprompt: ${prompt}`);
  process.exit(0);
}

const key = await apiKey();
await mkdir(MASTERS, { recursive: true });

async function generate(n) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      model,
      input: [{ type: 'text', text: prompt }],
      response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: '16:9', image_size: size },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  // The interactions API returns a steps[] transcript: a "thought" step, then a
  // "model_output" step whose content[] carries the image as base64 `data`.
  // (Older docs describe output_image.data — kept as a fallback.)
  const outputs = (body?.steps ?? []).filter((s) => s.type === 'model_output');
  const part = outputs
    .flatMap((s) => (Array.isArray(s.content) ? s.content : [s.content]))
    .find((c) => c?.type === 'image' && c?.data);
  const b64 = part?.data ?? body?.output_image?.data;
  if (!b64) {
    const refusal = outputs.flatMap((s) => (Array.isArray(s.content) ? s.content : [s.content])).find((c) => c?.text)?.text;
    throw new Error(refusal ? `Model returned text, not an image: ${refusal.slice(0, 200)}` : `No image in response: ${JSON.stringify(body).slice(0, 300)}`);
  }
  const file = `${MASTERS}/${slug}${variants > 1 ? `-v${n}` : ''}.jpg`;
  await writeFile(file, Buffer.from(b64, 'base64'));
  const { width, height } = await sharp(file).metadata();
  console.log(`  ✓ ${file}  ${width}x${height}`);
  return file;
}

const files = [];
for (let n = 1; n <= variants; n++) files.push(await generate(n));

// One variant and derivatives wanted → publish it. Several variants → stop and
// let a human (or Claude) look first, then rerun with --prompt on the winner.
if (variants === 1 && !has('no-derivatives')) {
  const src = files[0];
  const { width: w, height: h } = await sharp(src).metadata();
  const cw = Math.min(w, Math.round((h * 16) / 9));
  const ch = Math.round((cw * 9) / 16);
  const top = Math.max(0, Math.round((h - ch) / 2));
  const base = sharp(src).extract({ left: 0, top, width: cw, height: ch });
  const out = `${OUT_DIR}/${slug}`;
  await mkdir(OUT_DIR, { recursive: true });
  await base.clone().resize(1280).jpeg({ quality: 76, mozjpeg: true }).toFile(`${out}.jpg`);
  await base.clone().resize(1280).avif({ quality: 52 }).toFile(`${out}.avif`);
  await base.clone().resize(1280).webp({ quality: 70 }).toFile(`${out}.webp`);
  console.log(`  ✓ derivatives → ${out}.{jpg,avif,webp}`);
  console.log(`  next: add  image: "/blog/${slug}.jpg"  to the post frontmatter`);
} else if (variants > 1) {
  console.log(`\n  ${variants} variants written to ${MASTERS}/ — pick one, then rerun with --variants 1`);
}
