import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { safeMediaHeaders } from '../../../../lib/security/mediaHeaders';

/**
 * R2 Image Proxy for Lead Images
 * Serves images directly from R2 bucket, works in both local and production
 *
 * URL format: /api/leads/image/{confirmationCode}/{filename}
 * Example: /api/leads/image/ABC123/1704067200000_1.jpg
 */

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { path } = params;

    if (!path || path.includes('..')) {
      return new Response('Not found', { status: 404 });
    }

    // Construct the R2 key
    const r2Key = `leads/${path}`;

    // Access R2 bucket
    const bucket = cfEnv?.MK_MEDIA_BUCKET;

    if (!bucket) {
      console.error('[Image Proxy] R2 bucket not configured');
      return new Response('Storage not configured', { status: 500 });
    }

    // Get the object from R2
    const object = await bucket.get(r2Key);

    if (!object) {
      console.log(`[Image Proxy] Image not found: ${r2Key}`);
      return new Response('Image not found', { status: 404 });
    }

    // Serve-time MIME policy: only real image types render inline here (this
    // is the main origin); anything else downloads.
    return new Response(object.body, {
      status: 200,
      headers: {
        ...safeMediaHeaders(object.httpMetadata?.contentType || 'image/jpeg'),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('[Image Proxy] Error:', error);
    return new Response('Error retrieving image', { status: 500 });
  }
};
