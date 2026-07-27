// GET /api/admin/img-proxy?url=<publicImageUrl>
//
// Same-origin image proxy for the annotation editor. The canvas <img> can't
// be exported (toDataURL) if it's loaded cross-origin without CORS headers —
// and the media CDN's cdn-cgi transform doesn't send
// Access-Control-Allow-Origin. Loading the image through this same-origin
// endpoint sidesteps the taint entirely (same-origin images never taint).
//
// It fetches the image SERVER-SIDE (no browser CORS), routing through the
// cdn-cgi transform so HEIC originals are transcoded to JPEG and huge photos
// are downscaled, then streams the bytes back. SSRF-guarded to our own
// image host. Admin only (cookie sent automatically on the same-origin <img>).

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

export const prerender = false;

// Our own media CDN host (R2 custom domain). Env-overridable so the SSRF
// allowlist follows the deployment instead of a hardcoded domain.
function allowedHosts(env: any): Set<string> {
  return new Set([env?.MEDIA_PUBLIC_HOST || 'images.mannyknows.com']);
}

export const GET: APIRoute = async ({ request, url, locals }) => {
  try {
    // No admin-session check needed here: the annotate *page* already
    // requires admin login (SSR guard). The only security needed is the
    // SSRF guard below — it limits fetches strictly to our own CDN host.
    // (The media CDN is already public; the proxy's only job is server-side
    // HEIC→JPEG transcoding so canvas export works.)

    const raw = url.searchParams.get('url') || '';
    if (!raw) return new Response('url required', { status: 400 });

    let target: URL;
    try { target = new URL(raw); } catch { return new Response('bad url', { status: 400 }); }
    // SSRF guard — only our own image host, only http(s).
    const env = cfEnv;
    if (!allowedHosts(env).has(target.hostname) || !/^https?:$/.test(target.protocol)) {
      return new Response('forbidden host', { status: 403 });
    }
    // Use Cloudflare's native cf.image fetch option instead of the cdn-cgi
    // transform URL. When the Worker makes a fetch with cf.image, Cloudflare
    // performs the image transform at the edge as an internal operation —
    // this bypasses Bot Management challenges (which apply to public CDN
    // requests). This is the reliable path for HEIC→JPEG conversion.
    // Strip any existing cdn-cgi path so we always work from the raw R2 URL.
    let rawUrl = target.toString();
    if (target.pathname.startsWith('/cdn-cgi/image/')) {
      // Extract the actual R2 path from the cdn-cgi transform URL.
      const match = target.pathname.match(/^\/cdn-cgi\/image\/[^/]+(\/.+)$/);
      rawUrl = match ? `${target.origin}${match[1]}` : rawUrl;
    }

    const upstream = await fetch(rawUrl, {
      headers: { Accept: 'image/*' },
      // @ts-ignore — cf.image is a Workers-specific fetch option
      cf: { image: { width: 2000, fit: 'scale-down', quality: 90, format: 'jpeg' } },
    });
    if (!upstream.ok) {
      // cf.image failed (e.g. non-image file, Worker plan restriction).
      // Fall back to fetching the raw bytes; the browser can at least
      // display JPEG/PNG/WebP without any conversion.
      const rawRes = await fetch(rawUrl, { headers: { Accept: 'image/*' } });
      if (!rawRes.ok) return new Response('upstream error', { status: 502 });
      return streamImage(rawRes);
    }
    return streamImage(upstream);
  } catch (e) {
    console.error('[img-proxy] error:', e);
    return new Response('proxy error', { status: 500 });
  }
};

async function streamImage(res: Response): Promise<Response> {
  const buf = await res.arrayBuffer();
  const ct = res.headers.get('content-type') || 'image/jpeg';
  return new Response(buf, {
    status: 200,
    headers: {
      'content-type': ct,
      // Same-origin to the annotate page, but send permissive CORS anyway so
      // a CORS-mode <img> load (if one ever happens) can't fail. no-store so
      // a non-CORS cached copy can't poison a later CORS request.
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
      'vary': 'Origin',
    },
  });
}
