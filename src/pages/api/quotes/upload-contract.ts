// Quote Contract Upload API
// POST: Upload contract PDF to a quote (admin only)
// DELETE: Remove contract from a quote (admin only)
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB max for PDFs
const ALLOWED_CONTENT_TYPES = ['application/pdf'];

// POST: Upload contract
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
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

    const contentType = request.headers.get('Content-Type') || '';
    if (!ALLOWED_CONTENT_TYPES.some(t => contentType.startsWith(t))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid file type. Only PDF files are allowed.'
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

    const quote = await db.prepare(`
      SELECT id, quote_number, contract_url FROM quotes WHERE id = ?
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

    const fileData = await request.arrayBuffer();

    if (!fileData || fileData.byteLength === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No file data received'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (fileData.byteLength > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File too large. Maximum size is 20MB.'
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete old contract from R2 if one exists
    if (quote.contract_url) {
      try {
        const oldPath = (quote.contract_url as string).replace('https://images.mannyknows.com/', '');
        await bucket.delete(oldPath);
      } catch {}
    }

    const timestamp = Date.now();
    const uploadPath = `quotes/${quote.quote_number}/contract_${timestamp}.pdf`;

    await bucket.put(uploadPath, fileData, {
      httpMetadata: {
        contentType: 'application/pdf',
        contentDisposition: `inline; filename="MannyKnows-Quote-${quote.quote_number}.pdf"`,
      },
      customMetadata: {
        quoteId: String(quote.id),
        quoteNumber: quote.quote_number as string,
        uploadedAt: new Date().toISOString(),
      },
    });

    const fileUrl = `https://images.mannyknows.com/${uploadPath}`;

    await db.prepare(`
      UPDATE quotes
      SET contract_url = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(fileUrl, quote.id).run();

    console.log(`[Quote Contract] Uploaded contract for quote ${quote.quote_number}`);

    return new Response(JSON.stringify({
      success: true,
      contractUrl: fileUrl,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Quote Contract] Upload error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to upload contract',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Remove contract from quote
export const DELETE: APIRoute = async ({ request, locals, url }) => {
  try {
    const env = locals.runtime?.env;
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
    if (!quoteId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'quote_id is required'
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

    const quote = await db.prepare(`
      SELECT id, quote_number, contract_url FROM quotes WHERE id = ?
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

    if (!quote.contract_url) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No contract attached to this quote'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete from R2
    try {
      const r2Path = (quote.contract_url as string).replace('https://images.mannyknows.com/', '');
      await bucket.delete(r2Path);
      console.log(`[Quote Contract] Deleted ${r2Path} from R2`);
    } catch (r2Error) {
      console.warn(`[Quote Contract] Could not delete from R2:`, r2Error);
    }

    await db.prepare(`
      UPDATE quotes
      SET contract_url = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(quote.id).run();

    console.log(`[Quote Contract] Removed contract from quote ${quote.quote_number}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Contract removed successfully',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Quote Contract] Delete error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete contract',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
