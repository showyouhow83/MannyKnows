// GET /api/admin/portfolios/{id}/source-project
//
// Returns the original project record for a portfolio that was promoted
// from a project (portfolios.source_project_id IS NOT NULL). Bundles
// everything an admin would want to see "in archive" mode:
// - Project core (number, customer, services, scope, dates)
// - Quote info (number, total, accept/decline timestamps)
// - All quote_attachments (signed estimate, signed contract, any extras)
// - The project_contracts signed PDF (if any)
// - Every project_updates row (admin/crew/migrated images + videos)
//
// Returns 404 if the portfolio has no source_project_id (manual portfolios).

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../../lib/adminAuth';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'DB not configured' }, 503);

    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return json({ success: false, error: 'Unauthorized' }, 401);

    const portfolioId = Number(params.id);
    if (!Number.isFinite(portfolioId) || portfolioId <= 0) {
      return json({ success: false, error: 'Invalid portfolio id' }, 400);
    }

    const portfolio = await db.prepare(
      'SELECT id, source_project_id FROM portfolios WHERE id = ?'
    ).bind(portfolioId).first() as { id: number; source_project_id: number | null } | null;

    if (!portfolio) return json({ success: false, error: 'Portfolio not found' }, 404);
    if (!portfolio.source_project_id) {
      // Manual portfolio with no underlying project — caller should hide the section.
      return json({ success: true, has_source: false });
    }

    // Note: projects table has no `discount` column — pricing-related
    // fields (subtotal/discount/total) live on quotes. Selecting p.discount
    // would throw a column-missing error.
    const project = await db.prepare(`
      SELECT
        p.id, p.project_number, p.customer_name, p.customer_email, p.customer_phone,
        p.customer_address, p.customer_city, p.customer_state, p.customer_zip,
        p.services, p.scope_description, p.total,
        p.status, p.scheduled_start, p.scheduled_end,
        p.started_at, p.completed_at, p.created_at, p.portfolio_at,
        p.quote_id,
        q.quote_number, q.responded_at AS quote_responded_at,
        q.subtotal AS quote_subtotal, q.discount AS quote_discount, q.total AS quote_total
      FROM projects p
      LEFT JOIN quotes q ON q.id = p.quote_id
      WHERE p.id = ?
    `).bind(portfolio.source_project_id).first() as any;

    if (!project) {
      return json({ success: true, has_source: false });
    }

    // Quote attachments (Estimate, Estimate — Signed, etc.)
    let quoteAttachments: any[] = [];
    if (project.quote_id) {
      const att = await db.prepare(`
        SELECT id, label, file_url, file_name, file_size, uploaded_at
          FROM quote_attachments
         WHERE quote_id = ?
         ORDER BY uploaded_at DESC, id DESC
      `).bind(project.quote_id).all();
      quoteAttachments = att.results || [];
    }

    // Signed contract PDF (one row per project). `terms` may carry an
    // offline scan URL when the contract was signed on paper.
    const contractRow = await db.prepare(`
      SELECT id, status, signed_at, signed_pdf_url, terms
        FROM project_contracts
       WHERE project_id = ?
       LIMIT 1
    `).bind(project.id).first() as any;

    // Offline paper-signed scan (stored in contract terms by mark-signed-offline).
    let offlineScanUrl: string | null = null;
    if (contractRow?.terms) {
      try {
        const t = JSON.parse(contractRow.terms);
        offlineScanUrl = t?.offline_scan_url || null;
      } catch { /* terms not JSON: ignore */ }
    }

    // Project-owned documents (admin/offline uploads + quote-promotion docs).
    const docsRes = await db.prepare(`
      SELECT id, label, file_url, file_name, file_size, source, uploaded_at
        FROM project_documents
       WHERE project_id = ?
       ORDER BY uploaded_at DESC, id DESC
    `).bind(project.id).all();

    // Project images eligible for the portfolio. STARRED images are crew-only
    // (internal/technical) and never go public — so only NON-starred images
    // make it into a portfolio.
    const updatesRes = await db.prepare(`
      SELECT id, image_url, note, posted_by, posted_by_name, created_at
        FROM project_updates
       WHERE project_id = ? AND image_url IS NOT NULL
         AND COALESCE(is_starred, 0) = 0
       ORDER BY created_at ASC, id ASC
    `).bind(project.id).all();

    return json({
      success: true,
      has_source: true,
      project: {
        id: project.id,
        project_number: project.project_number,
        customer_name: project.customer_name,
        customer_email: project.customer_email,
        customer_phone: project.customer_phone,
        customer_address: project.customer_address,
        customer_city: project.customer_city,
        customer_state: project.customer_state,
        customer_zip: project.customer_zip,
        services: project.services,
        scope_description: project.scope_description,
        total: project.total,
        status: project.status,
        scheduled_start: project.scheduled_start,
        scheduled_end: project.scheduled_end,
        started_at: project.started_at,
        completed_at: project.completed_at,
        created_at: project.created_at,
        portfolio_at: project.portfolio_at,
        quote_id: project.quote_id,
        quote_number: project.quote_number,
        quote_responded_at: project.quote_responded_at,
        quote_subtotal: project.quote_subtotal,
        quote_discount: project.quote_discount,
        quote_total: project.quote_total,
      },
      attachments: quoteAttachments,
      contract: contractRow ? {
        id: contractRow.id,
        status: contractRow.status,
        signed_at: contractRow.signed_at,
        signed_pdf_url: contractRow.signed_pdf_url,
        offline_scan_url: offlineScanUrl,
      } : null,
      documents: docsRes.results || [],
      updates: updatesRes.results || [],
    });
  } catch (error) {
    console.error('[admin/portfolios/source-project] error:', error);
    return json({ success: false, error: 'Failed to load source project' }, 500);
  }
};
