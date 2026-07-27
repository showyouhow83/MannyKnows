import type { APIRoute } from 'astro';
import { resolveAllowedOrigin } from '../../lib/cors';
import { publicUrlForR2Path } from '../../lib/publicUrl';

// Rate limiting: max 20 URL requests per IP per minute
const urlAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = urlAttempts.get(ip);

  if (!record || now > record.resetTime) {
    urlAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

function getAllowedOrigin(request: Request): string | null {
  return resolveAllowedOrigin(request); // prod always; dev/LAN only on dev host (L9)
}

function getClientIP(request: Request): string {
  return request.headers.get('cf-connecting-ip') ||
         request.headers.get('x-forwarded-for')?.split(',')[0] ||
         'unknown';
}

interface UploadMetadata {
  fileName: string;
  path: 'originals' | 'quotes';
  timestamp: number;
  uploadedAt: string;
  fullPath: string;
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check origin
    const allowedOrigin = getAllowedOrigin(request);
    if (!allowedOrigin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized origin' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before requesting again.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const fileName = url.searchParams.get('fileName');
    const path = url.searchParams.get('path') as 'originals' | 'quotes';

    // Validate parameters
    if (!fileName) {
      return new Response(
        JSON.stringify({ error: 'fileName is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Reject path traversal attempts up front
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return new Response(
        JSON.stringify({ error: 'Invalid filename' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize remaining unsafe chars (spaces, parens, etc.) so screenshots
    // and copy-pasted names don't silently fail. Matches the POST handler.
    const safeFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');

    if (!path || !['originals', 'quotes'].includes(path)) {
      return new Response(
        JSON.stringify({ error: 'path must be either "originals" or "quotes"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Access R2 bucket through env
    const bucket = locals.runtime?.env?.MK_MEDIA_BUCKET;
    const kv = locals.runtime?.env?.MK_ADMIN_KV;

    if (!bucket) {
      return new Response(
        JSON.stringify({ error: 'R2 bucket not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create timestamped filename (use sanitized name)
    const timestamp = Date.now();
    const fileExtension = safeFileName.split('.').pop();
    const fileNameWithoutExt = safeFileName.replace(`.${fileExtension}`, '');
    const timestampedFileName = `${timestamp}_${fileNameWithoutExt}.${fileExtension}`;

    // Full path in bucket
    const fullPath = `${path}/${timestampedFileName}`;

    // Store metadata in KV for tracking
    if (kv) {
      const metadata: UploadMetadata = {
        fileName: timestampedFileName,
        path,
        timestamp,
        uploadedAt: new Date().toISOString(),
        fullPath,
      };

      // Store with key: media-upload:{timestamp}:{fileName}
      // (read back + marked complete by /api/r2-upload — prefixes must match)
      const kvKey = `media-upload:${timestamp}:${safeFileName}`;
      await kv.put(kvKey, JSON.stringify(metadata), {
        expirationTtl: 86400 * 30, // Keep for 30 days
      });
    }

    // Return the upload information
    return new Response(
      JSON.stringify({
        uploadUrl: `/api/r2-upload`,
        metadata: {
          fileName: timestampedFileName,
          originalFileName: fileName,
          path,
          fullPath,
          timestamp,
        },
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
    console.error('Error generating upload URL:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST: Get upload URL for crew progress images
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

    // Check rate limit (skip for authenticated admin OR crew sessions)
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const db = env?.MK_APP_DB;
    let isAdmin = false;
    let isCrew = false;
    if (sessionSecret) {
      try {
        const { AdminAuth } = await import('../../lib/adminAuth');
        const session = await AdminAuth.validateSession(request, sessionSecret);
        isAdmin = session.isAuthenticated;
      } catch {}
    }
    if (!isAdmin && db) {
      const cookie = request.headers.get('cookie') || '';
      const match = cookie.match(/crew_session=([^;]+)/);
      if (match) {
        try {
          const row = await db.prepare(
            `SELECT 1 FROM crew_sessions cs JOIN crew_leads cl ON cs.crew_lead_id = cl.id
             WHERE cs.session_token = ? AND cs.expires_at > CURRENT_TIMESTAMP AND cl.active = 1`
          ).bind(match[1]).first();
          isCrew = !!row;
        } catch {}
      }
    }

    if (!isAdmin && !isCrew) {
      const clientIP = getClientIP(request);
      if (!checkRateLimit(clientIP)) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait before requesting again.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Parse JSON body
    const body = await request.json() as any;
    const { filename, contentType, folder, projectId } = body;

    // Validate parameters
    if (!filename) {
      return new Response(
        JSON.stringify({ error: 'filename is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate filename (prevent path traversal and malicious names)
    const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');

    // Validate folder
    const validFolders = ['originals', 'quotes', 'progress', 'projects', 'contracts', 'pool'];
    const path = validFolders.includes(folder) ? folder : 'progress';

    // Access R2 bucket through env
    const bucket = locals.runtime?.env?.MK_MEDIA_BUCKET;
    const kv = locals.runtime?.env?.MK_ADMIN_KV;

    if (!bucket) {
      return new Response(
        JSON.stringify({ error: 'R2 bucket not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create filename — use stable path per project so re-uploads overwrite
    const timestamp = Date.now();
    const fileExtension = safeFilename.split('.').pop() || 'jpg';
    const fileNameWithoutExt = safeFilename.replace(`.${fileExtension}`, '');
    let timestampedFileName: string;
    let fullPath: string;

    if (projectId) {
      // Project uploads: stable path = same file replaces in R2
      timestampedFileName = safeFilename;
      fullPath = `${path}/project-${projectId}/${safeFilename}`;
    } else {
      // Other uploads: timestamped to avoid collisions
      timestampedFileName = `${timestamp}_${fileNameWithoutExt}.${fileExtension}`;
      fullPath = `${path}/${timestampedFileName}`;
    }

    // Store metadata in KV for tracking
    if (kv) {
      const metadata = {
        fileName: timestampedFileName,
        originalFileName: filename,
        path,
        contentType,
        timestamp,
        uploadedAt: new Date().toISOString(),
        fullPath,
      };

      const kvKey = `upload-metadata:${timestamp}:${safeFilename}`;
      await kv.put(kvKey, JSON.stringify(metadata), {
        expirationTtl: 86400 * 30, // Keep for 30 days
      });
    }

    // Return the upload information
    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl: `/api/r2-upload?key=${encodeURIComponent(fullPath)}`,
        key: fullPath,
        fileName: timestampedFileName,
        fullPath,
        publicUrl: publicUrlForR2Path(fullPath, request),
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
    console.error('Error generating upload URL (POST):', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate upload URL',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
};
