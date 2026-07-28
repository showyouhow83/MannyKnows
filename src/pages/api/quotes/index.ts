// Quotes API Endpoint - Lead to Quote Promotion System
// GET: List quotes (admin only)
// POST: Create quote from lead (promote) (admin only)
// PATCH: Update quote (admin only)
// DELETE: Delete quote (admin only)
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';
import { sendQuoteToCustomer, sendRenegotiatedQuoteToCustomer, type Quote as QuoteEmail, type RenegotiationData } from '../../../lib/quote-emails';
import { findOrCreateContact, unlinkContact } from '../../../lib/contacts';
import { getBrand } from '../../../lib/brand';
import { normName, normEmail, normAddr, normCity, normState, sentenceCase } from '../../../lib/textNorm';
import { parseScopes, sumSubtotals } from '../../../lib/quoteTemplateConstants';

interface QuoteCreateRequest {
  lead_id: number;
}

interface QuoteUpdateRequest {
  quote_id: number;
  require_signature?: boolean | number;
  partner_id?: number | string | null;
  expected_updated_at?: string; // optimistic-lock token (the updated_at the client loaded)
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  services?: string[] | Array<{ type: string; scope: string }>;
  scope_description?: string;
  year_built?: string;
  repairs_needed?: string;
  preferred_brand?: string;
  budget?: number;
  estimated_start?: string;
  estimated_end?: string;
  estimated_duration?: string;
  preferred_date?: string | null;
  preferred_time?: string | null;
  contract_url?: string | null;
  discount?: number;
  notes?: Array<{ date: string; note: string; author?: string }>;
  project_images?: string[];
  pdf_images?: string[];
  allow_empty_scopes?: boolean;
  status?: 'draft' | 'sent' | 'accepted' | 'declined' | 'failed' | 'cold';
  admin_response?: string;
  promoted_by?: 'customer' | 'admin';
  follow_up_count?: number;
  // Quote-template support (v63). template_id is the FK; template_sections is
  // the per-quote editable copy of the template's sections (sections may also
  // be wholly admin-authored without a parent template).
  template_id?: number | null;
  template_sections?: Array<{
    id: string;
    title: string;
    items: Array<Record<string, unknown>>;
  }> | null;
}

// GET: List all quotes
export const GET: APIRoute = async ({ request, locals, url }) => {
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

    const status = url.searchParams.get('status');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = 'SELECT * FROM quotes';
    const params: (string | number)[] = [];

    // Filter by status, excluding 'failed' by default (hidden from UI)
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    } else {
      query += ' WHERE status != ?';
      params.push('failed');
    }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.prepare(query).bind(...params).all();

    // Get counts by status
    const counts = await db.prepare(`
      SELECT status, COUNT(*) as count FROM quotes GROUP BY status
    `).all();

    const statusCounts: Record<string, number> = {};
    for (const row of counts.results as Array<{ status: string; count: number }>) {
      statusCounts[row.status] = row.count;
    }

    return new Response(JSON.stringify({
      success: true,
      quotes: result.results,
      total: result.results.length,
      statusCounts
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching quotes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch quotes'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Create quote from lead (promotion)
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

    const body: QuoteCreateRequest = await request.json() as any;

    if (!body.lead_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'lead_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch the lead
    const lead = await db.prepare(`
      SELECT * FROM leads WHERE id = ?
    `).bind(body.lead_id).first();

    if (!lead) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Lead not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if a quote already exists for this lead OR with the same quote_number.
    // The lead.status flag can drift out of sync if a previous promotion partially
    // failed, so we always trust the quotes table as source of truth.
    const quoteNumber = lead.confirmation_code as string;
    const existingQuote = await db.prepare(`
      SELECT id, quote_number FROM quotes WHERE lead_id = ? OR quote_number = ?
    `).bind(body.lead_id, quoteNumber).first();

    if (existingQuote) {
      // Heal: ensure the lead's status reflects reality
      if (lead.status !== 'promoted') {
        await db.prepare(`
          UPDATE leads SET status = 'promoted', updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(body.lead_id).run();
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Lead is already promoted to a quote',
        existing_quote_id: existingQuote.id,
        existing_quote_number: existingQuote.quote_number
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create the quote from lead data (including images + appointment info)
    const result = await db.prepare(`
      INSERT INTO quotes (
        lead_id, quote_number,
        customer_name, customer_email, customer_phone, company_name,
        address, city, state, zip,
        services, scope_description,
        year_built, repairs_needed, preferred_brand,
        preferred_date, preferred_time,
        project_images,
        partner_id,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).bind(
      body.lead_id,
      quoteNumber,
      lead.customer_name,
      lead.customer_email,
      lead.customer_phone,
      lead.company_name || null,
      lead.address,
      lead.city,
      lead.state,
      lead.zip,
      JSON.stringify([lead.service_type]),
      lead.project_description,
      null, // year_built - to be filled during call
      null, // repairs_needed - to be filled during call
      null, // preferred_brand - to be filled during call
      lead.preferred_date || null,
      lead.preferred_time || null,
      lead.project_images || '[]', // Copy images from lead
      lead.partner_id || null // carry the partner tag forward (white-label)
    ).run();

    const quoteId = result.meta.last_row_id;

    // Update lead status to 'promoted'
    await db.prepare(`
      UPDATE leads SET status = 'promoted', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(body.lead_id).run();

    console.log(`[Quote] Lead ${body.lead_id} promoted to Quote ${quoteId} (${quoteNumber})`);

    // Link contact to the new quote
    try {
      await findOrCreateContact(db, {
        name: lead.customer_name as string,
        email: lead.customer_email as string,
        phone: lead.customer_phone as string,
        zip: lead.zip as string,
        address: lead.address as string,
      }, { type: 'quote', id: quoteId as number });
    } catch (contactErr) {
      console.error('[Quote] Failed to link contact:', contactErr);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Lead promoted to quote successfully',
      quote_id: quoteId,
      quote_number: quoteNumber
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating quote:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create quote'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH: Update quote
export const PATCH: APIRoute = async ({ request, locals }) => {
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

    const body: QuoteUpdateRequest = await request.json() as any;

    if (!body.quote_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'quote_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if quote exists
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

    // Optimistic concurrency guard (Layer 2). If the client tells us which
    // version it loaded and the row has changed since, refuse the save rather
    // than silently clobber a coworker's edits. `expected_updated_at` is
    // optional, so older clients / non-form callers still work.
    if (body.expected_updated_at && (quote as any).updated_at &&
        String(body.expected_updated_at) !== String((quote as any).updated_at)) {
      return new Response(JSON.stringify({
        success: false,
        conflict: true,
        error: 'conflict',
        message: 'This quote was changed by someone else since you opened it. Reload to see their changes before saving.',
        current_updated_at: (quote as any).updated_at,
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ---- TEXT NORMALIZATION (Layer 1: instant case fix) ----
    if (body.customer_name) body.customer_name = normName(body.customer_name);
    if (body.customer_email) body.customer_email = normEmail(body.customer_email);
    if (body.address) body.address = normAddr(body.address);
    if (body.city) body.city = normCity(body.city);
    if (body.state) body.state = normState(body.state);
    if (body.scope_description) body.scope_description = sentenceCase(body.scope_description);
    if (body.repairs_needed) body.repairs_needed = sentenceCase(body.repairs_needed);
    // ---- END NORMALIZATION ----

    // Build update query dynamically
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    const fields: Array<[keyof QuoteUpdateRequest, string]> = [
      ['customer_name', 'customer_name'],
      ['customer_email', 'customer_email'],
      ['customer_phone', 'customer_phone'],
      ['address', 'address'],
      ['city', 'city'],
      ['state', 'state'],
      ['zip', 'zip'],
      ['scope_description', 'scope_description'],
      ['year_built', 'year_built'],
      ['repairs_needed', 'repairs_needed'],
      ['preferred_brand', 'preferred_brand'],
      ['budget', 'budget'],
      ['estimated_start', 'estimated_start'],
      ['estimated_end', 'estimated_end'],
      ['estimated_duration', 'estimated_duration'],
      ['preferred_date', 'preferred_date'],
      ['preferred_time', 'preferred_time'],
      ['discount', 'discount'],
      ['status', 'status'],
      ['admin_response', 'admin_response'],
      ['promoted_by', 'promoted_by'],
      ['contract_url', 'contract_url'],
      ['follow_up_count', 'follow_up_count'],
      ['template_id', 'template_id'],
    ];

    for (const [bodyField, dbField] of fields) {
      if (body[bodyField] !== undefined) {
        updates.push(`${dbField} = ?`);
        params.push(body[bodyField] as string | number | null);
      }
    }

    // Per-quote acceptance mode: 1 = require signature (Advanced), 0 = Simple.
    if (body.require_signature !== undefined) {
      updates.push('require_signature = ?');
      params.push(body.require_signature ? 1 : 0);
    }

    // Handle JSON fields
    if (body.services !== undefined) {
      updates.push('services = ?');
      params.push(JSON.stringify(body.services));
    }
    // Phase 5: legacy `materials` / `labor` payload fields are no longer
    // written. All work + pricing lives in template_sections (scopes).
    if (body.notes !== undefined) {
      updates.push('notes = ?');
      params.push(JSON.stringify(body.notes));
    }
    // Partner white-label tag ('' / 0 / null clears it back to internal/SL).
    if (body.partner_id !== undefined) {
      const pid = body.partner_id ? parseInt(String(body.partner_id), 10) : null;
      updates.push('partner_id = ?');
      params.push(pid && !isNaN(pid) ? pid : null);
    }
    // Safety guard against accidental scope wipes. The quote editor seeds a
    // blank "Main scope" when it thinks a quote has no scopes; if a Save fires
    // while that blank seed is in memory (e.g. a load race), it would overwrite
    // real scope content + zero the total. So: refuse to replace non-empty
    // scopes with an empty payload unless the caller explicitly opts in
    // (allow_empty_scopes: true — sent by the intentional "Clear all scopes").
    const countItems = (raw: string | null): number => {
      let n = 0;
      for (const sc of parseScopes(raw)) for (const sec of (sc.sections || [])) n += (sec.items || []).length;
      return n;
    };
    let skipScopeWrite = false;
    if (body.template_sections !== undefined && body.allow_empty_scopes !== true) {
      const incoming = body.template_sections === null ? null : JSON.stringify(body.template_sections);
      if (countItems(incoming) === 0 && countItems(quote.template_sections as string | null) > 0) {
        skipScopeWrite = true;
        console.warn(`[quotes PATCH] Blocked empty template_sections overwrite for quote ${body.quote_id} — kept existing scopes. (allow_empty_scopes:true to force.)`);
      }
    }

    if (body.template_sections !== undefined && !skipScopeWrite) {
      updates.push('template_sections = ?');
      params.push(body.template_sections === null ? null : JSON.stringify(body.template_sections));
    }
    if (body.project_images !== undefined) {
      updates.push('project_images = ?');
      params.push(JSON.stringify(body.project_images));
    }
    if (body.pdf_images !== undefined) {
      updates.push('pdf_image_urls = ?');
      params.push(JSON.stringify(body.pdf_images));
    }

    // Recompute subtotal + total whenever the discount or template_sections
    // change. Total = sum of every scope's Subtotal items − discount.
    const templateSectionsChanged = body.template_sections !== undefined && !skipScopeWrite;
    if (body.discount !== undefined || templateSectionsChanged) {
      // Effective sections: the new payload if present, otherwise the
      // currently-stored sections (so a discount-only edit still respects
      // scope-driven pricing).
      const effectiveSectionsRaw: string | null = templateSectionsChanged
        ? (body.template_sections === null ? null : JSON.stringify(body.template_sections))
        : (quote.template_sections as string | null);
      // parseScopes wraps legacy flat data transparently so this works for
      // both new (scoped) and old (flat) template_sections shapes.
      const effectiveScopes = parseScopes(effectiveSectionsRaw);
      const subtotal = sumSubtotals(effectiveScopes);
      const discount = body.discount !== undefined ? body.discount : (quote.discount as number || 0);
      const total = subtotal - discount;

      updates.push('subtotal = ?');
      params.push(subtotal);
      updates.push('total = ?');
      params.push(total);
    }

    // Track if we're sending the quote (for email after update)
    let sendingQuote = false;
    let quoteToken: string | null = null;

    // Handle status change side effects. Fire the customer email whenever
    // the admin explicitly sets status to 'sent' — including a resend from
    // an already-'sent' quote (common when the admin tweaks the quote and
    // clicks Send again). Only refuse for terminal states (accepted/project).
    if (body.status === 'sent') {
      if (quote.status === 'accepted') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Cannot re-send a quote that has already been accepted. Reset or demote it first.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (quote.status === 'project') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Cannot re-send a quote that has been promoted to a project.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      updates.push('sent_at = CURRENT_TIMESTAMP');
      // If reactivating from cold, reset follow-up tracking
      if (quote.status === 'cold') {
        updates.push('follow_up_count = 0');
        updates.push('last_follow_up_at = NULL');
      }

      // First-time send: mint a quote_token so the customer can access the
      // accept link. Resends keep the existing token so any link the
      // customer already has continues to work.
      if (!quote.quote_token) {
        quoteToken = crypto.randomUUID();
        updates.push('quote_token = ?');
        params.push(quoteToken);
      } else {
        quoteToken = quote.quote_token as string;
      }

      // Validate email exists before sending
      const customerEmail = body.customer_email || quote.customer_email;
      if (!customerEmail) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Customer email is required to send quote'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      sendingQuote = true;
    }
    if (['accepted', 'declined'].includes(body.status || '') && !['accepted', 'declined'].includes(quote.status as string)) {
      updates.push('responded_at = CURRENT_TIMESTAMP');
    }

    // Handle renegotiation
    if (body.status === 'draft' && quote.status === 'declined') {
      updates.push('is_renegotiation = 1');
      updates.push('renegotiation_count = ?');
      params.push((quote.renegotiation_count as number || 0) + 1);
    }

    // Handle accept decline (mark both quote and lead as failed)
    if (body.status === 'failed') {
      // Update the lead status to failed as well
      await db.prepare(`
        UPDATE leads SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(quote.lead_id).run();

      console.log(`[Quote] Quote ${body.quote_id} and Lead ${quote.lead_id} marked as failed`);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No fields to update'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(body.quote_id);

    await db.prepare(`UPDATE quotes SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

    // Fetch updated quote
    const updated = await db.prepare('SELECT * FROM quotes WHERE id = ?').bind(body.quote_id).first();

    console.log(`[Quote] Quote ${body.quote_id} updated`);

    // Backfill contact with any new address/city/state/zip from this quote save
    // Only fills EMPTY contact fields — never overwrites existing data
    if (updated && (body.address || body.city || body.state || body.zip || body.customer_name || body.customer_email || body.customer_phone)) {
      try {
        const contactLink = await db.prepare(
          "SELECT contact_id FROM contact_links WHERE link_type = 'quote' AND link_id = ?"
        ).bind(body.quote_id).first() as any;

        if (contactLink?.contact_id) {
          const contact = await db.prepare('SELECT * FROM contacts WHERE id = ?').bind(contactLink.contact_id).first() as any;
          if (contact) {
            const backfills: string[] = [];
            const backfillParams: any[] = [];

            if (updated.address && !contact.address) { backfills.push('address = ?'); backfillParams.push(updated.address); }
            if (updated.city && !contact.city) { backfills.push('city = ?'); backfillParams.push(updated.city); }
            if ((updated.state) && !contact.state) { backfills.push('state = ?'); backfillParams.push(updated.state); }
            if (updated.zip && !contact.zip) { backfills.push('zip = ?'); backfillParams.push(updated.zip); }
            if (updated.customer_phone && !contact.phone) { backfills.push('phone = ?'); backfillParams.push(updated.customer_phone); }

            if (backfills.length > 0) {
              backfills.push('updated_at = CURRENT_TIMESTAMP');
              backfillParams.push(contactLink.contact_id);
              await db.prepare(`UPDATE contacts SET ${backfills.join(', ')} WHERE id = ?`).bind(...backfillParams).run();
              console.log(`[Quote] Backfilled ${backfills.length - 1} fields to contact ${contactLink.contact_id}`);
            }
          }
        }
      } catch (contactErr) {
        console.error('[Quote] Contact backfill error:', contactErr);
      }
    }

    // Send email if quote status changed to 'sent'
    let emailSent = false;
    let emailError: string | undefined;

    if (sendingQuote && updated) {
      const resendApiKey = env?.RESEND_API_KEY;
      const notificationEmail = env?.NOTIFICATION_EMAIL;

      if (resendApiKey) {
        // Check if this is localhost
        const origin = request.headers.get('origin') || '';
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

        // Build quote object for email
        // Load multi-attachment list to include in the email
        let attachments: Array<{ id: number; label: string; file_url: string; file_name?: string | null }> = [];
        try {
          const attRes = await db.prepare(`
            SELECT id, label, file_url, file_name FROM quote_attachments
             WHERE quote_id = ? ORDER BY uploaded_at ASC, id ASC
          `).bind(updated.id).all();
          attachments = (attRes.results || []) as typeof attachments;
        } catch (err) {
          console.warn('[Quote] Failed to load attachments for email:', err);
        }

        const quoteForEmail: QuoteEmail = {
          id: updated.id as number,
          quote_number: updated.quote_number as string,
          quote_token: quoteToken || updated.quote_token as string,
          customer_name: updated.customer_name as string,
          customer_email: updated.customer_email as string,
          customer_phone: updated.customer_phone as string | undefined,
          address: updated.address as string | undefined,
          city: updated.city as string | undefined,
          state: updated.state as string | undefined,
          zip: updated.zip as string | undefined,
          services: updated.services as string | undefined,
          scope_description: updated.scope_description as string | undefined,
          // Legacy passthrough — see quoteToScopes() in quoteTemplateConstants.
          materials: updated.materials as string | undefined,
          labor: updated.labor as string | undefined,
          labor_total: updated.labor_total as number | undefined,
          subtotal: updated.subtotal as number | undefined,
          discount: updated.discount as number | undefined,
          total: updated.total as number | undefined,
          estimated_start: updated.estimated_start as string | undefined,
          estimated_end: updated.estimated_end as string | undefined,
          estimated_duration: updated.estimated_duration as string | undefined,
          contract_url: updated.contract_url as string | undefined, // legacy fallback
          attachments,
          template_sections: updated.template_sections as string | undefined,
        };

        // Use renegotiation template if this is a renegotiated quote
        const isRenegotiation = updated.is_renegotiation === 1;
        let emailResult;

        if (isRenegotiation) {
          // Calculate previous total (current total + discount gives approximate previous)
          const currentTotal = (updated.total as number) || 0;
          const discount = (updated.discount as number) || 0;
          const previousTotal = currentTotal + discount;

          const renegotiationData: RenegotiationData = {
            previousTotal,
            newTotal: currentTotal,
            customerFeedback: (updated.decline_feedback as string) || undefined,
            declineReason: (updated.decline_reason as string) || undefined,
            revisionNumber: (updated.renegotiation_count as number) || 1,
          };

          const brand = await getBrand(db, (updated as any).partner_id);
          emailResult = await sendRenegotiatedQuoteToCustomer(
            quoteForEmail,
            renegotiationData,
            { RESEND_API_KEY: resendApiKey, NOTIFICATION_EMAIL: notificationEmail || '' },
            isLocalhost,
            brand
          );
        } else {
          const brand = await getBrand(db, (updated as any).partner_id);
          emailResult = await sendQuoteToCustomer(
            quoteForEmail,
            { RESEND_API_KEY: resendApiKey, NOTIFICATION_EMAIL: notificationEmail || '' },
            isLocalhost,
            brand
          );
        }

        emailSent = emailResult.success;
        emailError = emailResult.error;

        if (emailSent) {
          console.log(`[Quote] ${isRenegotiation ? 'Renegotiation' : ''} Email sent to ${updated.customer_email} for quote ${updated.quote_number}`);
        } else {
          console.error(`[Quote] Failed to send email for quote ${updated.quote_number}:`, emailError);
        }
      } else {
        emailError = 'RESEND_API_KEY not configured';
        console.error(`[Quote] Cannot send email: ${emailError}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: sendingQuote
        ? (emailSent ? 'Quote sent to customer successfully' : `Quote updated but email failed: ${emailError}`)
        : 'Quote updated successfully',
      quote: updated,
      emailSent,
      emailError
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating quote:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update quote'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Delete quote
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

    const quoteId = url.searchParams.get('id');
    const deleteLead = url.searchParams.get('delete_lead') === 'true';

    if (!quoteId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'quote id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the quote first to find the lead_id
    const quote = await db.prepare('SELECT lead_id FROM quotes WHERE id = ?').bind(quoteId).first();

    if (!quote) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // CASCADE DELETE: Check if there's a Project linked to this Quote
    // Demoting Quote → Lead means destroying all layers above (Project, Quote)
    const linkedProject = await db.prepare('SELECT id FROM projects WHERE quote_id = ?').bind(quoteId).first();

    if (linkedProject) {
      // Remove contact link for project (keep contact)
      try { await unlinkContact(db, 'project', linkedProject.id as number); } catch {}
      // Delete project_updates first (foreign key constraint)
      await db.prepare('DELETE FROM project_updates WHERE project_id = ?').bind(linkedProject.id).run();
      // Delete the project
      await db.prepare('DELETE FROM projects WHERE id = ?').bind(linkedProject.id).run();
      console.log(`[Quote] Cascade deleted Project ${linkedProject.id} linked to Quote ${quoteId}`);
    }

    // Delete messages referencing this quote (foreign key constraint)
    await db.prepare('DELETE FROM messages WHERE quote_id = ?').bind(quoteId).run();

    // Remove contact link for quote (keep contact)
    try { await unlinkContact(db, 'quote', parseInt(quoteId as string)); } catch {}

    // Delete the quote
    await db.prepare('DELETE FROM quotes WHERE id = ?').bind(quoteId).run();

    if (deleteLead) {
      // Delete Permanently - delete both quote and lead (keep contacts)
      try { await unlinkContact(db, 'lead', quote.lead_id as number); } catch {}
      await db.prepare('DELETE FROM messages WHERE lead_id = ?').bind(quote.lead_id).run();
      await db.prepare('DELETE FROM leads WHERE id = ?').bind(quote.lead_id).run();
      console.log(`[Quote] Quote ${quoteId} and Lead ${quote.lead_id} permanently deleted`);
    } else {
      // Return lead to confirmed status (demote)
      await db.prepare(`
        UPDATE leads SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(quote.lead_id).run();
      console.log(`[Quote] Quote ${quoteId} deleted, Lead ${quote.lead_id} returned to confirmed`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: deleteLead
        ? 'Quote and lead permanently deleted'
        : 'Quote deleted, lead returned to confirmed status',
      project_deleted: linkedProject ? linkedProject.id : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting quote:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete quote'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
