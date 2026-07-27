import type { APIRoute } from 'astro';
import { publicUrlForR2Path } from '../../lib/publicUrl';
import { resolveAllowedOrigin } from '../../lib/cors';

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

// Rate limiting: anti-abuse only. Raised from 10 → 60/min because crew bulk
// uploads (a whole project's photos+videos at once) were tripping the old cap
// and silently dropping files. Authenticated crew/admin are exempt entirely.
const uploadAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = uploadAttempts.get(ip);

  if (!record || now > record.resetTime) {
    uploadAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
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

    // Check rate limit (skip for authenticated admin sessions)
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    let isAdminPost = false;
    if (sessionSecret) {
      try {
        const { AdminAuth } = await import('../../lib/adminAuth');
        const session = await AdminAuth.validateSession(request, sessionSecret);
        isAdminPost = session.isAuthenticated;
      } catch {}
    }

    // Authenticated crew (timeclock bulk uploads) are also exempt — they upload
    // a whole project's media at once and were getting rate-limited mid-batch.
    let isCrewPost = false;
    if (!isAdminPost && env?.MK_APP_DB) {
      try {
        const cookie = request.headers.get('cookie') || '';
        const m = cookie.match(/crew_session=([^;]+)/);
        if (m) {
          const sess = await env.MK_APP_DB.prepare(
            'SELECT 1 FROM crew_sessions WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP'
          ).bind(m[1]).first();
          isCrewPost = !!sess;
        }
      } catch {}
    }

    if (!isAdminPost && !isCrewPost) {
      const clientIP = request.headers.get('cf-connecting-ip') ||
                       request.headers.get('x-forwarded-for')?.split(',')[0] ||
                       'unknown';
      if (!checkRateLimit(clientIP)) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait before uploading again.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate content type (images and videos for portfolios)
    const contentType = request.headers.get('Content-Type') || '';
    const isImage = ALLOWED_CONTENT_TYPES.some(t => contentType.startsWith(t));
    const isVideo = ALLOWED_VIDEO_TYPES.some(t => contentType.startsWith(t));
    const isDoc = ALLOWED_DOC_TYPES.some(t => contentType.startsWith(t));
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
    const bucket = locals.runtime?.env?.MK_MEDIA_BUCKET;
    const kv = locals.runtime?.env?.MK_ADMIN_KV;

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
      JSON.stringify({
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
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

    // Check rate limit (skip for authenticated admin sessions)
    const envPut = locals.runtime?.env;
    const secretPut = envPut?.SESSION_SECRET || envPut?.ADMIN_PASSWORD;
    let isAdminPut = false;
    if (secretPut) {
      try {
        const { AdminAuth } = await import('../../lib/adminAuth');
        const session = await AdminAuth.validateSession(request, secretPut);
        isAdminPut = session.isAuthenticated;
      } catch {}
    }

    if (!isAdminPut) {
      const clientIP = request.headers.get('cf-connecting-ip') ||
                       request.headers.get('x-forwarded-for')?.split(',')[0] ||
                       'unknown';
      if (!checkRateLimit(clientIP)) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait before uploading again.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
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

    // Validate content type (images and videos for portfolios)
    const contentType = request.headers.get('Content-Type') || 'image/jpeg';
    const isImagePut = ALLOWED_CONTENT_TYPES.some(t => contentType.startsWith(t));
    const isVideoPut = ALLOWED_VIDEO_TYPES.some(t => contentType.startsWith(t));
    const isPdfPut = contentType === 'application/pdf';
    if (!isImagePut && !isVideoPut && !isPdfPut) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only images, videos, and PDFs are allowed.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Access R2 bucket
    const bucket = locals.runtime?.env?.MK_MEDIA_BUCKET;
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

    // Upload to R2
    await bucket.put(key, fileData, {
      httpMetadata: {
        contentType: contentType,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        source: 'crew-portal',
      },
    });

    console.log(`[R2 Upload] Crew upload: ${key} (${fileData.byteLength} bytes)`);

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
      JSON.stringify({
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
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
      'Access-Control-Allow-Headers': 'Content-Type, X-Upload-Path, X-Upload-Timestamp',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
};
