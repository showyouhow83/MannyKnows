// Presigned URL endpoint for large file uploads (videos up to 5GB)
// Generates a URL that allows direct upload to R2, bypassing Workers body limits
import type { APIRoute } from 'astro';
import { AwsClient } from 'aws4fetch';
import { AdminAuth } from '../../lib/adminAuth';
import { resolveAllowedOrigin } from '../../lib/cors';
import { publicUrlForR2Path } from '../../lib/publicUrl';

function getAllowedOrigin(request: Request): string | null {
  return resolveAllowedOrigin(request); // prod always; dev/LAN only on dev host (L9)
}

// Validate file path
function isValidPath(path: string): boolean {
  if (path.includes('..')) return false;
  return /^(originals|quotes|progress|projects|portfolios)\/[a-zA-Z0-9_.-]+$/.test(path);
}

// Allowed content types
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm', 'video/mov'
];

export const POST: APIRoute = async ({ request, locals }) => {
  const allowedOrigin = getAllowedOrigin(request);

  const corsHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (allowedOrigin) {
    corsHeaders['Access-Control-Allow-Origin'] = allowedOrigin;
    corsHeaders['Access-Control-Allow-Credentials'] = 'true';
  }

  try {
    // Check origin
    if (!allowedOrigin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized origin' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Require an authenticated admin session. This mints signed PUT URLs to the
    // production bucket, so an Origin header (spoofable) must NOT be enough.
    {
      const _env = locals.runtime?.env;
      const session = await AdminAuth.validateSession(request, _env?.SESSION_SECRET || _env?.ADMIN_PASSWORD);
      if (!session.isAuthenticated) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
    }

    // Get environment variables. All account-specific — no hardcoded defaults:
    //   R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY — R2 S3 API token pair
    //   CF_ACCOUNT_ID (or CLOUDFLARE_ACCOUNT_ID) — Cloudflare account id
    //   R2_BUCKET_NAME — the bucket behind the MK_MEDIA_BUCKET binding
    const env = locals.runtime?.env;
    const accessKeyId = env?.R2_ACCESS_KEY_ID;
    const secretAccessKey = env?.R2_SECRET_ACCESS_KEY;
    const accountId = env?.CF_ACCOUNT_ID || env?.CLOUDFLARE_ACCOUNT_ID;
    const bucketName = env?.R2_BUCKET_NAME;

    if (!accessKeyId || !secretAccessKey || !accountId || !bucketName) {
      console.error('[Presigned URL] Missing R2 credentials');
      return new Response(
        JSON.stringify({
          error: 'R2 presigned URLs not configured',
          hint: 'Add R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CF_ACCOUNT_ID, and R2_BUCKET_NAME secrets/vars'
        }),
        { status: 503, headers: corsHeaders }
      );
    }

    // Parse request body
    const body = await request.json() as any;
    const { key, contentType, contentLength } = body;

    // Validate key/path
    if (!key || typeof key !== 'string' || !isValidPath(key)) {
      return new Response(
        JSON.stringify({ error: 'Invalid upload path' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate content type
    if (!contentType || !ALLOWED_CONTENT_TYPES.some(t => contentType.startsWith(t))) {
      return new Response(
        JSON.stringify({ error: 'Invalid content type. Only images and videos allowed.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate content length (max 5GB for presigned uploads)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (contentLength && contentLength > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 5GB.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create AWS client for R2
    const r2 = new AwsClient({
      accessKeyId,
      secretAccessKey,
    });

    // R2 S3-compatible endpoint
    const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const objectUrl = `${r2Endpoint}/${bucketName}/${key}`;

    // Generate presigned PUT URL (valid for 1 hour)
    const expiresIn = 3600; // 1 hour
    const signedRequest = await r2.sign(
      new Request(objectUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
      }),
      {
        aws: { signQuery: true },
        // Add expiration to query string
      }
    );

    // Extract the signed URL
    const presignedUrl = signedRequest.url;

    // Generate the public URL (shared helper — single source for the media domain)
    const publicUrl = publicUrlForR2Path(key, request);

    console.log(`[Presigned URL] Generated for: ${key}`);

    return new Response(
      JSON.stringify({
        success: true,
        presignedUrl,
        publicUrl,
        key,
        expiresIn,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[Presigned URL] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate presigned URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders }
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
};
