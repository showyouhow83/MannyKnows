// Admin Leads API - Create direct leads from admin panel
// POST: Create new lead (admin only)
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';
import { normName, normEmail, normAddr, normCity, normState, sentenceCase } from '../../../lib/textNorm';

interface DirectLeadRequest {
  // Customer info
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;

  // Location
  address: string;
  city: string;
  state?: string;
  zip?: string;

  // Service request
  service_type: string;
  project_description?: string;

  // Scheduling
  preferred_date?: string;
  preferred_time?: string;

  // Source: how did this customer contact us?
  source: 'walk-in' | 'phone' | 'referral' | 'other';

  // Optional referral info
  referral_source?: string;

  // Partner white-label (set at creation; flows Lead → Quote → Project)
  partner_id?: number | string;
}

// Generate confirmation code (matches Remi's format: MK-{timestamp}-{random})
function generateConfirmationCode(): string {
  const prefix = 'MK';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Generate UUID for confirmation token
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// POST: Create direct lead from admin
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

    const body: DirectLeadRequest = await request.json() as any;

    // Validate required fields
    if (!body.customer_name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Customer name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!body.customer_email && !body.customer_phone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'At least one contact method (email or phone) is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Address and city are optional — not all leads have an address yet

    if (!body.service_type) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Service type is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate source
    const validSources = ['walk-in', 'phone', 'referral', 'angies-list', 'thumbtack', 'google', 'other'];
    if (!body.source || !validSources.includes(body.source)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Source must be one of: ${validSources.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ---- TEXT NORMALIZATION (Layer 1: instant case fix, no AI) ----
    body.customer_name = normName(body.customer_name);
    if (body.customer_email) body.customer_email = normEmail(body.customer_email);
    if (body.address) body.address = normAddr(body.address);
    if (body.city) body.city = normCity(body.city);
    if (body.state) body.state = normState(body.state);
    if (body.project_description) body.project_description = sentenceCase(body.project_description);
    // ---- END NORMALIZATION ----

    // Generate confirmation code and token
    const confirmationCode = generateConfirmationCode();
    const confirmationToken = generateUUID();

    // Default scheduling to "ASAP" if not provided
    const preferredDate = body.preferred_date || 'ASAP';
    const preferredTime = body.preferred_time || 'Flexible';

    // Build source string with referral info if applicable
    let sourceString: string = body.source;
    if (body.source === 'referral' && body.referral_source) {
      sourceString = `referral: ${body.referral_source}`;
    }

    // Insert lead - status is 'confirmed' (skip email confirmation for admin-created leads)
    //
    // Several columns on the `leads` table are NOT NULL (customer_email,
    // address, city, preferred_date, preferred_time). The admin form
    // legitimately allows blank values for some of those — substitute
    // empty strings instead of null so the INSERT doesn't fail.
    const result = await db.prepare(`
      INSERT INTO leads (
        confirmation_code, confirmation_token,
        customer_name, customer_email, customer_phone,
        address, city, state, zip,
        service_type, project_description,
        preferred_date, preferred_time,
        source, partner_id, status, confirmed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', CURRENT_TIMESTAMP)
    `).bind(
      confirmationCode,
      confirmationToken,
      body.customer_name,
      body.customer_email || '',
      body.customer_phone || null,
      body.address || '',
      body.city || '',
      body.state || 'MA',
      body.zip || null,
      body.service_type,
      body.project_description || null,
      preferredDate || 'ASAP',
      preferredTime || 'Flexible',
      sourceString,
      body.partner_id ? Number(body.partner_id) : null
    ).run();

    const leadId = result.meta.last_row_id;

    console.log(`[Admin] Direct lead created: ${confirmationCode} (ID: ${leadId}) by ${session.username}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Lead created successfully',
      lead: {
        id: leadId,
        confirmation_code: confirmationCode,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        address: body.address,
        city: body.city,
        service_type: body.service_type,
        source: sourceString,
        status: 'confirmed'
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error creating direct lead:', error?.message || error, error?.stack);
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to create lead: ${error?.message || 'Unknown error'}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
