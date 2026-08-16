import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { publicUrlForR2Path } from '../../lib/publicUrl';
import { resolveAllowedOrigin } from '../../lib/cors';
import { kvRateLimit, clientIp } from '../../lib/rateLimit';

// Who may write to the bucket (Aug 2026 hardening — before this, an Origin
// header was the only gate, and Origin is a request header anyone can set):
//   admin   — HMAC admin session cookie: any allowed prefix, may overwrite.
//   crew    — D1 crew_session cookie (timeclock kiosk): media + receipts.
//   token   — X-Crew-Token / X-Client-Token from the project, crew, and
//             partner portals, resolved against D1: `progress/` only, never
//             overwrites an existing key.
// Anything else is refused. Rate limits are KV-backed (global), not a Map.
type Caller = { kind: 'admin' | 'crew' | 'token'; label: string } | null;

async function identifyCaller(request: Request): Promise<Caller> {
  const env = cfEnv as any;
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  if (sessionSecret) {
    try {
      const { AdminAuth } = await import('../../lib/adminAuth');
      const session = await AdminAuth.validateSession(request, sessionSecret);
      if (session.isAuthenticated && session.role !== 'viewer') return { kind: 'admin', label: session.username || 'admin' };
    } catch {}
  }
  const db = env?.MK_APP_DB;
  if (!db) return null;
  try {
    const cookie = request.headers.get('cookie') || '';
    const m = cookie.match(/crew_session=([^;]+)/);
    if (m) {
      const sess = await db.prepare(
        'SELECT 1 FROM crew_sessions WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP'
      ).bind(m[1]).first();
      if (sess) return { kind: 'crew', label: 'crew-session' };
    }
  } catch {}
  const crewToken = (request.headers.get('X-Crew-Token') || '').trim();
  const clientToken = (request.headers.get('X-Client-Token') || '').trim();
  const looksLikeToken = (t: string) => t.length >= 16 && t.length <= 128 && /^[A-Za-z0-9_-]+$/.test(t);
  try {
    if (looksLikeToken(crewToken)) {
      const p = await db.prepare('SELECT id FROM projects WHERE crew_token = ?').bind(crewToken).first();
      if (p) return { kind: 'token', label: `project-crew:${(p as any).id}` };
      const j = await db.prepare('SELECT id FROM partner_jobs WHERE crew_token = ?').bind(crewToken).first();
      if (j) return { kind: 'token', label: `partner-crew:${(j as any).id}` };
    }
    if (looksLikeToken(clientToken)) {
      const p = await db.prepare('SELECT id FROM projects WHERE client_token = ?').bind(clientToken).first();
      if (p) return { kind: 'token', label: `project-client:${(p as any).id}` };
    }
  } catch {}
  return null;
}

const jsonRes = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...extra } });

// Public host of the R2 bucket's custom domain — used only for the HEIC→JPEG
// edge-transform fetch below. Overridable per deployment.
function mediaPublicHost(env: any): string {
  return env?.MEDIA_PUBLIC_HOST || 'images.mannyknows.com';
}

// Security limits
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB max for images (our cap; Worker body limit is 100MB)
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB max for videos
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
// PDFs are allowed for receipts (expense uploads) only.
const ALLOWED_DOC_TYPES = ['application/pdf'];

// Rate limiting: anti-abuse only, for token callers (portals upload a whole
// project's photos at once, so the cap is generous). Admin and crew sessions
// are exempt. KV-backed so it holds across isolates.
const RATE_LIMIT_WINDOW_S = 60;
const RATE_LIMIT_MAX = 60;
async function tokenRateLimited(request: Request): Promise<boolean> {
  const kv = (cfEnv as any)?.MK_KV_SESSIONS;
  return !(await kvRateLimit(kv, `r2up:${clientIp(request)}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_S));
}

function getAllowedOrigin(request: Request): string | null {
  // Shared resolver: prod origins always; dev/LAN origins only on a dev host
  // (production no longer honors localhost or blanket private-IP origins). L9.
  return resolveAllowedOrigin(request);
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check origin
    const allowedOrigin = getAllowedOrigin(request);
    if (!allowedOrigin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized origin' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST is the header-addressed upload used by the admin (portfolios, crew
    // receipts) and the timeclock kiosk (crew session). No token caller uses
    // it, so a session is required outright.
    const env = cfEnv;
    const caller = await identifyCaller(request);
    if (!caller || caller.kind === 'token') {
      return jsonRes({ error: 'Unauthorized' }, 401);
    }

    // Validate content type (images and videos for portfolios). Exact match on
    // the media type — `startsWith` let "image/jpeg, text/html" through.
    const contentType = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
    const isImage = ALLOWED_CONTENT_TYPES.includes(contentType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);
    const isDoc = ALLOWED_DOC_TYPES.includes(contentType);
    if (!isImage && !isVideo && !isDoc) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only images, videos, and PDF receipts are allowed.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // PDFs are only permitted under the receipts/ path.
    if (isDoc) {
      const pdfPath = request.headers.get('X-Upload-Path') || '';
      if (!pdfPath.startsWith('receipts/')) {
        return new Response(
          JSON.stringify({ error: 'PDF uploads are only allowed for receipts.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get upload path from headers
    let uploadPath = request.headers.get('X-Upload-Path');
    const timestamp = request.headers.get('X-Upload-Timestamp');

    if (!uploadPath || !timestamp) {
      return new Response(
        JSON.stringify({ error: 'Missing upload path or timestamp' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate upload path (prevent directory traversal)
    if (uploadPath.includes('..') || !uploadPath.match(/^(originals|quotes|progress|projects|portfolios|receipts|pool)(\/[a-zA-Z0-9_.-]+)+$/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid upload path' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Access R2 bucket
    const bucket = cfEnv?.MK_MEDIA_BUCKET;
    const kv = cfEnv?.MK_ADMIN_KV;

    if (!bucket) {
      return new Response(
        JSON.stringify({ error: 'R2 bucket not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Read the file as an array buffer
    let fileData = await request.arrayBuffer();
    let finalContentType = contentType;

    if (!fileData || fileData.byteLength === 0) {
      return new Response(
        JSON.stringify({ error: 'No file data received' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check file size (different limits for images vs videos)
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
    const maxSizeLabel = isVideo ? '100MB' : '25MB';
    if (fileData.byteLength > maxSize) {
      return new Response(
        JSON.stringify({ error: `File too large. Maximum size is ${maxSizeLabel}.` }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert HEIC/HEIF to JPEG server-side
    const isHeic = contentType.includes('heic') || contentType.includes('heif');
    if (isHeic) {
      try {
        const tempPath = `temp/${Date.now()}_heic`;
        await bucket.put(tempPath, fileData, { httpMetadata: { contentType } });
        const cdnUrl = `https://${mediaPublicHost(env)}/${tempPath}`;
        const res = await fetch(cdnUrl, { cf: { image: { format: 'jpeg', quality: 92 } } } as any);
        if (res.ok) {
          fileData = await res.arrayBuffer();
          finalContentType = 'image/jpeg';
          uploadPath = uploadPath.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
        }
        await bucket.delete(tempPath);
      } catch (err) {
        console.error('[R2Upload] HEIC conversion error:', err);
      }
    }

    // Upload to R2
    await bucket.put(uploadPath, fileData, {
      httpMetadata: {
        contentType: finalContentType,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        timestamp: timestamp,
      },
    });

    // Get the path components
    const pathParts = uploadPath.split('/');
    const path = pathParts[0] as 'originals' | 'quotes';
    const fileName = pathParts[1];

    // Update KV with successful upload (same prefix /api/r2-upload-url writes)
    if (kv) {
      const kvKey = `media-upload:${timestamp}:${fileName.replace(/^\d+_/, '')}`;
      const existingData = await kv.get(kvKey, 'json');

      if (existingData) {
        await kv.put(
          kvKey,
          JSON.stringify({
            ...existingData,
            uploadCompleted: true,
            uploadCompletedAt: new Date().toISOString(),
            fileSize: fileData.byteLength,
            contentType: contentType,
          }),
          { expirationTtl: 86400 * 30 } // Keep for 30 days
        );
      }
    }

    // Generate public URL — prod uses the custom-domain CDN; dev uploads
    // get a /r2-local proxy URL so they're viewable in the dev environment.
    const fileUrl = publicUrlForR2Path(uploadPath, request);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'File uploaded successfully',
        fileUrl: fileUrl,
        fileName: fileName,
        path: path,
        fullPath: uploadPath,
        fileSize: fileData.byteLength,
        timestamp: parseInt(timestamp),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload file' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT: Simple upload with key in query string (for crew portal)
export const PUT: APIRoute = async ({ request, locals, url }) => {
  try {
    // Check origin
    const allowedOrigin = getAllowedOrigin(request);
    if (!allowedOrigin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized origin' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Who is this? Admin/crew sessions, or a portal token in a header.
    const caller = await identifyCaller(request);
    if (!caller) {
      return jsonRes({ error: 'Unauthorized' }, 401);
    }
    if (caller.kind === 'token' && (await tokenRateLimited(request))) {
      return jsonRes({ error: 'Rate limit exceeded. Please wait before uploading again.' }, 429);
    }

    // Get key from query string
    const key = url.searchParams.get('key');
    if (!key) {
      return new Response(
        JSON.stringify({ error: 'Missing key parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate key path (prevent directory traversal)
    if (key.includes('..') || !key.match(/^(originals|quotes|progress|projects|portfolios|contracts|pool)(\/[a-zA-Z0-9_.-]+)+$/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid upload path' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // Prefix rights: signed contracts are admin-only; portal tokens may only
    // add progress media. Crew sessions get everything but contracts.
    if (key.startsWith('contracts/') && caller.kind !== 'admin') {
      return jsonRes({ error: 'Forbidden path' }, 403);
    }
    if (caller.kind === 'token' && !key.startsWith('progress/')) {
      return jsonRes({ error: 'Forbidden path' }, 403);
    }

    // Validate content type (images and videos for portfolios) — exact match.
    const contentType = (request.headers.get('Content-Type') || 'image/jpeg').split(';')[0].trim().toLowerCase();
    const isImagePut = ALLOWED_CONTENT_TYPES.includes(contentType);
    const isVideoPut = ALLOWED_VIDEO_TYPES.includes(contentType);
    const isPdfPut = contentType === 'application/pdf';
    if (!isImagePut && !isVideoPut && !isPdfPut) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only images, videos, and PDFs are allowed.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Access R2 bucket
    const bucket = cfEnv?.MK_MEDIA_BUCKET;
    if (!bucket) {
      return new Response(
        JSON.stringify({ error: 'R2 bucket not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Read the file as an array buffer
    const fileData = await request.arrayBuffer();

    if (!fileData || fileData.byteLength === 0) {
      return new Response(
        JSON.stringify({ error: 'No file data received' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check file size (different limits for images vs videos)
    const maxSizePut = isVideoPut ? MAX_VIDEO_SIZE : (isPdfPut ? MAX_FILE_SIZE : MAX_FILE_SIZE);
    const maxSizeLabelPut = isVideoPut ? '100MB' : '25MB';
    if (fileData.byteLength > maxSizePut) {
      return new Response(
        JSON.stringify({ error: `File too large. Maximum size is ${maxSizeLabelPut}.` }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Non-admin callers can add objects, never replace one — a portal token
    // must not be able to swap a photo (or anything else) already in place.
    if (caller.kind !== 'admin') {
      const existing = await bucket.head(key).catch(() => null);
      if (existing) return jsonRes({ error: 'That file already exists.' }, 409);
    }

    // Upload to R2
    await bucket.put(key, fileData, {
      httpMetadata: {
        contentType: contentType,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        source: caller.kind === 'admin' ? 'admin' : caller.kind === 'crew' ? 'crew-session' : `portal:${caller.label}`,
      },
    });

    console.log(`[R2 Upload] ${caller.kind} upload (${caller.label}): ${key} (${fileData.byteLength} bytes)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'File uploaded successfully',
        key,
        fileSize: fileData.byteLength,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  } catch (error) {
    console.error('Error uploading to R2 (PUT):', error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload file' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Handle CORS preflight
export const OPTIONS: APIRoute = async ({ request }) => {
  const allowedOrigin = getAllowedOrigin(request);

  if (!allowedOrigin) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Upload-Path, X-Upload-Timestamp, X-Crew-Token, X-Client-Token',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
};
