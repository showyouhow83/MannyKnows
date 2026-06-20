#!/usr/bin/env node
/**
 * Blog thumbnail generator (AI illustrations)
 * ------------------------------------------------------------------
 * For every published blog post that has NO image of its own, this generates a
 * branded illustration and caches it at:
 *     public/blog/<slug>.png
 * and records the slug in src/data/generated-thumbnails.json so the site knows
 * the file exists. The resolver (src/utils/postImage.ts) prefers, in order:
 *     1) frontmatter `image`   2) first image in the body   3) this generated PNG
 *
 * PROVIDERS — Gemini (default when GEMINI_API_KEY is set) or OpenAI:
 *     GEMINI_API_KEY=...  npm run blog:thumbs          # Google Gemini / Imagen
 *     OPENAI_API_KEY=sk-... THUMB_PROVIDER=openai npm run blog:thumbs
 * The key is read from the environment, falling back to .dev.vars.
 *
 * It is IDEMPOTENT: a post is skipped if it already has a frontmatter image, an
 * image in its body, a cached PNG, or is already in the manifest — so it only
 * spends money on posts that actually need a thumbnail. Run it whenever you add
 * a post, then commit the new PNG(s) + the manifest.
 *
 * Flags:
 *     --force      regenerate even if a thumbnail already exists
 *     --dry-run    print the prompts and what would be generated; no API calls
 *
 * Config via env (sensible defaults):
 *     THUMB_PROVIDER     "gemini" | "openai"  (auto: gemini if GEMINI_API_KEY set)
 *   Gemini:
 *     GEMINI_IMAGE_MODEL default "gemini-2.5-flash-image" (Nano Banana). Set an
 *                        "imagen-*" model (e.g. imagen-4.0-generate-001) for
 *                        native aspect-ratio control / higher fidelity.
 *     GEMINI_ASPECT      default "16:9" (only applied for imagen-* models)
 *   OpenAI:
 *     THUMB_MODEL        default "gpt-image-1"
 *     THUMB_SIZE         default "1536x1024"
 *     THUMB_QUALITY      default "medium"  (low | medium | high)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const BLOG_DIR = resolve(ROOT, 'src/content/blog');
const OUT_DIR = resolve(ROOT, 'public/blog');
const MANIFEST = resolve(ROOT, 'src/data/generated-thumbnails.json');

// Provider: explicit THUMB_PROVIDER, else auto — Gemini if its key is set, else OpenAI.
const PROVIDER = (process.env.THUMB_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : 'openai')).toLowerCase();

// Gemini knobs
const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const GEMINI_ASPECT = process.env.GEMINI_ASPECT || '16:9';

// OpenAI knobs
const OPENAI_MODEL = process.env.THUMB_MODEL || 'gpt-image-1';
const OPENAI_SIZE = process.env.THUMB_SIZE || '1536x1024';
const OPENAI_QUALITY = process.env.THUMB_QUALITY || 'medium';

const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

// --- helpers ---------------------------------------------------------------

/** Minimal frontmatter parser (handles the simple YAML these posts use). */
function parsePost(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawVal] = kv;
    const val = rawVal.trim();
    if (key === 'tags') {
      const arr = val.match(/\[(.*)\]/);
      data.tags = arr
        ? arr[1].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
        : [];
    } else {
      data[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return { data, body: m[2] || '' };
}

const hasBodyImage = (body) => /!\[[^\]]*\]\([^)]+\)/.test(body);

/** Load a key from the environment, falling back to .dev.vars. */
function loadKey(name) {
  if (process.env[name]) return process.env[name];
  const devVars = resolve(ROOT, '.dev.vars');
  if (existsSync(devVars)) {
    const line = readFileSync(devVars, 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith(`${name}=`));
    if (line) return line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
  return undefined;
}

function buildPrompt({ title, description, tags }) {
  const topic = tags?.length ? tags.join(', ') : 'small business technology';
  return [
    `Editorial illustration for a blog article titled "${title}".`,
    `Topic: ${topic}.`,
    description ? `Context: ${description}` : '',
    'Style: modern flat vector illustration, clean and professional, abstract business/technology theme,',
    'a blue-to-magenta gradient accent palette (from #0071e3 to #ff4faa), soft geometric shapes, generous negative space,',
    'subtle depth. Wide 16:9 banner composition. Absolutely no text, no words, no letters, no logos.',
  ]
    .filter(Boolean)
    .join(' ');
}

// --- providers -------------------------------------------------------------

async function generateOpenAI(apiKey, prompt) {
  const payload = { model: OPENAI_MODEL, prompt, size: OPENAI_SIZE, n: 1 };
  if (OPENAI_MODEL.startsWith('gpt-image')) {
    payload.quality = OPENAI_QUALITY;
  } else {
    payload.response_format = 'b64_json';
    if (OPENAI_MODEL === 'dall-e-3') payload.quality = OPENAI_QUALITY === 'high' ? 'hd' : 'standard';
  }
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const item = (await res.json()).data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item?.url) return Buffer.from(await (await fetch(item.url)).arrayBuffer());
  throw new Error('No image returned by OpenAI.');
}

async function generateGemini(apiKey, prompt) {
  const base = 'https://generativelanguage.googleapis.com/v1beta/models';
  const headers = { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey };

  // Imagen models use the predict endpoint with native aspect-ratio control.
  if (GEMINI_MODEL.startsWith('imagen')) {
    const res = await fetch(`${base}/${GEMINI_MODEL}:predict`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: GEMINI_ASPECT },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 400)}`);
    const b64 = (await res.json()).predictions?.[0]?.bytesBase64Encoded;
    if (b64) return Buffer.from(b64, 'base64');
    throw new Error('No image returned by Imagen.');
  }

  // Native Gemini image generation (generateContent). Cards crop to fit, so a
  // square render is fine; the prompt still asks for a 16:9 composition.
  const res = await fetch(`${base}/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const parts = (await res.json()).candidates?.[0]?.content?.parts || [];
  const b64 = parts.map((p) => p.inlineData?.data || p.inline_data?.data).find(Boolean);
  if (b64) return Buffer.from(b64, 'base64');
  throw new Error('No image returned by Gemini.');
}

const generateImage = (keys, prompt) =>
  PROVIDER === 'gemini' ? generateGemini(keys.gemini, prompt) : generateOpenAI(keys.openai, prompt);

// --- main ------------------------------------------------------------------

async function main() {
  if (!existsSync(BLOG_DIR)) {
    console.error(`No blog directory at ${BLOG_DIR}`);
    process.exit(1);
  }
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : [];
  const generated = new Set(Array.isArray(manifest) ? manifest : []);

  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  const todo = [];
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const { data, body } = parsePost(readFileSync(join(BLOG_DIR, file), 'utf8'));
    if (data.draft === 'true') continue;

    const pngPath = join(OUT_DIR, `${slug}.png`);
    const reason =
      data.image ? 'has frontmatter image'
      : hasBodyImage(body) ? 'has image in body'
      : !FORCE && (existsSync(pngPath) || generated.has(slug)) ? 'already generated'
      : null;

    if (reason) {
      console.log(`• skip  ${slug} (${reason})`);
      continue;
    }
    todo.push({ slug, pngPath, prompt: buildPrompt(data) });
  }

  if (todo.length === 0) {
    console.log('\n✓ Every post already has a thumbnail. Nothing to do.');
    return;
  }

  const modelLabel = PROVIDER === 'gemini' ? GEMINI_MODEL : `${OPENAI_MODEL} ${OPENAI_SIZE}`;
  console.log(`\n${todo.length} post(s) need a thumbnail (provider: ${PROVIDER}, model: ${modelLabel}).\n`);

  if (DRY_RUN) {
    for (const t of todo) console.log(`— ${t.slug}\n   ${t.prompt}\n`);
    console.log('Dry run — no images generated.');
    return;
  }

  const keys = {};
  if (PROVIDER === 'gemini') {
    keys.gemini = loadKey('GEMINI_API_KEY');
    if (!keys.gemini) {
      console.error('Missing GEMINI_API_KEY. Set it in your environment or .dev.vars and retry.');
      process.exit(1);
    }
  } else {
    keys.openai = loadKey('OPENAI_API_KEY');
    if (!keys.openai) {
      console.error('Missing OPENAI_API_KEY. Set it in your environment or .dev.vars and retry.');
      process.exit(1);
    }
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  for (const t of todo) {
    process.stdout.write(`→ generating ${t.slug} ... `);
    try {
      const buf = await generateImage(keys, t.prompt);
      writeFileSync(t.pngPath, buf);
      generated.add(t.slug);
      console.log(`saved public/blog/${t.slug}.png`);
    } catch (err) {
      console.log('FAILED');
      console.error(`   ${err.message}`);
    }
  }

  writeFileSync(MANIFEST, JSON.stringify([...generated].sort(), null, 2) + '\n');
  console.log(`\n✓ Done. Updated ${MANIFEST.replace(ROOT + '/', '')}. Commit the new PNG(s) + manifest.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
