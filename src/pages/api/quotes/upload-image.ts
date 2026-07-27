// Quote Image Upload API
// POST: Upload image to a quote (admin only)
// DELETE: Remove image from a quote (admin only)
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';
import { publicUrlForR2Path } from '../../../lib/publicUrl';

const MAX_IMAGE_SIZE = 25 * 1024 * 1024;        // 25MB max for images (our cap; Worker body limit is 100MB)
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;       // 100MB max for videos
const MAX_IMAGES_PER_QUOTE = 100;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const ALLOWED_CONTENT_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// POST: Upload image
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);

    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - admin authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get quote ID from header
    const quoteId = request.headers.get('X-Quote-Id');
    if (!quoteId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote ID is required (X-Quote-Id header)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate content type
    const contentType = request.headers.get('Content-Type') || '';
    if (!ALLOWED_CONTENT_TYPES.some(t => contentType.startsWith(t))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, HEIC images, MP4/MOV/WebM videos.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const isVideoUpload = ALLOWED_VIDEO_TYPES.some(t => contentType.startsWith(t));

    const bucket = env?.MK_MEDIA_BUCKET;
    const db = env?.MK_APP_DB;

    if (!bucket || !db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Storage not configured'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the quote
    const quote = await db.prepare(`
      SELECT id, quote_number, project_images FROM quotes WHERE id = ?
    `).bind(quoteId).first();

    if (!quote) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse existing images
    let existingImages: string[] = [];
    if (quote.project_images) {
      try {
        existingImages = JSON.parse(quote.project_images as string);
      } catch {}
    }

    // Check max images limit
    if (existingImages.length >= MAX_IMAGES_PER_QUOTE) {
      return new Response(JSON.stringify({
        success: false,
        error: `Maximum ${MAX_IMAGES_PER_QUOTE} images allowed per quote`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Read the file
    let fileData = await request.arrayBuffer();
    let finalContentType = contentType;

    if (!fileData || fileData.byteLength === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No file data received'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const maxSize = isVideoUpload ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (fileData.byteLength > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        error: `File too large. Maximum size is ${isVideoUpload ? '100MB for videos' : '25MB for images'}.`
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert HEIC to JPEG server-side using Cloudflare Images API. Skip for videos.
    const isHeic = !isVideoUpload && (contentType.includes('heic') || contentType.includes('heif'));
    if (isHeic) {
      try {
        const cfAccountId = env?.CF_ACCOUNT_ID || env?.CLOUDFLARE_ACCOUNT_ID;
        const cfApiToken = env?.CF_IMAGES_API_TOKEN || env?.CLOUDFLARE_API_TOKEN;

        if (cfApiToken && cfAccountId) {
          // Upload HEIC to Cloudflare Images (which auto-converts)
          const cfFormData = new FormData();
          cfFormData.append('file', new Blob([fileData], { type: contentType }), 'image.heic');
          // Transient conversion upload (deleted right after) — still namespaced
          // under mk/tmp/ so it's identifiable in the shared account library.
          cfFormData.append('id', `mk/tmp/${crypto.randomUUID()}`);

          const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/images/v1`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${cfApiToken}` },
            body: cfFormData
          });

          const cfResult = await cfRes.json() as any;

          if (cfResult.success && cfResult.result?.variants?.[0]) {
            // Download the JPEG variant from Cloudflare Images
            const jpegUrl = cfResult.result.variants[0];
            const jpegRes = await fetch(jpegUrl);
            if (jpegRes.ok) {
              fileData = await jpegRes.arrayBuffer();
              finalContentType = 'image/jpeg';
              console.log(`[Upload] Converted HEIC to JPEG via CF Images (${fileData.byteLength} bytes)`);
            }

            // Delete from Cloudflare Images (we're storing in R2)
            try {
              await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/images/v1/${cfResult.result.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${cfApiToken}` }
              });
            } catch {}
          } else {
            console.log('[Upload] CF Images HEIC conversion failed:', cfResult.errors);
          }
        } else {
          console.log('[Upload] No CF API token, storing HEIC as-is');
        }
      } catch (err) {
        console.error('[Upload] HEIC conversion error:', err);
      }
    }

    // Generate unique filename. Map MIME → extension; videos keep their type.
    const mimeExtMap: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'jpg',
      'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
    };
    const extension = (isHeic && finalContentType === 'image/jpeg')
      ? 'jpg'
      : (mimeExtMap[finalContentType] || finalContentType.split('/')[1] || 'bin');
    const timestamp = Date.now();
    const imageIndex = existingImages.length + 1;
    const fileName = `${timestamp}_${imageIndex}.${extension}`;
    const uploadPath = `quotes/${quote.quote_number}/${fileName}`;

    // Upload to R2
    await bucket.put(uploadPath, fileData, {
      httpMetadata: {
        contentType: finalContentType,
      },
      customMetadata: {
        quoteId: String(quote.id),
        quoteNumber: quote.quote_number as string,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Generate public URL — localhost dev hits /r2-local proxy so files render
    const fileUrl = publicUrlForR2Path(uploadPath, request);

    // Update quote with new image
    const updatedImages = [...existingImages, fileUrl];
    await db.prepare(`
      UPDATE quotes
      SET project_images = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(JSON.stringify(updatedImages), quote.id).run();

    console.log(`[Quote Image] Uploaded ${fileName} for quote ${quote.quote_number}`);

    return new Response(JSON.stringify({
      success: true,
      imageUrl: fileUrl,
      imageCount: updatedImages.length,
      maxImages: MAX_IMAGES_PER_QUOTE,
      remainingSlots: MAX_IMAGES_PER_QUOTE - updatedImages.length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Quote Image] Upload error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Remove image from quote
export const DELETE: APIRoute = async ({ request, locals, url }) => {
  try {
    const env = cfEnv;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);

    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - admin authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const quoteId = url.searchParams.get('quote_id');
    const imageUrl = url.searchParams.get('image_url');

    if (!quoteId || !imageUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'quote_id and image_url are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const bucket = env?.MK_MEDIA_BUCKET;
    const db = env?.MK_APP_DB;

    if (!bucket || !db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Storage not configured'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the quote
    const quote = await db.prepare(`
      SELECT id, quote_number, project_images FROM quotes WHERE id = ?
    `).bind(quoteId).first();

    if (!quote) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse existing images
    let existingImages: string[] = [];
    if (quote.project_images) {
      try {
        existingImages = JSON.parse(quote.project_images as string);
      } catch {}
    }

    // Remove image from array
    const imageIndex = existingImages.indexOf(imageUrl);
    if (imageIndex === -1) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Image not found in quote'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    existingImages.splice(imageIndex, 1);

    // Try to delete from R2 (extract path from URL — handle both prod CDN
    // and dev /r2-local proxy URLs)
    try {
      const r2Path = imageUrl
        .replace('https://images.mannyknows.com/', '')
        .replace(/^https?:\/\/[^/]+\/r2-local\//, '');
      await bucket.delete(r2Path);
      console.log(`[Quote Image] Deleted ${r2Path} from R2`);
    } catch (r2Error) {
      console.warn(`[Quote Image] Could not delete from R2:`, r2Error);
      // Continue anyway - remove from DB even if R2 delete fails
    }

    // Update quote
    await db.prepare(`
      UPDATE quotes
      SET project_images = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(JSON.stringify(existingImages), quote.id).run();

    console.log(`[Quote Image] Removed image from quote ${quote.quote_number}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Image removed successfully',
      imageCount: existingImages.length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Quote Image] Delete error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete image',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
