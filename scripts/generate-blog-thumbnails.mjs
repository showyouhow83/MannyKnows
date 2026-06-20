#!/usr/bin/env node
/**
 * Blog thumbnail generator (AI illustrations)
 * ------------------------------------------------------------------
 * For every published blog post that has NO image of its own, this generates a
 * branded illustration with an image model and caches it at:
 *     public/blog/<slug>.png
 * and records the slug in src/data/generated-thumbnails.json so the site knows
 * the file exists. The resolver (src/utils/postImage.ts) prefers, in order:
 *     1) frontmatter `image`   2) first image in the body   3) this generated PNG
 *
 * It is IDEMPOTENT: a post is skipped if it already has a frontmatter image, an
 * image in its body, a cached PNG, or is already in the manifest. So it only
 * spends money on posts that actually need a thumbnail. Run it whenever you add
 * a post, then commit the new PNG(s) + the manifest:
 *
 *     OPENAI_API_KEY=sk-... npm run blog:thumbs
 *
 * Flags:
 *     --force      regenerate even if a thumbnail already exists
 *     --dry-run    print the prompts and what would be generated; no API calls
 *
 * Config via env (sensible defaults):
 *     THUMB_MODEL    default "gpt-image-1"
 *     THUMB_SIZE     default "1536x1024"  (landscape; cards crop to fit)
 *     THUMB_QUALITY  default "medium"     (low | medium | high)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const BLOG_DIR = resolve(ROOT, 'src/content/blog');
const OUT_DIR = resolve(ROOT, 'public/blog');
const MANIFEST = resolve(ROOT, 'src/data/generated-thumbnails.json');

const MODEL = process.env.THUMB_MODEL || 'gpt-image-1';
const SIZE = process.env.THUMB_SIZE || '1536x1024';
const QUALITY = process.env.THUMB_QUALITY || 'medium';
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

/** Load OPENAI_API_KEY from the environment, falling back to .dev.vars. */
function loadApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const devVars = resolve(ROOT, '.dev.vars');
  if (existsSync(devVars)) {
    const line = readFileSync(devVars, 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith('OPENAI_API_KEY='));
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

async function generateImage(apiKey, prompt) {
  const payload = { model: MODEL, prompt, size: SIZE, n: 1 };
  if (MODEL.startsWith('gpt-image')) {
    payload.quality = QUALITY;
  } else {
    payload.response_format = 'b64_json';
    if (MODEL === 'dall-e-3') payload.quality = QUALITY === 'high' ? 'hd' : 'standard';
  }

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`);
  }
  const json = await res.json();
  const item = json.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item?.url) {
    const img = await fetch(item.url);
    return Buffer.from(await img.arrayBuffer());
  }
  throw new Error('No image returned by the API.');
}

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

  console.log(`\n${todo.length} post(s) need a thumbnail (model: ${MODEL}, size: ${SIZE}).\n`);

  if (DRY_RUN) {
    for (const t of todo) console.log(`— ${t.slug}\n   ${t.prompt}\n`);
    console.log('Dry run — no images generated.');
    return;
  }

  const apiKey = loadApiKey();
  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY. Set it in your environment or .dev.vars and retry.');
    process.exit(1);
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  for (const t of todo) {
    process.stdout.write(`→ generating ${t.slug} ... `);
    try {
      const buf = await generateImage(apiKey, t.prompt);
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
