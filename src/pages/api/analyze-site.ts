// POST /api/analyze-site { url } → instant first-pass website analysis.
// Fetches ONE page of the target site (plus /llms.txt), runs the pure
// heuristics in src/lib/site-analyzer.ts, and maps every gap to the
// MannyKnows service that fixes it. Rate-limited per IP and cached per host
// so we neither get abused nor hammer anyone's site.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { analyzeHtml, analyzeRobots } from '../../lib/site-analyzer';

// Generous cap: a chat widget's markup often sits at the very end of the
// document, and truncating it produced a false 'nothing answers visitors'.
const MAX_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 12_000;
const RL_MAX_PER_HOUR = 8;
const CACHE_TTL_S = 1800;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// SSRF guard: public https hosts only — no IP literals, no localhost-ish
// names, no ports, no credentials.
function normalizeTarget(raw: string): URL | null {
  let s = (raw || '').trim();
  if (!s || s.length > 300) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u: URL;
  try { u = new URL(s); } catch { return null; }
  if (u.username || u.password || u.port) return null;
  u.protocol = 'https:';
  const host = u.hostname.toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) return null; // requires a dot, letters/digits/hyphens only
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null; // IPv4 literal
  if (host.includes(':')) return null; // IPv6 literal
  if (/(^|\.)(localhost|local|internal|lan|home|corp|test|invalid)$/.test(host)) return null;
  u.hash = '';
  return u;
}

async function fetchCapped(url: string, accept: string): Promise<{ status: number; body: string; finalUrl: string; truncated: boolean } | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MannyKnowsAnalyzer/1.0; +https://mannyknows.com/free-ai-website-analysis/)',
        Accept: accept,
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      },
    });
    const reader = res.body?.getReader();
    if (!reader) return { status: res.status, body: '', finalUrl: res.url, truncated: false };
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    const merged = new Uint8Array(Math.min(total, MAX_BYTES));
    let off = 0;
    for (const ch of chunks) {
      const slice = ch.subarray(0, Math.min(ch.byteLength, merged.length - off));
      merged.set(slice, off);
      off += slice.byteLength;
      if (off >= merged.length) break;
    }
    return { status: res.status, body: new TextDecoder('utf-8', { fatal: false }).decode(merged), finalUrl: res.url, truncated: total >= MAX_BYTES };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Every scan is a lead: store it in KV (no TTL — leads are the point of the
// tool) and notify the owner with the score so the follow-up writes itself.
// Deduped per email+site per day so a re-scan doesn't spam the inbox, and
// never allowed to fail the scan — lead plumbing errors are swallowed.
async function captureLead(
  kv: KVNamespace | undefined,
  email: string,
  host: string,
  url: string,
  ip: string,
  result: { overall?: number; grade?: string } | null,
  note: string,
) {
  const at = new Date().toISOString();
  try {
    if (kv) await kv.put(`scan_lead:${at}:${host}:${email}`, JSON.stringify({ email, host, url, ip, at, overall: result?.overall ?? null, grade: result?.grade ?? null, note }));
  } catch { /* ignore */ }
  const pillars: Array<{ name: string; score: number }> = Array.isArray((result as any)?.pillars)
    ? (result as any).pillars.map((p: any) => ({ name: String(p.name), score: Number(p.score) }))
    : [];
  try {
    // Without KV there is no rate limit and no dedupe — don't send unlimited
    // notification emails in that degraded mode.
    if (!kv) return;
    const noteKey = `scan_lead_note:${email}:${host}`;
    if (await kv.get(noteKey)) return;
    const apiKey = env?.RESEND_API_KEY;
    if (!apiKey) return;
    const from = env?.RESEND_FROM || 'MannyKnows <onboarding@resend.dev>';
    const to = env?.OWNER_EMAIL || 'mm@mannyknows.com';
    const scoreLine = result?.overall != null ? `${result.overall}/100 — ${result.grade}` : note;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `Scanner lead: ${email} scanned ${host}${result?.overall != null ? ` (${result.overall}/100)` : ''}`,
        html: `
<div style="max-width: 640px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #0071e3 0%, #8b5cf6 55%, #ff4faa 100%); padding: 28px 24px; text-align: center;">
    <span style="font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">MannyKnows</span>
    <div style="margin-top: 6px;"><span style="display: inline-block; background: rgba(255,255,255,0.18); color: #ffffff; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; letter-spacing: 1px;">SCANNER LEAD</span></div>
  </div>
  <div style="padding: 28px 24px;">
    <p style="margin: 0 0 6px; font-size: 15px; color: #475569;"><a href="mailto:${email}" style="color: #0071e3; font-weight: 700; text-decoration: none;">${email}</a> scanned</p>
    <p style="margin: 0 0 18px; font-size: 20px; font-weight: 700;"><a href="${url}" style="color: #1e293b; text-decoration: none;">${host}</a></p>
    <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 18px;">
      <p style="margin: 0; font-size: 34px; font-weight: 800; color: #1e293b;">${result?.overall != null ? `${result.overall}<span style=\"font-size:16px; color:#94a3b8;\">/100</span>` : '—'}</p>
      <p style="margin: 4px 0 0; font-size: 14px; color: #475569;">${scoreLine}</p>
    </div>
    ${pillars.length ? `<table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">${pillars.map((p) => `<tr><td style=\"padding: 6px 0; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;\">${p.name}</td><td style=\"padding: 6px 0; font-size: 13px; font-weight: 700; text-align: right; border-bottom: 1px solid #f1f5f9; color: ${p.score >= 80 ? '#15803d' : p.score >= 50 ? '#b45309' : '#b91c1c'};\">${p.score}</td></tr>`).join('')}</table>` : ''}
    <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #0071e3, #ff4faa); color: #ffffff; padding: 12px 26px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none;">Reply to ${email.split('@')[0]}</a>
    <p style="margin: 14px 0 0; font-size: 12px; color: #94a3b8;">Replying to this email reaches the lead directly (reply-to is set).</p>
  </div>
  <div style="background: #0f172a; padding: 16px 24px; text-align: center;">
    <span style="font-size: 12px; color: rgba(255,255,255,0.65);">mannyknows.com · (413) 361-8451 · scanner lead notification</span>
  </div>
</div>`,
      }),
      signal: AbortSignal.timeout(6000),
    }).then((r) => {
      // Burn the daily marker only when Resend accepted the send, so a
      // transient failure retries on the next scan instead of going silent.
      if (r.ok) return kv.put(noteKey, '1', { expirationTtl: 86400 });
    });
  } catch { /* never block the scan on lead plumbing */ }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let payload: { url?: string; email?: string };
  try { payload = await request.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }

  const email = (typeof payload?.email === 'string' ? payload.email : '').trim().toLowerCase();
  if (!email || email.length > 254 || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
    return json({ ok: false, error: 'Add your email to run the free scan — it takes the same two seconds.' }, 400);
  }

  const target = normalizeTarget(typeof payload?.url === 'string' ? payload.url : '');
  if (!target) return json({ ok: false, error: "That doesn't look like a public website address. Try something like yourbusiness.com." }, 400);

  // Don't scan ourselves into a loop.
  if (/(^|\.)mannyknows\.com$/.test(target.hostname)) {
    return json({ ok: false, error: 'Nice try — we like this site too. Enter your business website.' }, 400);
  }

  const kv = env?.MK_KV_CHATBOT;
  const ip = clientAddress || request.headers.get('cf-connecting-ip') || 'unknown';

  if (kv) {
    // Fail open on KV hiccups: KV allows 1 write/sec/key, so two same-second
    // scans from one IP would otherwise turn the limiter itself into a 500.
    try {
      const rlKey = `scan_rl:${ip}`;
      const used = parseInt((await kv.get(rlKey)) || '0', 10);
      if (used >= RL_MAX_PER_HOUR) {
        return json({ ok: false, error: "That's a lot of scans in one hour. Give it a rest, or tell us what you're up to at mm@mannyknows.com." }, 429);
      }
      await kv.put(rlKey, String(used + 1), { expirationTtl: 3600 });
    } catch { /* limiter unavailable — let the scan through */ }

    try {
      const cached = await kv.get(`scan_cache:v3:${target.hostname}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        await captureLead(kv, email, target.hostname, target.origin, ip, parsed, 'served from cache');
        return json({ ok: true, cached: true, ...parsed });
      }
    } catch { /* fall through to live scan */ }
  }

  const page = await fetchCapped(target.origin + '/', 'text/html,application/xhtml+xml');
  if (!page) {
    await captureLead(kv, email, target.hostname, target.origin, ip, null, 'site unreachable (timeout/refused)');
    return json({ ok: false, error: "We couldn't reach that site (timeout or connection refused). Double-check the address — or if the site is down, that's finding #1." }, 502);
  }
  if (page.status === 403 || page.status === 503 || /just a moment|cf-chl|challenge-platform/i.test(page.body)) {
    // Still a lead — arguably a warmer one: they wanted the scan and couldn't get it.
    await captureLead(kv, email, target.hostname, target.origin, ip, null, 'site firewall blocked the scanner');
    return json({
      ok: false,
      blocked: true,
      error: "That site's firewall blocks automated visitors, so the instant scan can't see it. A person can — request the free human review below and Manny will do it by hand.",
    }, 200);
  }
  if (page.status >= 400) {
    await captureLead(kv, email, target.hostname, target.origin, ip, null, `site answered HTTP ${page.status}`);
    return json({ ok: false, error: `The site answered with an error (HTTP ${page.status}). If that's your homepage, that's the first thing to fix.` }, 200);
  }
  if (!/<[a-z][\s\S]*>/i.test(page.body)) {
    await captureLead(kv, email, target.hostname, target.origin, ip, null, 'address returned non-HTML');
    return json({ ok: false, error: "That address didn't return a web page we can read." }, 200);
  }

  const [llms, robotsRes] = await Promise.all([
    fetchCapped(target.origin + '/llms.txt', 'text/plain'),
    fetchCapped(target.origin + '/robots.txt', 'text/plain'),
  ]);
  const llmsTxt = !!llms && llms.status === 200 && llms.body.trim().length > 0 && !/<html/i.test(llms.body);
  const robotsTxt = !!robotsRes && robotsRes.status === 200 && !/<html/i.test(robotsRes.body) ? robotsRes.body : null;
  const robots = robotsTxt ? analyzeRobots(robotsTxt) : null;
  let sitemapOk = false;
  if (!robots?.sitemap) {
    const sm = await fetchCapped(target.origin + '/sitemap.xml', 'application/xml,text/xml');
    sitemapOk = !!sm && sm.status === 200 && /<(urlset|sitemapindex)/i.test(sm.body);
  }

  const analysis = analyzeHtml(page.body, { llmsTxt, truncated: page.truncated, robots, sitemapOk });
  const result = {
    url: page.finalUrl || target.origin,
    host: target.hostname,
    fetchedAt: new Date().toISOString(),
    ...analysis,
  };

  if (kv) {
    await kv.put(`scan_cache:v3:${target.hostname}`, JSON.stringify(result), { expirationTtl: CACHE_TTL_S }).catch(() => {});
  }

  await captureLead(kv, email, target.hostname, target.origin, ip, result, 'live scan');

  return json({ ok: true, ...result });
};
