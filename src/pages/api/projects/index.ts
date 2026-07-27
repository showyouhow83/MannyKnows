// Projects API Endpoint
// GET: List all projects (admin only)
// POST: Create project from accepted quote (admin only)
// PATCH: Update project (admin only)
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';
import { sendProjectUpdateNotification, sendProjectStartedToClient, sendProjectStartedToCrewLead, type Project as ProjectEmail, type ProjectStartData, type QuoteEmailEnv } from '../../../lib/quote-emails';
import { findOrCreateContact, unlinkContact } from '../../../lib/contacts';
import { normName, normEmail, sentenceCase } from '../../../lib/textNorm';
import { promoteQuoteDocuments } from '../../../lib/promoteDocuments';
import { getBrand } from '../../../lib/brand';
import { generatePortfolioCopy, formatCity } from '../../../lib/portfolio-copy';
import { SERVICE_LABELS } from '../../../data/serviceTypes';

interface ProjectCreateRequest {
  quote_id: number;
  send_notification?: boolean;
}

interface ProjectUpdateRequest {
  project_id: number;
  crew_lead_id?: number | null;
  crew_notes?: string;
  internal_notes?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  scope_description?: string | null;
  company_name?: string | null;
  total?: number;
  partner_id?: number | string | null;
  status?: 'needs_crew' | 'in_progress' | 'completed' | 'portfolio';
}

// GET: List all projects
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get query params for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    // Build query
    let query = `
      SELECT p.*, cl.name as crew_lead_name, cl.email as crew_lead_email, cl.phone as crew_lead_phone
      FROM projects p
      LEFT JOIN crew_leads cl ON p.crew_lead_id = cl.id
    `;
    const params: any[] = [];

    if (status) {
      query += ' WHERE p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const result = params.length > 0
      ? await db.prepare(query).bind(...params).all()
      : await db.prepare(query).all();

    return new Response(JSON.stringify({
      success: true,
      projects: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch projects'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Create project from accepted quote
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: ProjectCreateRequest = await request.json();

    // ── Direct create: a project with no originating quote (already-won work,
    // typically a partner job). quote_id stays NULL. project_number is prefixed
    // with the partner code (e.g. REN-…) for partner jobs, or MK-… internal. ──
    if ((body as any).direct) {
      const b = body as any;
      const name = normName(String(b.customer_name || '').trim());
      if (!name) {
        return new Response(JSON.stringify({ success: false, error: 'Customer name is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      const partnerId = b.partner_id ? parseInt(String(b.partner_id), 10) : null;
      let prefix = 'MK';
      if (partnerId) {
        const pr = await db.prepare('SELECT code FROM partners WHERE id = ? AND archived = 0').bind(partnerId).first() as any;
        if (pr?.code) prefix = String(pr.code).toUpperCase();
      }
      const ts = Date.now().toString(36).toUpperCase();
      const rand4 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const projectNumber = `${prefix}-${ts}-${rand4}`;
      const clientToken = crypto.randomUUID();
      const crewToken = crypto.randomUUID();
      const status = ['needs_crew', 'in_progress', 'completed'].includes(b.status) ? b.status : 'needs_crew';
      const result = await db.prepare(`
        INSERT INTO projects (
          quote_id, project_number, customer_name, customer_email, customer_phone,
          customer_address, customer_city, customer_state, customer_zip,
          services, scope_description, total, scheduled_start, scheduled_end,
          client_token, crew_token, partner_id, status
        ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        projectNumber, name,
        b.customer_email ? normEmail(String(b.customer_email)) : null,
        b.customer_phone || null, b.customer_address || null, b.customer_city || null,
        b.customer_state || 'MA', b.customer_zip || null,
        b.services ? (typeof b.services === 'string' ? b.services : JSON.stringify(b.services)) : null,
        b.scope_description ? sentenceCase(String(b.scope_description)) : null,
        b.total != null && b.total !== '' ? Number(b.total) : null,
        b.scheduled_start || null, b.scheduled_end || null,
        clientToken, crewToken, partnerId, status
      ).run();
      const newId = result.meta.last_row_id;
      try {
        await findOrCreateContact(db, {
          name, email: b.customer_email as string, phone: b.customer_phone as string,
          zip: b.customer_zip as string, address: b.customer_address as string,
        }, { type: 'project', id: newId as number });
      } catch (contactErr) {
        console.error('[Project direct] contact link failed:', contactErr);
      }
      const created = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(newId).first();
      console.log(`[Project] Direct-created ${projectNumber}${partnerId ? ` (partner ${partnerId})` : ''}`);
      return new Response(JSON.stringify({ success: true, project: created, project_id: newId, project_number: projectNumber }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    if (!body.quote_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch the quote
    const quote = await db.prepare(
      'SELECT * FROM quotes WHERE id = ?'
    ).bind(body.quote_id).first();

    if (!quote) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if project already exists for this quote
    const existingProject = await db.prepare(
      'SELECT id FROM projects WHERE quote_id = ?'
    ).bind(body.quote_id).first();

    if (existingProject) {
      // Ensure quote status is updated even if project already exists
      // This fixes the case where quote stays in "Ready to Promote" after promotion
      await db.prepare(
        "UPDATE quotes SET status = 'project', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'project'"
      ).bind(body.quote_id).run();

      return new Response(JSON.stringify({
        success: false,
        error: 'A project already exists for this quote'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate tokens
    const clientToken = crypto.randomUUID();
    const crewToken = crypto.randomUUID().substring(0, 8); // Shorter token for crew

    // Project number: for partner work, use the partner's ID code (set on their
    // profile, e.g. REN- / UHS-). Internal work keeps the quote_number (Lead →
    // Quote → Project identifier chain).
    let promotedProjectNumber = quote.quote_number as string;
    if (quote.partner_id) {
      const pr = await db.prepare('SELECT code FROM partners WHERE id = ? AND archived = 0')
        .bind(quote.partner_id).first() as { code: string | null } | null;
      if (pr?.code) {
        const prefix = String(pr.code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        const ts = Date.now().toString(36).toUpperCase();
        const rand4 = Math.random().toString(36).substring(2, 6).toUpperCase();
        if (prefix) promotedProjectNumber = `${prefix}-${ts}-${rand4}`;
      }
    }

    // Create the project (normalize text from quote). Scope content comes from
    // the quote's template_sections at display time — no longer copied here.
    const result = await db.prepare(`
      INSERT INTO projects (
        quote_id, project_number,
        customer_name, customer_email, customer_phone,
        customer_address, customer_city, customer_state, customer_zip,
        services, scope_description, total,
        client_token, crew_token, partner_id, internal_notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'needs_crew')
    `).bind(
      body.quote_id,
      promotedProjectNumber,
      normName(quote.customer_name as string),
      normEmail(quote.customer_email as string),
      quote.customer_phone,
      quote.address,
      quote.city,
      quote.state || 'MA',
      quote.zip,
      quote.services,
      sentenceCase(quote.scope_description as string),
      quote.total,
      clientToken,
      crewToken,
      quote.partner_id || null, // carry the partner tag forward (white-label)
      quote.notes || null // carry the quote's internal notes forward (admin-only)
    ).run();

    // Update quote status to 'project' to indicate it's been promoted
    // Set promoted_by = 'admin' if not already set (customer approval sets it to 'customer')
    await db.prepare(
      "UPDATE quotes SET status = 'project', promoted_by = COALESCE(promoted_by, 'admin'), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(body.quote_id).run();

    // Fetch the created project
    const project = await db.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    console.log(`[Project] Created project ${quote.quote_number} from quote ${body.quote_id}`);

    // Migrate quote images to project_updates as "before" shots
    const projectId = result.meta.last_row_id;

    // Link contact to the new project
    try {
      await findOrCreateContact(db, {
        name: quote.customer_name as string,
        email: quote.customer_email as string,
        phone: quote.customer_phone as string,
        zip: quote.zip as string,
        address: quote.address as string,
      }, { type: 'project', id: projectId as number });
    } catch (contactErr) {
      console.error('[Project] Failed to link contact:', contactErr);
    }
    // Migrate "before" reference images into project_updates. Pull from the
    // quote AND the originating lead — admins sometimes attach photos to the
    // lead after the quote was already created, in which case the lead→quote
    // copy missed them. Dedupe by URL so we don't double-insert.
    try {
      const quoteImages: string[] = quote.project_images ? JSON.parse(quote.project_images as string) : [];
      let leadImages: string[] = [];
      if (quote.lead_id) {
        const lead = await db.prepare('SELECT project_images FROM leads WHERE id = ?')
          .bind(quote.lead_id).first() as { project_images?: string } | null;
        if (lead?.project_images) {
          try { leadImages = JSON.parse(lead.project_images); } catch {}
        }
      }
      const seen = new Set<string>();
      const allImages = [...quoteImages, ...leadImages].filter((u: string) => {
        if (!u || seen.has(u)) return false;
        seen.add(u);
        return true;
      });
      // Migrate ALL reference images, carrying the quote's STAR flag per image.
      // is_starred=1 → crew-only; is_starred=0 → client-visible. The admin can
      // re-toggle these in the project view afterwards.
      let starred: string[] = [];
      try { starred = quote.pdf_image_urls ? JSON.parse(quote.pdf_image_urls as string) : []; } catch {}
      const starredSet = new Set(Array.isArray(starred) ? starred.filter(Boolean) : []);
      if (allImages.length > 0) {
        for (const imageUrl of allImages) {
          await db.prepare(`
            INSERT INTO project_updates (project_id, image_url, note, posted_by, posted_by_name, is_starred, created_at)
            VALUES (?, ?, NULL, 'quote_migration', 'Quote Reference', ?, CURRENT_TIMESTAMP)
          `).bind(projectId, imageUrl, starredSet.has(imageUrl) ? 1 : 0).run();
        }
        console.log(`[Project] Migrated ${allImages.length} reference images (${starredSet.size} starred; ${quoteImages.length} quote, ${leadImages.length} lead) to project_updates`);
      }
    } catch (imgErr) {
      console.error('[Project] Failed to migrate quote/lead images:', imgErr);
    }

    // Promote the quote's PDF attachments into project_documents so the
    // project owns its own manageable copies.
    await promoteQuoteDocuments(db, body.quote_id, projectId as number);

    // Send notification email if requested and customer-approved
    if (body.send_notification && quote.promoted_by === 'customer' && quote.customer_email) {
      const resendApiKey = env?.RESEND_API_KEY;
      const notificationEmail = env?.NOTIFICATION_EMAIL;

      if (resendApiKey) {
        const origin = request.headers.get('origin') || '';
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

        const projectForEmail: ProjectEmail = {
          project_number: promotedProjectNumber,
          client_token: clientToken,
          reply_token: (quote.quote_token as string) || undefined,
          customer_name: quote.customer_name as string,
          customer_email: quote.customer_email as string,
          services: quote.services as string | undefined,
          scope_description: quote.scope_description as string | undefined,
          total: quote.total as number | undefined,
          estimated_start: quote.estimated_start as string | undefined,
          estimated_end: quote.estimated_end as string | undefined,
          estimated_duration: quote.estimated_duration as string | undefined,
        };

        const emailEnv: QuoteEmailEnv = {
          RESEND_API_KEY: resendApiKey,
          NOTIFICATION_EMAIL: notificationEmail || ''
        };

        try {
          const brand = await getBrand(db, (quote as any).partner_id);
          await sendProjectUpdateNotification(projectForEmail, emailEnv, isLocalhost, brand);
          console.log(`[Project] Sent update notification to ${quote.customer_email} for project ${quote.quote_number}`);
        } catch (emailError) {
          console.error('[Project] Failed to send notification email:', emailError);
          // Don't fail the project creation if email fails
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Project created successfully',
      project
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating project:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create project'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH: Update project
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: ProjectUpdateRequest = await request.json();

    if (!body.project_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify project exists
    const existing = await db.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(body.project_id).first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Optimistic concurrency guard (Layer 2): refuse to overwrite a coworker's
    // save when the client loaded an older version. `expected_updated_at` is
    // optional so partial/automated PATCH callers are unaffected.
    if ((body as any).expected_updated_at && (existing as any).updated_at &&
        String((body as any).expected_updated_at) !== String((existing as any).updated_at)) {
      return new Response(JSON.stringify({
        success: false,
        conflict: true,
        error: 'conflict',
        message: 'This project was changed by someone else since you opened it. Reload to see their changes before saving.',
        current_updated_at: (existing as any).updated_at,
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (body.crew_lead_id !== undefined) {
      if (body.crew_lead_id === null) {
        updates.push('crew_lead_id = NULL');
      } else {
        // Verify crew lead exists
        const crewLead = await db.prepare(
          'SELECT id FROM crew_leads WHERE id = ? AND active = 1'
        ).bind(body.crew_lead_id).first();

        if (!crewLead) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Crew lead not found'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        updates.push('crew_lead_id = ?');
        params.push(body.crew_lead_id);
      }
    }

    if (body.crew_notes !== undefined) {
      updates.push('crew_notes = ?');
      params.push(body.crew_notes);
    }

    // Internal admin-only notes (never shown to the customer). Stored as-is
    // (the UI keeps a JSON array of {date, note} entries, same as quotes.notes).
    if (body.internal_notes !== undefined) {
      updates.push('internal_notes = ?');
      params.push(body.internal_notes);
    }

    if (body.scheduled_start !== undefined) {
      updates.push('scheduled_start = ?');
      params.push(body.scheduled_start || null);
    }

    if (body.scheduled_end !== undefined) {
      updates.push('scheduled_end = ?');
      params.push(body.scheduled_end || null);
    }

    if (body.scope_description !== undefined) {
      updates.push('scope_description = ?');
      params.push(body.scope_description || null);
    }

    if (body.company_name !== undefined) {
      updates.push('company_name = ?');
      params.push(body.company_name ? String(body.company_name).trim().slice(0, 200) || null : null);
    }

    // Partner white-label tag: '' / 0 / null clears it (back to internal/SL).
    if (body.partner_id !== undefined) {
      const pid = body.partner_id ? parseInt(String(body.partner_id), 10) : null;
      updates.push('partner_id = ?');
      params.push(pid && !isNaN(pid) ? pid : null);
    }

    if (body.total !== undefined) {
      updates.push('total = ?');
      params.push(body.total);
    }

    if (body.status !== undefined) {
      updates.push('status = ?');
      params.push(body.status);

      // Handle status-specific timestamps
      if (body.status === 'in_progress' && existing.status !== 'in_progress') {
        updates.push('started_at = CURRENT_TIMESTAMP');
      }
      if (body.status === 'completed' && existing.status !== 'completed') {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      }
      if (body.status === 'portfolio' && existing.status !== 'portfolio') {
        updates.push('portfolio_at = CURRENT_TIMESTAMP');
        // Release crew lead when project moves to portfolio
        updates.push('crew_lead_id = NULL');
      }
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
    params.push(body.project_id);

    await db.prepare(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    // Keep the contract in sync with the project's Schedule (Details tab):
    //   - scheduled_start → contract.start_date (the editor sources it here)
    //   - scheduled_end   → the 'balance on completion' payment due date
    //     (any row tagged due_source:'end_date')
    // Skip signed/countersigned contracts — their terms are locked. Best-effort.
    if (body.scheduled_start !== undefined || body.scheduled_end !== undefined) {
      try {
        const contract = await db.prepare(
          "SELECT id, start_date, payment_schedule, status FROM project_contracts WHERE project_id = ?"
        ).bind(body.project_id).first() as { id: number; start_date: string | null; payment_schedule: string | null; status: string } | null;
        if (contract && contract.status !== 'signed' && contract.status !== 'countersigned') {
          const sets: string[] = [];
          const vals: any[] = [];

          if (body.scheduled_start !== undefined) {
            const newStart = body.scheduled_start || null;
            if (newStart && newStart !== contract.start_date) {
              sets.push('start_date = ?'); vals.push(newStart);
            }
          }

          if (body.scheduled_end !== undefined) {
            const newEnd = body.scheduled_end || null;
            let sched: any[] = [];
            try { sched = JSON.parse(contract.payment_schedule || '[]'); } catch { sched = []; }
            let touched = false;
            if (newEnd) {
              for (const row of sched) {
                if (row && row.due_source === 'end_date' && row.due_date !== newEnd) {
                  row.due_date = newEnd; touched = true;
                }
              }
            }
            if (touched) { sets.push('payment_schedule = ?'); vals.push(JSON.stringify(sched)); }
          }

          if (sets.length) {
            sets.push('updated_at = CURRENT_TIMESTAMP');
            vals.push(contract.id);
            await db.prepare(`UPDATE project_contracts SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
            console.log(`[Project] Synced contract dates from schedule for project ${body.project_id}`);
          }
        }
      } catch (syncErr) {
        console.warn('[Project] contract date sync failed (non-fatal):', syncErr);
      }
    }

    // If promoted to portfolio, mark the lead as 'won' and create portfolio entry
    if (body.status === 'portfolio' && existing.status !== 'portfolio') {
      // Get the lead_id through the quote
      const quoteWithLead = await db.prepare(`
        SELECT q.lead_id FROM quotes q WHERE q.id = ?
      `).bind(existing.quote_id).first();

      if (quoteWithLead?.lead_id) {
        await db.prepare(
          "UPDATE leads SET status = 'won', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(quoteWithLead.lead_id).run();
        console.log(`[Project] Marked lead ${quoteWithLead.lead_id} as 'won'`);
      }

      // Create a portfolios entry for this project (unified portfolio system)
      try {
        // Get project and lead details for the portfolio
        const projectDetails = await db.prepare(`
          SELECT
            p.id, p.project_number, p.services, p.scope_description,
            l.customer_name as client_name, l.customer_email as client_email, l.customer_phone as client_phone, l.city as client_city
          FROM projects p
          LEFT JOIN quotes q ON p.quote_id = q.id
          LEFT JOIN leads l ON q.lead_id = l.id
          WHERE p.id = ?
        `).bind(body.project_id).first() as {
          id: number;
          project_number: string;
          services: string | null;
          scope_description: string | null;
          client_name: string | null;
          client_email: string | null;
          client_phone: string | null;
          client_city: string | null;
        } | null;

        if (projectDetails) {
          // Generate project name from services. Service values are shared 1:1
          // with the portfolio categories (see src/lib/portfolio-copy.ts), so a
          // known service key doubles as the portfolio project_type.
          let projectName = projectDetails.project_number;
          let projectType = 'other';

          if (projectDetails.services) {
            try {
              const services = JSON.parse(projectDetails.services);
              const names = services.map((s: any) => {
                const key = typeof s === 'string' ? s : (s.type || s.service || 'service');
                if (projectType === 'other' && key !== 'other' && key in SERVICE_LABELS) projectType = key;
                return SERVICE_LABELS[key] || key;
              });
              if (names.length > 0) {
                projectName = names.join(' & ');
                if (projectDetails.client_city) {
                  projectName += ` - ${projectDetails.client_city}`;
                }
              }
            } catch {}
          }

          // Generate slug
          const baseSlug = projectName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          // Ensure unique slug
          let slug = baseSlug;
          let counter = 1;
          while (true) {
            const existingSlug = await db.prepare(
              'SELECT id FROM portfolios WHERE slug = ?'
            ).bind(slug).first();
            if (!existingSlug) break;
            counter++;
            slug = `${baseSlug}-${counter}`;
          }

          // Gallery-first: default display_mode is 'gallery' and we populate
          // portfolio_gallery with every copied photo below, so the portfolio
          // is a working, published gallery the moment it's promoted — no 404,
          // no manual setup. The admin can later switch to pairs/combined and
          // curate before/after comparisons as optional polish.
          const portfolioResult = await db.prepare(`
            INSERT INTO portfolios (
              project_name, project_type, description, slug,
              client_name, client_email, client_phone, client_city,
              source_project_id, display_mode, is_published, published_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'gallery', 1, CURRENT_TIMESTAMP)
          `).bind(
            projectName,
            projectType,
            projectDetails.scope_description || null,
            slug,
            projectDetails.client_name || null,
            projectDetails.client_email || null,
            projectDetails.client_phone || null,
            projectDetails.client_city || null,
            body.project_id
          ).run();

          const portfolioId = portfolioResult.meta?.last_row_id;

          if (portfolioId) {
            // Copy images from project_updates to portfolio_media, optimizing via Cloudflare Images.
            // Exclude internal annotated markup copies (posted_by='annotation'
            // or stored under the R2 'annotations/' prefix) — those are notes,
            // not portfolio-quality before/after photos. Also exclude STARRED
            // images: those are crew-only (internal/technical) and never public.
            const imagesResult = await db.prepare(`
              SELECT image_url, created_at, stream_uid, poster_url FROM project_updates
              WHERE project_id = ? AND image_url IS NOT NULL
                AND COALESCE(posted_by, '') != 'annotation'
                AND image_url NOT LIKE '%/annotations/%'
                AND COALESCE(is_starred, 0) = 0
              ORDER BY created_at ASC
            `).bind(body.project_id).all();

            const images = imagesResult.results || [];
            let copiedCount = 0;
            let optimizedCount = 0;

            // Requires BOTH env vars — never fall back to a foreign account id.
            const cfApiToken = env?.CLOUDFLARE_API_TOKEN;
            const cfAccountId = env?.CF_ACCOUNT_ID || env?.CLOUDFLARE_ACCOUNT_ID || '';
            const CF_IMAGES_API = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/images/v1`;

            // Detect video files by URL extension — CF Images only accepts
            // images, so we skip upload for videos and store media_type
            // accordingly. (Before this fix every row was hardcoded to
            // 'image', which made the public + admin portfolio view try to
            // render .mov files as <img> → broken icon.)
            const isVideoUrl = (u: string) => /\.(mp4|mov|webm|m4v)(?:\?|$)/i.test(u || '');

            // Upload to CF Images in parallel batches of 5 for speed (images only)
            const BATCH_SIZE = 5;
            const optimizedIds: (string | null)[] = new Array(images.length).fill(null);

            if (cfApiToken && cfAccountId) {
              for (let batchStart = 0; batchStart < images.length; batchStart += BATCH_SIZE) {
                const batch = images.slice(batchStart, batchStart + BATCH_SIZE);
                const results = await Promise.all(batch.map(async (img: any, idx: number) => {
                  if (isVideoUrl(img.image_url)) return null;
                  try {
                    const cfFormData = new FormData();
                    cfFormData.append('url', img.image_url);
                    cfFormData.append('metadata', JSON.stringify({ source: 'project-promotion', projectId: body.project_id }));

                    const cfRes = await fetch(CF_IMAGES_API, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${cfApiToken}` },
                      body: cfFormData
                    });
                    const cfData = await cfRes.json() as { success: boolean; result?: { id: string } };
                    return cfData.success && cfData.result ? cfData.result.id : null;
                  } catch (err) {
                    console.error(`[Project] CF Images upload failed for image ${batchStart + idx}:`, err);
                    return null;
                  }
                }));
                for (let j = 0; j < results.length; j++) {
                  optimizedIds[batchStart + j] = results[j];
                  if (results[j]) optimizedCount++;
                }
              }
            }

            let galleryCount = 0;
            for (let i = 0; i < images.length; i++) {
              const img = images[i] as { image_url: string; created_at?: string; stream_uid?: string | null; poster_url?: string | null };
              const mediaType = isVideoUrl(img.image_url) ? 'video' : 'image';
              try {
                const insRes = await db.prepare(`
                  INSERT INTO portfolio_media (
                    portfolio_id, media_url, media_type, sort_order, cloudflare_image_id, captured_at, stream_uid, poster_url
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(portfolioId, img.image_url, mediaType, i, optimizedIds[i], img.created_at || null, img.stream_uid || null, img.poster_url || null).run();
                copiedCount++;
                // Gallery-first: add every copied photo to portfolio_gallery so
                // it renders immediately (and shows in the admin Gallery tab).
                const mediaId = insRes.meta?.last_row_id;
                if (mediaId) {
                  await db.prepare(`
                    INSERT INTO portfolio_gallery (portfolio_id, media_id, sort_order)
                    VALUES (?, ?, ?)
                  `).bind(portfolioId, mediaId, i).run();
                  galleryCount++;
                }
              } catch (err) {
                console.error(`[Project] Failed to copy image ${i}:`, err);
              }
            }

            console.log(`[Project] Created portfolio ${portfolioId} for project ${body.project_id} (${copiedCount} images copied, ${galleryCount} added to gallery, ${optimizedCount} optimized)`);

            // Auto-generate a polished title + description right away so the
            // portfolio never sits with the raw project title. Best-effort —
            // falls back to the project title if the AI is unavailable. Admin
            // can re-polish or edit anytime.
            try {
              const ctxLines: string[] = [`Service type: ${projectType}`];
              const cityF = formatCity(projectDetails.client_city);
              if (cityF) ctxLines.push(`Location: ${cityF}`);
              if (projectDetails.scope_description) ctxLines.push(`Scope of work: ${projectDetails.scope_description}`);
              const fn = String(projectDetails.client_name || '').trim().split(/\s+/)[0];
              if (fn && fn.length >= 2) ctxLines.push(`Customer first name: ${fn}`);
              ctxLines.push(`Current rough title: ${projectName}`);
              const copy = await generatePortfolioCopy(env, ctxLines);
              if (copy) {
                await db.prepare('UPDATE portfolios SET project_name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                  .bind(copy.title, copy.description, portfolioId).run();
                console.log(`[Project] Auto-polished portfolio ${portfolioId}: "${copy.title}"`);
              }
            } catch (aiErr) {
              console.error('[Project] Auto-polish failed (non-fatal):', aiErr);
            }
          }
        }
      } catch (portfolioErr: any) {
        console.error('[Project] Failed to create portfolio entry:', portfolioErr?.message || portfolioErr, portfolioErr?.stack);
        // Don't fail the main operation if portfolio creation fails
      }
    }

    // Fetch updated project with crew lead info
    const updated = await db.prepare(`
      SELECT p.*, cl.name as crew_lead_name, cl.email as crew_lead_email, cl.phone as crew_lead_phone
      FROM projects p
      LEFT JOIN crew_leads cl ON p.crew_lead_id = cl.id
      WHERE p.id = ?
    `).bind(body.project_id).first();

    console.log(`[Project] Updated project ${body.project_id}`);

    // Send email notifications when project starts (status changes to 'in_progress')
    if (body.status === 'in_progress' && existing.status !== 'in_progress') {
      const resendApiKey = env?.RESEND_API_KEY;

      if (resendApiKey && updated) {
        const origin = request.headers.get('origin') || '';
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

        const emailEnv: QuoteEmailEnv = {
          RESEND_API_KEY: resendApiKey,
          NOTIFICATION_EMAIL: env?.NOTIFICATION_EMAIL || ''
        };

        // Look up stable quote_token for Reply-To
        const parentQuote = await db.prepare('SELECT quote_token FROM quotes WHERE id = ?').bind(updated.quote_id).first() as any;

        const projectStartData: ProjectStartData = {
          project_number: updated.project_number as string,
          customer_name: updated.customer_name as string,
          customer_email: updated.customer_email as string,
          client_token: updated.client_token as string,
          crew_token: updated.crew_token as string,
          reply_token: parentQuote?.quote_token || undefined,
          services: updated.services as string | undefined,
          scope_description: updated.scope_description as string | undefined,
          customer_address: updated.customer_address as string | undefined,
          customer_city: updated.customer_city as string | undefined,
          scheduled_start: updated.scheduled_start as string | undefined,
          scheduled_end: updated.scheduled_end as string | undefined,
          crew_lead_name: updated.crew_lead_name as string | undefined,
          crew_lead_email: updated.crew_lead_email as string | undefined,
          crew_notes: updated.crew_notes as string | undefined,
        };

        // Send email to customer
        if (updated.customer_email) {
          try {
            const brand = await getBrand(db, (updated as any).partner_id);
            await sendProjectStartedToClient(projectStartData, emailEnv, isLocalhost, brand);
            console.log(`[Project] Sent project start notification to customer: ${updated.customer_email}`);
          } catch (emailError) {
            console.error('[Project] Failed to send customer notification:', emailError);
          }
        }

        // Send email to crew lead
        if (updated.crew_lead_email) {
          try {
            await sendProjectStartedToCrewLead(projectStartData, emailEnv, isLocalhost);
            console.log(`[Project] Sent project start notification to crew lead: ${updated.crew_lead_email}`);
          } catch (emailError) {
            console.error('[Project] Failed to send crew lead notification:', emailError);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Project updated successfully',
      project: updated
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update project'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Demote project back to quote
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse URL from request to get query params
    const requestUrl = new URL(request.url);
    const projectId = requestUrl.searchParams.get('id');
    const permanent = requestUrl.searchParams.get('permanent') === 'true';

    if (!projectId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch the project to get quote_id
    const project = await db.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(projectId).first();

    if (!project) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Remove contact link (keep contact for remarketing)
    try { await unlinkContact(db, 'project', parseInt(projectId as string)); } catch {}

    // Delete related records first (foreign key constraint)
    // Delete project updates/photos
    await db.prepare('DELETE FROM project_updates WHERE project_id = ?').bind(projectId).run();

    // Delete the project
    await db.prepare('DELETE FROM projects WHERE id = ?').bind(projectId).run();

    if (permanent) {
      // Permanent delete - also delete quote and lead (keep contacts)
      if (project.quote_id) {
        const quote = await db.prepare('SELECT lead_id FROM quotes WHERE id = ?').bind(project.quote_id).first();
        // Remove contact links (keep contacts for remarketing)
        try { await unlinkContact(db, 'quote', project.quote_id as number); } catch {}
        // Delete messages first (foreign key constraint)
        await db.prepare('DELETE FROM messages WHERE quote_id = ?').bind(project.quote_id).run();
        await db.prepare('DELETE FROM quotes WHERE id = ?').bind(project.quote_id).run();
        if (quote?.lead_id) {
          try { await unlinkContact(db, 'lead', quote.lead_id as number); } catch {}
          await db.prepare('DELETE FROM messages WHERE lead_id = ?').bind(quote.lead_id).run();
          await db.prepare('DELETE FROM leads WHERE id = ?').bind(quote.lead_id).run();
        }
      }
      console.log(`[Project] Permanently deleted project ${projectId} and related records`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Project and all related records permanently deleted'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Demote - return quote to a clean 'draft' so it lands back in the
      // editable Drafts list (not "Ready to Promote"). Clear the acceptance
      // artifacts so it reads as a fresh draft you can edit + re-promote.
      if (project.quote_id) {
        await db.prepare(
          "UPDATE quotes SET status = 'draft', promoted_by = NULL, responded_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(project.quote_id).run();

        // Also reset lead status from 'won' back to 'promoted' if it was a portfolio
        if (project.status === 'portfolio') {
          const quote = await db.prepare('SELECT lead_id FROM quotes WHERE id = ?').bind(project.quote_id).first();
          if (quote?.lead_id) {
            await db.prepare(
              "UPDATE leads SET status = 'promoted', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'won'"
            ).bind(quote.lead_id).run();
            console.log(`[Project] Reset lead ${quote.lead_id} status from 'won' to 'promoted'`);
          }
        }
      }

      console.log(`[Project] Demoted project ${projectId} back to quote ${project.quote_id}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Project demoted back to quote',
        quote_id: project.quote_id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error deleting project:', errorMessage, errorStack);
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to delete project: ${errorMessage}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
