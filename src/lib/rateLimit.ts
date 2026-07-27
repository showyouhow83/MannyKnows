// KV-backed rate limiter. Cloudflare Workers run many short-lived, distributed
// isolates with no shared memory, so an in-memory Map counter (per isolate) is
// trivially bypassed. This uses KV so the counter is GLOBAL across isolates.
//
// Fixed-window counter. Returns true when the request is ALLOWED. Fails OPEN if
// KV is missing or errors — we never lock out real users over an infra hiccup.

interface KVLike {
  get(key: string, type: 'json'): Promise<any>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

export async function kvRateLimit(
  kv: KVLike | undefined,
  id: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  if (!kv) return true;
  const key = `rl:${id}`;
  try {
    const rec = (await kv.get(key, 'json')) as { c: number; r: number } | null;
    const now = Date.now();
    if (!rec || now >= rec.r) {
      await kv.put(key, JSON.stringify({ c: 1, r: now + windowSec * 1000 }), { expirationTtl: windowSec });
      return true;
    }
    if (rec.c >= limit) return false;
    await kv.put(key, JSON.stringify({ c: rec.c + 1, r: rec.r }), {
      expirationTtl: Math.max(1, Math.ceil((rec.r - now) / 1000)),
    });
    return true;
  } catch {
    return true; // fail open
  }
}

// Convenience: extract the client IP from a Cloudflare request.
export function clientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}
