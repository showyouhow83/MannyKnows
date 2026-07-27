// Quotes Renegotiate API
// POST: Move a declined quote back to draft for renegotiation
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

interface RenegotiateRequest {
  quote_id: number;
}

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

    const db = env?.MK_APP_DB;
    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: RenegotiateRequest = await request.json();

    if (!body.quote_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'quote_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the quote
    const quote = await db.prepare('SELECT * FROM quotes WHERE id = ?').bind(body.quote_id).first();

    if (!quote) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (quote.status !== 'declined') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only declined quotes can be renegotiated'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the quote for renegotiation
    await db.prepare(`
      UPDATE quotes SET
        status = 'draft',
        is_renegotiation = 1,
        renegotiation_count = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind((quote.renegotiation_count as number || 0) + 1, body.quote_id).run();

    console.log(`[Quote] Quote ${body.quote_id} moved to renegotiation (count: ${(quote.renegotiation_count as number || 0) + 1})`);

    // Fetch updated quote
    const updated = await db.prepare('SELECT * FROM quotes WHERE id = ?').bind(body.quote_id).first();

    return new Response(JSON.stringify({
      success: true,
      message: 'Quote moved to renegotiation',
      quote: updated
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error renegotiating quote:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to renegotiate quote'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
