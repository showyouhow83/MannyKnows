import type { APIRoute } from 'astro';

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

    if (!path) {
      return new Response('Not found', { status: 404 });
    }

    // Construct the R2 key
    const r2Key = `leads/${path}`;

    // Access R2 bucket
    const bucket = locals.runtime?.env?.MK_MEDIA_BUCKET;

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

    // Get content type from stored metadata or default to jpeg
    const contentType = object.httpMetadata?.contentType || 'image/jpeg';

    // Return the image with appropriate headers
    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Image Proxy] Error:', error);
    return new Response('Error retrieving image', { status: 500 });
  }
};
