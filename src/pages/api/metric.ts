// First-party conversion counters — the yardstick for copy changes.
// POST {e, p} counts an event (per day sitewide + per day per page) into KV.
// GET ?k=<ADMIN_KEY>&days=30 reads them back. No cookies, no vendors, no
// per-visitor anything: the question this answers is "did submits-per-view
// move after the copy changed", not "who was here".
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const EVENTS = new Set(['view', 'quote_open', 'quote_submit', 'call_click', 'scan_run', 'cta']);
const TTL_S = 90 * 86400; // 90 days of history

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

const today = () => new Date().toISOString().slice(0, 10);

export const POST: APIRoute = async ({ request }) => {
  const kv = (env as any)?.MK_KV_CHATBOT as KVNamespace | undefined;
  if (!kv) return json({ ok: true });
  let b: any;
  try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  const e = String(b?.e || '');
  if (!EVENTS.has(e)) return json({ ok: false }, 400);
  let p = String(b?.p || '/').slice(0, 100).replace(/[?#].*$/, '');
  if (!p.startsWith('/')) p = '/';
  // cta events carry a label ("/page|button text") instead of a bare path.
  if (e === 'cta') p = String(b?.l || 'unlabeled').slice(0, 90).replace(/[\n\r]/g, ' ');
  const d = today();
  // Read-increment-write loses a count on same-second collisions; fine —
  // these are trend lines, not accounting.
  for (const key of [`metric:${d}:${e}`, `metric:${d}:${e}:${p}`]) {
    try {
      const cur = parseInt((await kv.get(key)) || '0', 10);
      await kv.put(key, String(cur + 1), { expirationTtl: TTL_S });
    } catch { /* never fail a page over analytics */ }
  }
  return json({ ok: true });
};

export const GET: APIRoute = async ({ url }) => {
  const kv = (env as any)?.MK_KV_CHATBOT as KVNamespace | undefined;
  const k = url.searchParams.get('k') || '';
  const keysOk = [ (env as any)?.ADMIN_KEY, (env as any)?.ADMIN_API_KEY ].filter(Boolean);
  if (!kv || !k || !keysOk.includes(k)) return json({ ok: false }, 403);

  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10) || 30));
  const cutoff = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);

  const names: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: 'metric:', cursor });
    for (const it of page.keys) names.push(it.name);
    cursor = page.list_complete ? undefined : (page as any).cursor;
  } while (cursor);

  const events: Record<string, { total: number; byDay: Record<string, number>; byPage: Record<string, number> }> = {};
  for (const name of names) {
    const parts = name.split(':'); // metric : date : event [: /path]
    const d = parts[1], e = parts[2], p = parts.slice(3).join(':');
    if (!d || !e || d < cutoff) continue;
    const n = parseInt((await kv.get(name)) || '0', 10);
    if (!n) continue;
    const ev = (events[e] ||= { total: 0, byDay: {}, byPage: {} });
    if (p) ev.byPage[p] = (ev.byPage[p] || 0) + n;
    else { ev.total += n; ev.byDay[d] = n; }
  }
  return json({ ok: true, since: cutoff, days, events });
};
