// MannyKnows middleware — exists ONLY to serve the ported admin/CRM machinery.
//
// Scope discipline: MannyKnows' public site manages its own CSP (BaseLayout),
// caching, and headers. This middleware must never alter public-page behavior,
// so every branch below is gated to the admin/portal namespaces (or to the
// dedicated media hostname). Anything else falls through to `next()` untouched.
//
// Responsibilities:
//   0. Media host — serve the MK_MEDIA_BUCKET R2 bucket when the request hits
//      the media hostname (default images.mannyknows.com). Range supported.
//   1. /timeclock → /admin/timeclock/ (crew kiosk shortcut; the kiosk page is
//      deliberately NOT auth-gated — crew have no admin session).
//   2. Trailing-slash normalization for /admin GET page requests only.
//   3. Admin auth gate — /admin/* pages redirect to the login page,
//      /api/admin/* returns 401 JSON (login/logout exempt).
//   4. "Not configured yet" 503 for admin surfaces while the D1 binding is
//      absent (resources not created — see SETUP-ADMIN.md).
//   5. Viewer write-guard — a view-only admin session may never hit a write
//      API, enforced once here for every /api/* POST/PUT/PATCH/DELETE.
//   6. /img/* on-the-fly image transforms via the Cloudflare IMAGES binding
//      (falls back to the original image when the binding is missing/fails).
//   7. Security headers + noindex on admin and private token pages only.

import { env as cfEnv } from 'cloudflare:workers';
import { defineMiddleware } from 'astro:middleware';
import { AdminAuth } from './lib/adminAuth';

// Private, token-gated customer pages (quote review, client/crew portals,
// confirmation links, partner crew assignments).
const TOKEN_PAGE = /^\/(confirm|project|quote)(\/|$)/;

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals, redirect } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  const env = cfEnv;

  // ── 0. Media host: serve the R2 bucket directly ──────────────────────────
  const mediaHost = env?.MEDIA_PUBLIC_HOST || 'images.mannyknows.com';
  if (url.hostname === mediaHost && (request.method === 'GET' || request.method === 'HEAD')) {
    const bucket = env?.MK_MEDIA_BUCKET;
    if (!bucket) return new Response('Media storage not configured', { status: 503 });

    const key = decodeURIComponent(path.replace(/^\/+/, ''));
    if (!key) return new Response('Not found', { status: 404 });

    const mediaHeaders = (obj: any, extra: Record<string, string> = {}) => ({
      'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes',
      'ETag': obj.httpEtag,
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      ...extra,
    });

    if (request.method === 'HEAD') {
      const head = await bucket.head(key);
      if (!head) return new Response(null, { status: 404 });
      return new Response(null, {
        status: 200,
        headers: mediaHeaders(head, { 'Content-Length': String(head.size) }),
      });
    }

    // Range support — required for <video> seeking.
    const rangeHeader = request.headers.get('range');
    const rangeMatch = rangeHeader ? /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim()) : null;
    if (rangeMatch && (rangeMatch[1] !== '' || rangeMatch[2] !== '')) {
      const head = await bucket.head(key);
      if (!head) return new Response('Not found', { status: 404 });
      const size = head.size;
      let start: number, end: number;
      if (rangeMatch[1] === '') {
        const n = Math.min(parseInt(rangeMatch[2], 10), size);
        start = size - n;
        end = size - 1;
      } else {
        start = parseInt(rangeMatch[1], 10);
        end = rangeMatch[2] === '' ? size - 1 : Math.min(parseInt(rangeMatch[2], 10), size - 1);
      }
      if (start > end || start >= size) {
        return new Response('Range not satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${size}` },
        });
      }
      const obj = await bucket.get(key, { range: { offset: start, length: end - start + 1 } });
      if (!obj) return new Response('Not found', { status: 404 });
      return new Response(obj.body, {
        status: 206,
        headers: mediaHeaders(obj, {
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Content-Length': String(end - start + 1),
        }),
      });
    }

    const obj = await bucket.get(key);
    if (!obj) return new Response('Not found', { status: 404 });
    return new Response(obj.body, {
      status: 200,
      headers: mediaHeaders(obj, { 'Content-Length': String(obj.size) }),
    });
  }

  // ── 1. Crew kiosk shortcut ───────────────────────────────────────────────
  if (path === '/timeclock' || path === '/timeclock/') {
    return new Response(null, {
      status: 301,
      headers: { 'Location': '/admin/timeclock/' },
    });
  }

  const isAdminNamespace = path.startsWith('/admin');
  const isTokenPage = TOKEN_PAGE.test(path) || path.startsWith('/partners/crew/');

  // ── 2. Trailing-slash normalization (admin pages only) ───────────────────
  // Ported admin pages link both /admin/quotes?new=1 and /admin/quotes/?new=1;
  // give every admin page ONE canonical URL. Deliberately NOT sitewide —
  // MannyKnows' public routing is left exactly as it was.
  if (
    isAdminNamespace &&
    request.method === 'GET' &&
    !path.endsWith('/') &&
    !(path.split('/').pop() || '').includes('.')
  ) {
    return new Response(null, {
      status: 301,
      headers: { 'Location': path + '/' + url.search },
    });
  }

  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

  // ── 3. Admin auth gate ───────────────────────────────────────────────────
  // /admin/timeclock is the crew punch-in kiosk — crew have no admin session,
  // the page identifies them by name + phone. Everything else under /admin is
  // gated (the bare /admin path is the login page itself).
  const isAdminPage = isAdminNamespace && path !== '/admin' && path !== '/admin/' &&
    !path.startsWith('/admin/timeclock');
  const isAdminApi = path.startsWith('/api/admin') &&
    !path.startsWith('/api/admin/login') &&
    !path.startsWith('/api/admin/logout');

  if (isAdminPage || isAdminApi) {
    const session = await AdminAuth.validateSession(request, sessionSecret);

    if (!session.isAuthenticated) {
      if (isAdminApi) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return redirect('/admin');
    }

    // ── 4. Admin database not provisioned yet ────────────────────────────
    // Login works on env-var credentials alone, but every admin surface needs
    // D1. Until MK_APP_DB is bound (see SETUP-ADMIN.md), explain instead of
    // throwing 500s from every page.
    if (!env?.MK_APP_DB) {
      if (isAdminApi) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Admin database not configured yet — create the MK_APP_DB D1 binding (see SETUP-ADMIN.md).',
        }), { status: 503, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Admin not configured</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:560px;margin:12vh auto;padding:0 20px;color:#1c1d22}code{background:#f2f3f7;border-radius:6px;padding:2px 6px;font-size:14px}h1{font-size:22px}</style></head><body><h1>You're logged in — the admin database isn't created yet</h1><p>The admin code is deployed, but its D1 database binding (<code>MK_APP_DB</code>) doesn't exist on this Worker.</p><p>Run the steps in <code>SETUP-ADMIN.md</code> (create the D1 database, paste its id into <code>wrangler.jsonc</code>, deploy, then run migrations at <code>/admin/migrate/</code>).</p></body></html>`,
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } },
      );
    }

    // ── 5a. Viewer write-guard (admin APIs) ────────────────────────────────
    if (
      isAdminApi &&
      session.role === 'viewer' &&
      (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH' || request.method === 'DELETE')
    ) {
      return new Response(JSON.stringify({ success: false, error: 'View-only access — contact an admin to make changes.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ── 5b. Viewer write-guard (all other /api/* writes) ─────────────────────
  // Ported non-admin endpoints (uploads, quote/project actions, …) historically
  // only checked isAuthenticated. Enforce the viewer role once here for every
  // write call. Cheap: only runs when an admin session cookie is actually
  // present — MannyKnows' own API routes never see that cookie.
  if (
    path.startsWith('/api/') &&
    !path.startsWith('/api/admin/') &&
    (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH' || request.method === 'DELETE') &&
    (request.headers.get('cookie') || '').includes('mk_admin_session=')
  ) {
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (session.isAuthenticated && session.role === 'viewer') {
      return new Response(JSON.stringify({ success: false, error: 'View-only access — contact an admin to make changes.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ── 6. /img/* image transforms (Cloudflare IMAGES binding) ───────────────
  // Only ported admin/portal markup links /img/ URLs; nothing on the public
  // site does. Falls back to serving the original image untouched.
  if (path.startsWith('/img/')) {
    const imagePath = path.replace('/img/', '/');
    const format = url.searchParams.get('format') || 'auto';
    const quality = parseInt(url.searchParams.get('quality') || '85');

    const imageUrl = new URL(imagePath, url.origin);

    try {
      const images = env?.IMAGES;
      if (images) {
        let outFormat: string;
        if (format === 'auto') {
          const acceptHeader = request.headers.get('accept') || '';
          if (acceptHeader.includes('image/avif')) outFormat = 'avif';
          else if (acceptHeader.includes('image/webp')) outFormat = 'webp';
          else outFormat = 'jpeg';
        } else {
          outFormat = format;
        }

        const originalImage = await fetch(imageUrl.href);
        if (!originalImage.ok) {
          throw new Error(`Failed to fetch original image: ${originalImage.status}`);
        }

        const response = (await images
          .input(originalImage.body)
          .output({ format: outFormat, quality })).response();

        return new Response(response.body, {
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Vary': 'Accept',
          },
        });
      }
    } catch (error) {
      console.error('Image transformation failed:', error);
    }

    return fetch(imageUrl);
  }

  // ── 7. Security headers — admin + private token pages ONLY ───────────────
  // MannyKnows' public pages keep their existing header behavior; do not
  // touch anything outside the ported namespaces.
  if (isAdminNamespace || isTokenPage || path === '/my-project' || path === '/my-project/') {
    const response = await next();
    const newHeaders = new Headers(response.headers);

    const securityHeaders: Record<string, string> = {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      // Admin pages rely on inline scripts, so 'unsafe-inline' stays. unpkg is
      // used by the annotate/media tooling; open-meteo by the calendar.
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://challenges.cloudflare.com https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
        "img-src 'self' data: blob: https://imagedelivery.net https://images.mannyknows.com https://*.cloudflarestream.com",
        "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
        "connect-src 'self' https://static.cloudflareinsights.com https://challenges.cloudflare.com https://geocoding-api.open-meteo.com https://api.open-meteo.com https://*.cloudflarestream.com",
        "frame-src 'self' https://challenges.cloudflare.com https://images.mannyknows.com https://*.cloudflarestream.com",
        "frame-ancestors 'self'",
        "media-src 'self' blob: https://images.mannyknows.com https://*.cloudflarestream.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ].join('; '),
    };

    // Never index the admin or private token pages. Response header is the
    // strongest signal — honored even when the URL is shared externally.
    if (isAdminNamespace || isTokenPage) {
      securityHeaders['X-Robots-Tag'] = 'noindex, nofollow, noarchive';
    }

    for (const [key, value] of Object.entries(securityHeaders)) {
      newHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  // Everything else — MannyKnows' public site — passes through untouched.
  return next();
});
