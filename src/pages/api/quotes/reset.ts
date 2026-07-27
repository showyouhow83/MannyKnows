// Quotes Reset API
// POST: Reset a quote to fresh data from the original lead
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

interface ResetRequest {
  quote_id: number;
}

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

    const body: ResetRequest = await request.json();

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

    // Get the original lead
    const lead = await db.prepare('SELECT * FROM leads WHERE id = ?').bind(quote.lead_id).first();

    if (!lead) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Original lead not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Reset quote data from lead
    await db.prepare(`
      UPDATE quotes SET
        customer_name = ?,
        customer_email = ?,
        customer_phone = ?,
        address = ?,
        city = ?,
        state = ?,
        zip = ?,
        services = ?,
        scope_description = ?,
        year_built = NULL,
        repairs_needed = NULL,
        preferred_brand = NULL,
        budget = NULL,
        estimated_start = NULL,
        estimated_end = NULL,
        estimated_duration = NULL,
        materials = NULL,
        labor = NULL,
        materials_total = NULL,
        labor_total = NULL,
        subtotal = NULL,
        discount = 0,
        total = NULL,
        notes = NULL,
        status = 'draft',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      lead.customer_name,
      lead.customer_email,
      lead.customer_phone,
      lead.address,
      lead.city,
      lead.state,
      lead.zip,
      JSON.stringify([lead.service_type]),
      lead.project_description,
      body.quote_id
    ).run();

    console.log(`[Quote] Quote ${body.quote_id} reset to original lead data`);

    // Fetch updated quote
    const updated = await db.prepare('SELECT * FROM quotes WHERE id = ?').bind(body.quote_id).first();

    return new Response(JSON.stringify({
      success: true,
      message: 'Quote reset to original lead data',
      quote: updated
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error resetting quote:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to reset quote'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
