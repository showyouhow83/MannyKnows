// POST /api/admin/partners/logo-upload — upload a partner logo image to R2,
// return its public URL (admin saves it into partners.logo_url).
// Admin-authed (no Origin allowlist, so it works on preview + prod). Raw image
// bytes in the body; filename + partner id in headers.
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import { publicUrlForR2Path } from '../../../../lib/publicUrl';

const MAX = 5 * 1024 * 1024; // 5MB
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return j({ success: false, error: 'Unauthorized' }, 401);

    const bucket = env?.MK_MEDIA_BUCKET;
    if (!bucket) return j({ success: false, error: 'Storage not configured' }, 503);

    const contentType = (request.headers.get('Content-Type') || '').split(';')[0].trim();
    if (!OK_TYPES.includes(contentType)) return j({ success: false, error: 'Only image files (PNG, JPG, WEBP, GIF, SVG) are allowed' }, 400);

    const data = await request.arrayBuffer();
    if (!data || data.byteLength === 0) return j({ success: false, error: 'Empty file' }, 400);
    if (data.byteLength > MAX) return j({ success: false, error: 'Logo too large (max 5MB)' }, 413);

    const partnerId = (request.headers.get('X-Partner-Id') || 'x').replace(/[^0-9]/g, '') || 'x';
    const ext = contentType === 'image/svg+xml' ? 'svg'
      : contentType === 'image/jpeg' ? 'jpg'
      : contentType.split('/')[1] || 'png';
    const r2Path = `partner-logos/${partnerId}-${Date.now()}.${ext}`;

    // SVGs can carry <script>/on*-handlers → stored XSS if opened directly on
    // images.mannyknows.com. Sanitize the markup AND serve it as an attachment
    // (blocks script execution on direct navigation; <img>/CSS logo display,
    // which never runs SVG scripts, is unaffected).
    let putData: ArrayBuffer | Uint8Array = data;
    let disposition = 'inline';
    if (contentType === 'image/svg+xml') {
      const svg = new TextDecoder().decode(data)
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
        .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/(href|xlink:href)\s*=\s*(["']?)\s*javascript:[^"'>\s]*/gi, '$1=$2#');
      putData = new TextEncoder().encode(svg);
      disposition = 'attachment';
    }

    await bucket.put(r2Path, putData, {
      httpMetadata: { contentType, contentDisposition: disposition },
    });

    return j({ success: true, url: publicUrlForR2Path(r2Path, request) });
  } catch (e) {
    console.error('[partner logo-upload] failed:', e);
    return j({ success: false, error: 'Upload failed' }, 500);
  }
};
