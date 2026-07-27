// Resolve an image URL into our Cloudflare Images CDN so the hero slider (and
// any future caller) can apply the same optimized desktop/mobile variants.
//
//   POST /api/admin/cache-image   { url: "https://…" }
//   → { success, image_id, desktop, mobile }
//
// Behavior:
//   • If the URL is ALREADY one of our Cloudflare Images delivery URLs
//     (imagedelivery.net/<our-hash>/<id>/…), we just extract the id — no copy.
//   • Otherwise we copy ("cache") the image into Cloudflare Images via its
//     URL-upload, tagged source=hero-slider, and return the new id's variants.
//
// Admin-only on purpose: uploading arbitrary remote URLs into our CF Images
// account is abuse-sensitive, so it must not live on the public upload route.

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

export const prerender = false;

// Account-specific config (env, no hardcoded ids):
//   CF_ACCOUNT_ID (or CLOUDFLARE_ACCOUNT_ID) — Cloudflare account id
//   CLOUDFLARE_API_TOKEN — API token with Images edit
//   IMAGES_ACCOUNT_HASH — imagedelivery.net delivery hash

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function variants(imageId: string, deliveryHash: string) {
  const base = `https://imagedelivery.net/${deliveryHash}`;
  return {
    image_id: imageId,
    desktop: `${base}/${imageId}/w=1200,q=78,f=auto`,
    mobile: `${base}/${imageId}/w=640,q=65,f=auto`,
  };
}

// If the URL is already a delivery URL on our account, pull the image id out of
// the path: imagedelivery.net/<hash>/<id>/<variant…>
function ourCdnImageId(url: string, deliveryHash: string): string | null {
  const m = url.match(/imagedelivery\.net\/([^/]+)\/([^/?#]+)/);
  if (m && deliveryHash && m[1] === deliveryHash && m[2]) return m[2];
  return null;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    if (!env) return json({ success: false, error: 'Runtime unavailable' }, 503);

    const sessionSecret = env.SESSION_SECRET || env.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return json({ success: false, error: 'Unauthorized' }, 401);

    const body = await request.json() as { url?: string };
    const url = (body.url || '').trim();
    if (!url) return json({ success: false, error: 'A URL is required' }, 400);
    let parsed: URL;
    try { parsed = new URL(url); } catch { return json({ success: false, error: 'Invalid URL' }, 400); }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return json({ success: false, error: 'URL must be http(s)' }, 400);
    }

    // Graceful 503 until the Cloudflare Images env vars are configured.
    const cfToken = env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = env.CF_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID;
    const deliveryHash = env.IMAGES_ACCOUNT_HASH || '';
    if (!cfToken || !cfAccountId || !deliveryHash) {
      return json({ success: false, error: 'Image service not configured (CF_ACCOUNT_ID / CLOUDFLARE_API_TOKEN / IMAGES_ACCOUNT_HASH)' }, 503);
    }

    // Already on our CDN → reuse the id, no copy.
    const existingId = ourCdnImageId(url, deliveryHash);
    if (existingId) return json({ success: true, cached: false, ...variants(existingId, deliveryHash) });

    // Otherwise copy it into Cloudflare Images by URL.
    const form = new FormData();
    form.append('url', url);
    form.append('metadata', JSON.stringify({ source: 'hero-slider', cachedFrom: url, cachedAt: new Date().toISOString() }));

    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/images/v1`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfToken}` },
      body: form,
    });
    const cfData = await cfRes.json() as { success: boolean; errors?: Array<{ message: string }>; result?: { id: string } };
    if (!cfRes.ok || !cfData.success || !cfData.result?.id) {
      const msg = cfData.errors?.[0]?.message || 'Could not fetch that image URL';
      return json({ success: false, error: msg }, 502);
    }
    return json({ success: true, cached: true, ...variants(cfData.result.id, deliveryHash) });
  } catch (e) {
    console.error('[cache-image]', e);
    return json({ success: false, error: 'Failed to cache image' }, 500);
  }
};
