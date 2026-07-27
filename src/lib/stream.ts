// Cloudflare Stream helpers. Videos that live in Stream are referenced by their
// Stream UID (stored in `stream_uid` columns). Stream auto-generates a tiny
// thumbnail and serves an adaptive player, so the media grids never download the
// original video just to show a poster.
//
// Account-specific values come from the environment (Workers vars / secrets):
//   STREAM_CUSTOMER_SUBDOMAIN  e.g. "customer-abc123.cloudflarestream.com"
//                              (dashboard → Stream → "customer subdomain")
//   CF_ACCOUNT_ID              Cloudflare account id (CLOUDFLARE_ACCOUNT_ID also accepted)
//   CLOUDFLARE_STREAM_TOKEN    API token with Stream edit (CLOUDFLARE_API_TOKEN also accepted)
//
// The URL helpers accept an optional `env` and fall back to process.env
// (populated on Workers via nodejs_compat, and from .env in `astro dev`) so
// existing call sites without an env handle keep working. When the subdomain
// is not configured they return '' — callers render a blank poster instead of
// pointing at another account's subdomain.

function fromEnv(env: any, key: string): string {
  return env?.[key] || (globalThis as any)?.process?.env?.[key] || '';
}

// "customer-abc123.cloudflarestream.com" (accepts a bare "customer-abc123" too).
export function streamSubdomain(env?: any): string {
  const raw = fromEnv(env, 'STREAM_CUSTOMER_SUBDOMAIN').trim();
  if (!raw) return '';
  return raw.includes('.') ? raw : `${raw}.cloudflarestream.com`;
}

// Auto-generated poster frame (small JPG). `time` picks the frame (default 1s).
export function streamThumb(uid: string, time = '1s', env?: any): string {
  const sub = streamSubdomain(env);
  return sub && uid ? `https://${sub}/${uid}/thumbnails/thumbnail.jpg?time=${time}&height=400` : '';
}

// Embeddable adaptive player (works in every browser).
export function streamIframe(uid: string, env?: any): string {
  const sub = streamSubdomain(env);
  return sub && uid ? `https://${sub}/${uid}/iframe` : '';
}

// HLS manifest, if a raw <video>/hls.js player is preferred over the iframe.
export function streamHls(uid: string, env?: any): string {
  const sub = streamSubdomain(env);
  return sub && uid ? `https://${sub}/${uid}/manifest/video.m3u8` : '';
}

const VIDEO_RE = /\.(mp4|mov|webm|m4v)(?:\?|$)/i;

export function isVideoUrl(url: string | null | undefined): boolean {
  return VIDEO_RE.test(url || '');
}

// Ingest a public video URL (e.g. an R2 file we just uploaded) into Cloudflare
// Stream via URL-copy. Returns the new Stream UID immediately (transcode runs
// async server-side) or null on failure OR when Stream isn't configured —
// callers already treat null as "keep the raw video URL".
export async function ingestToStream(url: string, env: any): Promise<string | null> {
  try {
    const token = fromEnv(env, 'CLOUDFLARE_STREAM_TOKEN') || fromEnv(env, 'CLOUDFLARE_API_TOKEN');
    const accountId = fromEnv(env, 'CF_ACCOUNT_ID') || fromEnv(env, 'CLOUDFLARE_ACCOUNT_ID');
    if (!token || !accountId || !url) return null;
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/copy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, meta: { name: url.split('/').pop() } }),
    });
    const j = await res.json() as any;
    return j?.success && j?.result?.uid ? j.result.uid as string : null;
  } catch {
    return null;
  }
}
