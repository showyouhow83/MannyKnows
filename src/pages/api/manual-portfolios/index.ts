// Manual Portfolios API - CRUD operations for manually created portfolio items
// These bypass the lead→quote→project pipeline
import type { APIRoute } from 'astro';
import { AdminAuth, viewerGuard } from '../../../lib/adminAuth';
import { sendPortfolioReviewToClient } from '../../../lib/quote-emails';
import { PORTFOLIO_TYPE_VALUES } from '../../../lib/portfolio-copy';

// Generate URL slug from project name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Ensure slug is unique by adding a suffix if needed
async function ensureUniqueSlug(db: any, baseSlug: string, excludeId?: number): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = excludeId
      ? 'SELECT id FROM portfolios WHERE slug = ? AND id != ?'
      : 'SELECT id FROM portfolios WHERE slug = ?';

    const existing = excludeId
      ? await db.prepare(query).bind(slug, excludeId).first()
      : await db.prepare(query).bind(slug).first();

    if (!existing) return slug;

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

// GET: List all manual portfolios with media count
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
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

    // Get all manual portfolios with media count
    const result = await db.prepare(`
      SELECT
        mp.*,
        COUNT(mpm.id) as media_count,
        (SELECT media_url FROM portfolio_media
         WHERE portfolio_id = mp.id AND media_type = 'image'
         ORDER BY sort_order ASC, created_at ASC LIMIT 1) as cover_image
      FROM portfolios mp
      LEFT JOIN portfolio_media mpm ON mp.id = mpm.portfolio_id
      GROUP BY mp.id
      ORDER BY mp.created_at DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      portfolios: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Manual Portfolios] GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch portfolios',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Create new manual portfolio
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
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
    const vg = viewerGuard(session); if (vg) return vg;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const {
      project_name,
      project_type,
      description,
      client_name,
      client_email,
      client_phone,
      client_city
    } = body;

    // Validate required fields
    if (!project_name || typeof project_name !== 'string' || !project_name.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Canonical category list — src/lib/portfolio-copy.ts (MK's five services + other)
    const validTypes = PORTFOLIO_TYPE_VALUES;
    if (!project_type || !validTypes.includes(project_type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid project type is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique slug from project name
    const baseSlug = generateSlug(project_name.trim());
    const slug = await ensureUniqueSlug(db, baseSlug);

    // Insert new portfolio with slug
    const result = await db.prepare(`
      INSERT INTO portfolios (
        project_name, project_type, description,
        client_name, client_email, client_phone, client_city, slug
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      project_name.trim(),
      project_type,
      description?.trim() || null,
      client_name?.trim() || null,
      client_email?.trim() || null,
      client_phone?.trim() || null,
      client_city?.trim() || null,
      slug
    ).run();

    const portfolioId = result.meta?.last_row_id;

    console.log(`[Manual Portfolios] Created portfolio ${portfolioId}: ${project_name} (slug: ${slug})`);

    return new Response(JSON.stringify({
      success: true,
      portfolio_id: portfolioId,
      message: 'Portfolio created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Manual Portfolios] POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create portfolio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH: Update portfolio details
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
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
    const vg = viewerGuard(session); if (vg) return vg;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const { portfolio_id, ...updates } = body;

    if (!portfolio_id || isNaN(Number(portfolio_id))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid portfolio ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build update query dynamically
    const allowedFields = [
      'project_name', 'project_type', 'description',
      'client_name', 'client_email', 'client_phone', 'client_city',
      'display_mode'
    ];
    const updateParts: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (field in updates) {
        updateParts.push(`${field} = ?`);
        values.push(updates[field]?.trim?.() || updates[field] || null);
      }
    }

    // Look up current state once. Used to (a) freeze the slug after first
    // publish so old links don't 404 when the title is edited, and
    // (b) decide whether to stamp published_at below.
    const existing = await db.prepare(
      'SELECT published_at, slug FROM portfolios WHERE id = ?'
    ).bind(portfolio_id).first() as { published_at: string | null; slug: string | null } | null;

    // Regenerate slug when project_name changes — only while still a draft.
    let newSlug: string | undefined;
    if ('project_name' in updates && updates.project_name && !existing?.published_at) {
      const baseSlug = generateSlug(updates.project_name.trim());
      newSlug = await ensureUniqueSlug(db, baseSlug, Number(portfolio_id));
      updateParts.push('slug = ?');
      values.push(newSlug);
    }

    // Handle publishing
    let firstPublish = false;
    if ('is_published' in updates) {
      const isPublishing = updates.is_published === true || updates.is_published === 1;
      updateParts.push('is_published = ?');
      values.push(isPublishing ? 1 : 0);

      // Set published_at on first publish
      if (isPublishing) {
        if (existing && !existing.published_at) {
          updateParts.push('published_at = CURRENT_TIMESTAMP');
          // First-ever publish → trigger the customer review email below
          // (published_at is set once and frozen, so this fires exactly once).
          firstPublish = true;
        }

        // Generate slug if not exists
        if (existing && !existing.slug && !newSlug) {
          const portfolio = await db.prepare(
            'SELECT project_name FROM portfolios WHERE id = ?'
          ).bind(portfolio_id).first() as { project_name: string } | null;

          if (portfolio) {
            const baseSlug = generateSlug(portfolio.project_name);
            newSlug = await ensureUniqueSlug(db, baseSlug, Number(portfolio_id));
            updateParts.push('slug = ?');
            values.push(newSlug);
          }
        }
      }
    }

    if (updateParts.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid fields to update'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add updated_at and portfolio_id
    updateParts.push('updated_at = CURRENT_TIMESTAMP');
    values.push(portfolio_id);

    await db.prepare(`
      UPDATE portfolios
      SET ${updateParts.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    // Get the current slug (+ client info for the review email) to return.
    const updated = await db.prepare(
      'SELECT slug, project_name, client_name, client_email FROM portfolios WHERE id = ?'
    ).bind(portfolio_id).first() as { slug: string; project_name: string | null; client_name: string | null; client_email: string | null } | null;

    console.log(`[Manual Portfolios] Updated portfolio ${portfolio_id}`);

    // On first publish, email the customer their live portfolio URL + a Google
    // review request. Guarded by firstPublish (fires once). Needs a slug (so the
    // link works) and a client email. Failure here never blocks the publish.
    if (firstPublish && updated?.slug && updated.client_email) {
      try {
        const origin = request.headers.get('origin') || '';
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        await sendPortfolioReviewToClient(
          {
            customer_name: updated.client_name || updated.project_name || 'there',
            customer_email: updated.client_email,
            slug: updated.slug,
          },
          env as any,
          isLocalhost
        );
      } catch (mailErr) {
        console.error('[Manual Portfolios] Review email failed (publish still succeeded):', mailErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Portfolio updated successfully',
      slug: updated?.slug || newSlug
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Manual Portfolios] PATCH error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update portfolio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Delete portfolio and all media (cascade)
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
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
    const vg = viewerGuard(session); if (vg) return vg;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const portfolioId = url.searchParams.get('portfolio_id');

    if (!portfolioId || isNaN(Number(portfolioId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid portfolio ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete related data first (manual cascade since SQLite foreign keys may not be enabled)
    // Each wrapped in try-catch in case table doesn't exist
    try {
      await db.prepare('DELETE FROM portfolio_pairs WHERE portfolio_id = ?').bind(portfolioId).run();
    } catch (e) { console.log('[Delete] portfolio_pairs skip:', e); }

    try {
      await db.prepare('DELETE FROM portfolio_gallery WHERE portfolio_id = ?').bind(portfolioId).run();
    } catch (e) { console.log('[Delete] portfolio_gallery skip:', e); }

    try {
      await db.prepare('DELETE FROM portfolio_media WHERE portfolio_id = ?').bind(portfolioId).run();
    } catch (e) { console.log('[Delete] portfolio_media skip:', e); }

    // Delete portfolio
    const result = await db.prepare(
      'DELETE FROM portfolios WHERE id = ?'
    ).bind(portfolioId).run();

    if (result.meta?.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Portfolio not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Manual Portfolios] Deleted portfolio ${portfolioId}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Portfolio deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Manual Portfolios] DELETE error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete portfolio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
