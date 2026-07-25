#!/usr/bin/env node
// Ping IndexNow so Bing, Yandex, Seznam, Naver and Yep re-crawl changed pages.
// Google does NOT participate in IndexNow — it still relies on the sitemap and
// Search Console, both of which are already in place.
//
// The key is public by design: IndexNow verifies ownership by fetching
// https://mannyknows.com/<key>.txt and checking it contains the key. That file
// lives in public/, so it must stay in sync with KEY below.
//
// Usage:
//   node scripts/indexnow.mjs                 submit every URL in the built sitemap
//   node scripts/indexnow.mjs <url> [url...]  submit specific URLs
//   node scripts/indexnow.mjs --dry-run       print what would be submitted
//
// Exits 0 even on a failed submission: a search-engine ping is not worth
// failing a deploy that already succeeded.

import { readFile } from 'node:fs/promises';

const HOST = 'mannyknows.com';
const KEY = '929e9918b1b7839067f13a961180ca1b';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const SITEMAP = 'dist/client/sitemap-0.xml';
const MAX_URLS = 10000; // IndexNow's per-request cap

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const explicit = args.filter((a) => a.startsWith('http'));

async function urlsFromSitemap() {
  const xml = await readFile(SITEMAP, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

const urlList = [...new Set(explicit.length ? explicit : await urlsFromSitemap())]
  .filter((u) => u.includes(HOST))
  .slice(0, MAX_URLS);

if (!urlList.length) {
  console.error('indexnow: no URLs found — nothing submitted');
  process.exit(0);
}

console.log(`indexnow: ${urlList.length} URL(s) for ${HOST}`);
if (dryRun) {
  urlList.forEach((u) => console.log(`  ${u}`));
  console.log('indexnow: dry run, nothing submitted');
  process.exit(0);
}

try {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList,
    }),
  });
  // 200 accepted, 202 accepted but key not yet validated.
  if (res.ok) console.log(`indexnow: submitted (HTTP ${res.status})`);
  else console.error(`indexnow: rejected (HTTP ${res.status}) — ${await res.text()}`);
} catch (err) {
  console.error(`indexnow: request failed — ${err.message}`);
}
