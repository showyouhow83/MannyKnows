import type { APIRoute } from 'astro';
import { resolveAllowedOrigin } from '../../../lib/cors';

// CORS origins are resolved by the shared allowlist in src/lib/cors.ts.

// Security limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max
const MAX_IMAGES_PER_LEAD = 15;
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

function getAllowedOrigin(request: Request): string | null {
  return resolveAllowedOrigin(request); // prod always; dev/LAN only on dev host (L9)
}

export const POST: APIRoute = async ({ request, locals }) => {
  const allowedOrigin = getAllowedOrigin(request);

  const makeHeaders = (extraHeaders: Record<string, string> = {}): HeadersInit => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extraHeaders };
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    return headers;
  };

  try {
    if (!allowedOrigin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized origin' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get token from header (to identify which lead)
    const confirmationToken = request.headers.get('X-Confirmation-Token');
    if (!confirmationToken || confirmationToken.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid confirmation token' }),
        { status: 400, headers: makeHeaders() }
      );
    }

    // Validate content type
    const contentType = request.headers.get('Content-Type') || '';
    if (!ALLOWED_CONTENT_TYPES.some(t => contentType.startsWith(t))) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, WebP, and HEIC images are allowed.' }),
        { status: 400, headers: makeHeaders() }
      );
    }

    // Access R2 bucket and D1 database
    const bucket = locals.runtime?.env?.MK_MEDIA_BUCKET;
    const db = locals.runtime?.env?.MK_APP_DB;

    if (!bucket || !db) {
      return new Response(
        JSON.stringify({ error: 'Storage not configured' }),
        { status: 500, headers: makeHeaders() }
      );
    }

    // Look up the lead by confirmation token (must be confirmed)
    const lead = await db.prepare(`
      SELECT id, confirmation_code, project_images, status
      FROM leads
      WHERE confirmation_token = ?
    `).bind(confirmationToken).first();

    if (!lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: makeHeaders() }
      );
    }

    if (lead.status !== 'confirmed' && lead.status !== 'pending_confirmation') {
      return new Response(
        JSON.stringify({ error: 'Images can only be added to active leads' }),
        { status: 400, headers: makeHeaders() }
      );
    }

    // Parse existing images
    let existingImages: string[] = [];
    if (lead.project_images) {
      try {
        existingImages = JSON.parse(lead.project_images as string);
      } catch {}
    }

    // Check max images limit
    if (existingImages.length >= MAX_IMAGES_PER_LEAD) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_IMAGES_PER_LEAD} images allowed per lead` }),
        { status: 400, headers: makeHeaders() }
      );
    }

    // Read the file
    const fileData = await request.arrayBuffer();

    if (!fileData || fileData.byteLength === 0) {
      return new Response(
        JSON.stringify({ error: 'No file data received' }),
        { status: 400, headers: makeHeaders() }
      );
    }

    if (fileData.byteLength > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10MB.' }),
        { status: 413, headers: makeHeaders() }
      );
    }

    // Generate unique filename
    const extension = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const timestamp = Date.now();
    const imageIndex = existingImages.length + 1;
    const fileName = `${timestamp}_${imageIndex}.${extension}`;
    const uploadPath = `leads/${lead.confirmation_code}/${fileName}`;

    // Upload to R2
    await bucket.put(uploadPath, fileData, {
      httpMetadata: {
        contentType: contentType,
      },
      customMetadata: {
        leadId: String(lead.id),
        confirmationCode: lead.confirmation_code as string,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Generate public URL using the images.mannyknows.com custom domain
    const fileUrl = `https://images.mannyknows.com/${uploadPath}`;

    // Update lead with new image
    const updatedImages = [...existingImages, fileUrl];
    await db.prepare(`
      UPDATE leads
      SET project_images = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(JSON.stringify(updatedImages), lead.id).run();

    console.log(`[Lead Image] Uploaded ${fileName} for lead ${lead.confirmation_code}`);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: fileUrl,
        imageCount: updatedImages.length,
        maxImages: MAX_IMAGES_PER_LEAD,
        remainingSlots: MAX_IMAGES_PER_LEAD - updatedImages.length,
      }),
      {
        status: 200,
        headers: makeHeaders(),
      }
    );
  } catch (error) {
    console.error('[Lead Image] Upload error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: makeHeaders() }
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
      'Access-Control-Allow-Headers': 'Content-Type, X-Confirmation-Token',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
};
