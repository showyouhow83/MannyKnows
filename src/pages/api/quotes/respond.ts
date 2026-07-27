// Quote Response API Endpoint
// Handles customer accept/decline actions from email links
// POST: Accept or decline a quote (public, token-based auth)
import type { APIRoute } from 'astro';
import {
  sendQuoteAcceptedNotification,
  sendQuoteDeclinedNotification,
  sendQuoteAcceptanceToCustomer,
  type Quote as QuoteEmail
} from '../../../lib/quote-emails';
import { findOrCreateContact } from '../../../lib/contacts';
import { notifyAdmin } from '../../../lib/notify-admin';
import { getBrand } from '../../../lib/brand';
import { promoteQuoteDocuments } from '../../../lib/promoteDocuments';

interface RespondRequest {
  token: string;
  action: 'accept' | 'decline';
  decline_reason?: string;
  decline_feedback?: string;
  // Acceptance signature fields (required when action === 'accept').
  // signature_data_url: base64 PNG of the drawn signature.
  // signer_name: typed full legal name.
  // consent_text: verbatim ESIGN-consent string the customer ticked.
  signature_data_url?: string;
  signer_name?: string;
  consent_text?: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Service temporarily unavailable'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: RespondRequest = await request.json();

    // Validate request
    if (!body.token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request: token is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!body.action || !['accept', 'decline'].includes(body.action)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request: action must be accept or decline'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For decline, reason is required
    if (body.action === 'decline' && !body.decline_reason) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Please select a reason for declining'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Look up quote by token
    const quote = await db.prepare(
      'SELECT * FROM quotes WHERE quote_token = ?'
    ).bind(body.token).first();

    if (!quote) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote not found or link has expired'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if quote can still be responded to
    if (quote.status === 'accepted') {
      return new Response(JSON.stringify({
        success: false,
        error: 'This quote has already been accepted'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (quote.status === 'declined') {
      return new Response(JSON.stringify({
        success: false,
        error: 'This quote has already been declined'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (quote.status !== 'sent') {
      return new Response(JSON.stringify({
        success: false,
        error: 'This quote is no longer available for response'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Per-quote acceptance mode. Simple (default): one Accept button.
    // Advanced (require_signature=1): drawn signature required (ESIGN/UETA).
    const requireSig = !!(quote as any).require_signature;
    if (body.action === 'accept' && requireSig) {
      const sig = (body.signature_data_url || '').trim();
      const name = (body.signer_name || '').trim();
      const consent = (body.consent_text || '').trim();
      const looksLikePng = sig.startsWith('data:image/png;base64,') && sig.length > 200;
      if (!looksLikePng) {
        return new Response(JSON.stringify({
          success: false,
          error: 'A drawn signature is required to accept the quote.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      if (name.length < 2) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Please type your full legal name to accept.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      if (consent.length < 10) {
        return new Response(JSON.stringify({
          success: false,
          error: 'You must agree to the electronic signature consent to accept.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      // Cap the signature payload so a hostile client can't blow up D1 rows.
      if (sig.length > 400_000) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Signature image is too large. Please clear and re-sign.'
        }), { status: 413, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Update the quote based on action
    const newStatus = body.action === 'accept' ? 'accepted' : 'declined';

    if (body.action === 'accept') {
      // Capture audit trail. The IP comes from Cloudflare's CF-Connecting-IP
      // header (always present at the edge); user-agent from the standard
      // request header. Both are stored alongside the signature so the
      // acceptance is independently verifiable later.
      const ip = request.headers.get('cf-connecting-ip')
        || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || null;
      const ua = request.headers.get('user-agent') || null;

      // Always record an acceptance audit row. Advanced mode stores the drawn
      // signature + typed name + consent; Simple mode records a one-click
      // button acceptance (name falls back to the quote's customer name).
      const acceptName = (body.signer_name || '').trim() || (quote.customer_name as string) || 'Customer';
      const acceptConsent = requireSig
        ? (body.consent_text || '').trim()
        : 'Accepted via one-click Accept button (Simple mode).';
      await db.prepare(`
        INSERT OR REPLACE INTO quote_signatures
          (quote_id, signer_name, signature_data_url, consent_text, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        quote.id,
        acceptName,
        requireSig ? (body.signature_data_url || '') : '',
        acceptConsent,
        ip,
        ua,
      ).run();

      await db.prepare(`
        UPDATE quotes
        SET status = ?, responded_at = CURRENT_TIMESTAMP, promoted_by = 'customer', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(newStatus, quote.id).run();

      console.log(`[Quote] Quote ${quote.quote_number} accepted by customer (signed)`);

      // Auto-create project from accepted quote
      try {
        // Project number: for partner work, use the partner's ID code (set on
        // their profile, e.g. REN- / UHS-) so partner projects are branded by
        // code. Internal work keeps the quote_number (Lead → Quote → Project
        // identifier chain).
        let projectNumber = quote.quote_number as string;
        if (quote.partner_id) {
          const pr = await db.prepare('SELECT code FROM partners WHERE id = ? AND archived = 0')
            .bind(quote.partner_id).first() as { code: string | null } | null;
          if (pr?.code) {
            const prefix = String(pr.code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
            const ts = Date.now().toString(36).toUpperCase();
            const rand4 = Math.random().toString(36).substring(2, 6).toUpperCase();
            if (prefix) projectNumber = `${prefix}-${ts}-${rand4}`;
          }
        }

        // Generate tokens — full UUIDs (122-bit); these are the sole credential
        // for the client/crew portals, so they must not be enumerable.
        const clientToken = crypto.randomUUID();
        const crewToken = crypto.randomUUID();

        // Insert project
        await db.prepare(`
          INSERT INTO projects (
            quote_id, project_number, client_token, crew_token,
            customer_name, customer_email, customer_phone,
            customer_address, customer_city, customer_state, customer_zip,
            services, scope_description, total, internal_notes,
            partner_id, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'needs_crew', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          quote.id,
          projectNumber,
          clientToken,
          crewToken,
          quote.customer_name,
          quote.customer_email,
          quote.customer_phone,
          quote.address,
          quote.city,
          quote.state,
          quote.zip,
          quote.services,
          quote.scope_description,
          quote.total,
          quote.notes || null,          // carry the quote's internal notes into the project
          quote.partner_id || null // carry the partner tag forward (white-label)
        ).run();

        console.log(`[Project] Auto-created project ${projectNumber} from quote ${quote.quote_number}`);

        // Link contact to the new project
        try {
          const newProj = await db.prepare('SELECT id FROM projects WHERE quote_id = ? ORDER BY created_at DESC LIMIT 1').bind(quote.id).first();
          if (newProj) {
            await findOrCreateContact(db, {
              name: quote.customer_name as string,
              email: quote.customer_email as string,
              phone: quote.customer_phone as string,
              zip: quote.zip as string,
              address: quote.address as string,
            }, { type: 'project', id: newProj.id as number });
          }
        } catch (contactErr) {
          console.error('[Project] Failed to link contact:', contactErr);
        }

        // Migrate quote images to project_updates as "before" shots. Prefer the
        // STARRED images (pdf_image_urls) the admin curated for the crew +
        // customer; fall back to all quote images if none were starred.
        try {
          const quoteImages = quote.project_images ? JSON.parse(quote.project_images as string) : [];
          let starred: string[] = [];
          try { starred = quote.pdf_image_urls ? JSON.parse(quote.pdf_image_urls as string) : []; } catch {}
          const starredSet = new Set(Array.isArray(starred) ? starred.filter(Boolean) : []);
          if (quoteImages.length > 0) {
            const newProject = await db.prepare(
              'SELECT id FROM projects WHERE quote_id = ? ORDER BY created_at DESC LIMIT 1'
            ).bind(quote.id).first();
            if (newProject) {
              for (const imageUrl of quoteImages) {
                await db.prepare(`
                  INSERT INTO project_updates (project_id, image_url, note, posted_by, posted_by_name, is_starred, created_at)
                  VALUES (?, ?, NULL, 'quote_migration', 'Quote Reference', ?, CURRENT_TIMESTAMP)
                `).bind(newProject.id, imageUrl, starredSet.has(imageUrl) ? 1 : 0).run();
              }
              console.log(`[Project] Migrated ${quoteImages.length} images (${starredSet.size} starred) to project_updates`);
            }
          }
        } catch (imgErr) {
          console.error('[Project] Failed to migrate quote images:', imgErr);
        }

        // Promote the quote's PDF attachments into project_documents.
        try {
          const newProject = await db.prepare(
            'SELECT id FROM projects WHERE quote_id = ? ORDER BY created_at DESC LIMIT 1'
          ).bind(quote.id).first();
          if (newProject) await promoteQuoteDocuments(db, quote.id as number, newProject.id as number);
        } catch (docErr) {
          console.error('[Project] Failed to promote quote documents:', docErr);
        }

        // Update quote status to 'project' to remove from "Ready to Promote"
        await db.prepare(
          "UPDATE quotes SET status = 'project', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(quote.id).run();

        console.log(`[Quote] Updated quote ${quote.quote_number} status to 'project'`);
      } catch (projectError) {
        console.error('[Project] Failed to auto-create project:', projectError);
        // Don't fail the quote acceptance if project creation fails
      }
    } else {
      await db.prepare(`
        UPDATE quotes
        SET status = ?, responded_at = CURRENT_TIMESTAMP,
            decline_reason = ?, decline_feedback = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        newStatus,
        body.decline_reason,
        body.decline_feedback || null,
        quote.id
      ).run();

      console.log(`[Quote] Quote ${quote.quote_number} declined by customer: ${body.decline_reason}`);
    }

    // Alert admin (email + SMS). Additive + best-effort.
    try {
      const isAccept = newStatus === 'accepted';
      await notifyAdmin(env, {
        subject: `Quote ${isAccept ? 'accepted' : 'declined'} (${quote.quote_number})`,
        body: `${quote.customer_name || 'Customer'} ${isAccept ? 'accepted' : 'declined'} their quote.${!isAccept && body.decline_reason ? ` Reason: ${body.decline_reason}` : ''}`,
        link: isAccept ? '/admin/projects' : `/admin/quotes?open=${quote.id}`,
      });
    } catch (e) { console.error('[Quote respond] admin notify failed:', e); }

    // Send notification email to admin
    const resendApiKey = env?.RESEND_API_KEY;
    const notificationEmail = env?.NOTIFICATION_EMAIL;

    if (resendApiKey && notificationEmail) {
      const origin = request.headers.get('origin') || '';
      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

      // Build quote object for email
      const quoteForEmail: QuoteEmail = {
        id: quote.id as number,
        quote_number: quote.quote_number as string,
        quote_token: quote.quote_token as string,
        customer_name: quote.customer_name as string,
        customer_email: quote.customer_email as string,
        customer_phone: quote.customer_phone as string | undefined,
        address: quote.address as string | undefined,
        city: quote.city as string | undefined,
        state: quote.state as string | undefined,
        zip: quote.zip as string | undefined,
        services: quote.services as string | undefined,
        scope_description: quote.scope_description as string | undefined,
        // Legacy passthrough so quoteToScopes() can synthesize a scope for
        // pre-Phase-5 quotes that still have data here instead of template_sections.
        materials: quote.materials as string | undefined,
        labor: quote.labor as string | undefined,
        labor_total: quote.labor_total as number | undefined,
        subtotal: quote.subtotal as number | undefined,
        discount: quote.discount as number | undefined,
        total: quote.total as number | undefined,
        estimated_start: quote.estimated_start as string | undefined,
        estimated_end: quote.estimated_end as string | undefined,
        estimated_duration: quote.estimated_duration as string | undefined,
      };

      const emailEnv = { RESEND_API_KEY: resendApiKey, NOTIFICATION_EMAIL: notificationEmail };

      try {
        if (body.action === 'accept') {
          await sendQuoteAcceptedNotification(quoteForEmail, emailEnv, isLocalhost);
          console.log(`[Quote] Accept notification sent for ${quote.quote_number}`);
          // Also confirm to the CUSTOMER (white-label aware). Best-effort.
          // Link the customer's PROJECT PORTAL, not a generated PDF: at accept
          // time the signed PDF (with the acceptance/audit section) hasn't been
          // generated yet — it's produced client-side moments later — so any PDF
          // we link here would be stale/missing the acceptance block. The portal
          // always exists (project auto-created above) and always shows the
          // correct, current documents.
          try {
            const brand = await getBrand(db, (quote as any).partner_id);
            const proj = await db.prepare(
              'SELECT client_token FROM projects WHERE quote_id = ? ORDER BY created_at DESC LIMIT 1'
            ).bind(quote.id).first() as { client_token: string | null } | null;
            const portalBase = isLocalhost ? 'http://localhost:4321' : 'https://mannyknows.com';
            const portalUrl = proj?.client_token ? `${portalBase}/project/${proj.client_token}` : null;
            await sendQuoteAcceptanceToCustomer(quoteForEmail, emailEnv, isLocalhost, brand, null, portalUrl);
            console.log(`[Quote] Acceptance confirmation sent to customer for ${quote.quote_number}`);
          } catch (custErr) {
            console.error('[Quote] customer acceptance email failed:', custErr);
          }
        } else {
          await sendQuoteDeclinedNotification(
            quoteForEmail,
            body.decline_reason!,
            body.decline_feedback,
            emailEnv,
            isLocalhost
          );
          console.log(`[Quote] Decline notification sent for ${quote.quote_number}`);
        }
      } catch (emailError) {
        console.error('[Quote] Failed to send notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: body.action === 'accept'
        ? 'Quote accepted successfully! We will contact you shortly.'
        : 'Quote declined. Thank you for your feedback.',
      // `quote_id` is returned so the customer-side accept page can kick
      // off the hidden-iframe autosave that generates the "Estimate —
      // Signed" PDF. Without it the client would need a separate lookup.
      quote_id: quote.id,
      quote_number: quote.quote_number,
      status: newStatus
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing quote response:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process response. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
