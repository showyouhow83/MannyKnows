import type { APIRoute } from 'astro';
import { getCfImageUrls } from '../../utils/cloudflareImages';
import { heroImageUrlsFromId } from '../../lib/heroSlides';
import { AdminAuth } from '../../lib/adminAuth';
import { resolveAllowedOrigin } from '../../lib/cors';

/**
 * Cloudflare Images Upload Endpoint
 *
 * Uploads images to Cloudflare Images for optimized delivery.
 * Returns the Cloudflare Image ID and pre-generated variant URLs.
 *
 * Videos are NOT supported - use /api/r2-upload for videos.
 *
 * Account-specific config (no hardcoded ids):
 *   CF_ACCOUNT_ID (or CLOUDFLARE_ACCOUNT_ID) — Cloudflare account id
 *   CLOUDFLARE_API_TOKEN — API token with Images edit
 *   IMAGES_ACCOUNT_HASH — imagedelivery.net hash for the returned variant URLs
 */

// Security limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

// Rate limiting
const uploadAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

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
  return resolveAllowedOrigin(request); // prod always; dev/LAN only on dev host (L9)
}

export const POST: APIRoute = async ({ request, locals }) => {
  const corsHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    // Check origin
    const allowedOrigin = getAllowedOrigin(request);
    if (allowedOrigin) {
      corsHeaders['Access-Control-Allow-Origin'] = allowedOrigin;
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    }

    // Admin-only: this pushes images into the account's Cloudflare Images using
    // CLOUDFLARE_API_TOKEN, so it must not be reachable by an origin spoof.
    {
      const _env = (locals as any).runtime?.env;
      const session = await AdminAuth.validateSession(request, _env?.SESSION_SECRET || _env?.ADMIN_PASSWORD);
      if (!session.isAuthenticated) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
    }

    // Check rate limit
    const clientIP = request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Please wait before uploading again.' }),
        { status: 429, headers: corsHeaders }
      );
    }

    // Get Cloudflare API credentials from environment
    const env = (locals as any).runtime?.env;
    const cfApiToken = env?.CLOUDFLARE_API_TOKEN;
    const cfAccountId = env?.CF_ACCOUNT_ID || env?.CLOUDFLARE_ACCOUNT_ID;

    if (!cfApiToken || !cfAccountId) {
      console.error('[CF Images] Missing CLOUDFLARE_API_TOKEN / CF_ACCOUNT_ID');
      return new Response(
        JSON.stringify({ success: false, error: 'Image upload service not configured' }),
        { status: 503, headers: corsHeaders }
      );
    }
    const cfImagesApi = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/images/v1`;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file type (images only)
    const contentType = file.type;
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid file type: ${contentType}. Allowed: JPEG, PNG, WebP, GIF. For videos, use the standard upload.`
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB`
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Prepare form data for Cloudflare Images API
    const cfFormData = new FormData();
    cfFormData.append('file', file, file.name);

    // Namespace the image ID under mk/ — the Cloudflare Images library is
    // account-wide and shared with other client sites on this account, so a
    // per-site prefix keeps MK assets identifiable and bulk-manageable.
    cfFormData.append('id', `mk/${crypto.randomUUID()}`);

    // Optional: Add metadata
    const metadata = {
      site: 'mannyknows',
      source: 'mannyknows-admin',
      originalName: file.name,
      uploadedAt: new Date().toISOString()
    };
    cfFormData.append('metadata', JSON.stringify(metadata));

    // Upload to Cloudflare Images
    console.log(`[CF Images] Uploading ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

    const cfResponse = await fetch(cfImagesApi, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfApiToken}`
      },
      body: cfFormData
    });

    const cfResult = await cfResponse.json() as {
      success: boolean;
      errors?: Array<{ message: string }>;
      result?: {
        id: string;
        filename: string;
        uploaded: string;
        variants: string[];
      };
    };

    if (!cfResponse.ok || !cfResult.success) {
      const errorMsg = cfResult.errors?.[0]?.message || 'Upload failed';
      console.error('[CF Images] Upload failed:', errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: `Cloudflare Images error: ${errorMsg}` }),
        { status: cfResponse.status || 500, headers: corsHeaders }
      );
    }

    const imageId = cfResult.result!.id;
    const urls = getCfImageUrls(imageId, env);
    // If IMAGES_ACCOUNT_HASH isn't configured, fall back to the delivery URL
    // Cloudflare returned for this upload so callers still get a usable URL.
    const fallbackUrl = cfResult.result!.variants?.[0] || '';

    console.log(`[CF Images] Success! ID: ${imageId}`);

    return new Response(
      JSON.stringify({
        success: true,
        cloudflare_image_id: imageId,
        urls: urls,
        // Hero-slider variants (desktop/mobile) — '' when IMAGES_ACCOUNT_HASH is unset
        hero_urls: heroImageUrlsFromId(imageId, env),
        // Provide public URL as fallback media_url for database storage
        media_url: urls.public || fallbackUrl
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[CF Images] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};

// Handle OPTIONS for CORS preflight
export const OPTIONS: APIRoute = async ({ request }) => {
  const allowedOrigin = getAllowedOrigin(request);
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
};
