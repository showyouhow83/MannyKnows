// Gallery Items API for portfolios in gallery mode (single images)
// GET /api/manual-portfolios/[id]/gallery - List gallery items
// POST /api/manual-portfolios/[id]/gallery - Add image to gallery
// PATCH /api/manual-portfolios/[id]/gallery - Update gallery item
// DELETE /api/manual-portfolios/[id]/gallery - Remove from gallery
import type { APIRoute } from 'astro';
import { AdminAuth, viewerGuard } from '../../../../lib/adminAuth';

// GET: List all gallery items for a portfolio
export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
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

    const portfolioId = params.id;

    // Get gallery items with media info
    const result = await db.prepare(`
      SELECT
        g.id,
        g.media_id,
        g.title,
        g.description,
        g.sort_order,
        g.is_cover,
        m.media_url,
        m.media_type
      FROM portfolio_gallery g
      JOIN portfolio_media m ON g.media_id = m.id
      WHERE g.portfolio_id = ?
      ORDER BY g.sort_order ASC, g.created_at ASC
    `).bind(portfolioId).all();

    return new Response(JSON.stringify({
      success: true,
      items: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Gallery] GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch gallery items'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Add image to gallery
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
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

    const portfolioId = params.id;
    const body = await request.json() as any;
    const { media_id, title, description, is_cover } = body;

    if (!media_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'media_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get max sort order
    const maxOrder = await db.prepare(`
      SELECT COALESCE(MAX(sort_order), -1) as max_order
      FROM portfolio_gallery
      WHERE portfolio_id = ?
    `).bind(portfolioId).first() as { max_order: number };

    const sortOrder = (maxOrder?.max_order ?? -1) + 1;

    // If setting as cover, unset any existing cover
    if (is_cover) {
      await db.prepare(`
        UPDATE portfolio_gallery SET is_cover = 0 WHERE portfolio_id = ?
      `).bind(portfolioId).run();
    }

    // Insert gallery item
    const result = await db.prepare(`
      INSERT INTO portfolio_gallery (
        portfolio_id, media_id, title, description, sort_order, is_cover
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      portfolioId,
      media_id,
      title || null,
      description || null,
      sortOrder,
      is_cover ? 1 : 0
    ).run();

    return new Response(JSON.stringify({
      success: true,
      gallery_id: result.meta?.last_row_id,
      message: 'Image added to gallery'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Gallery] POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to add to gallery'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH: Update gallery item
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
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

    const portfolioId = params.id;
    const body = await request.json() as any;
    const { gallery_id, title, description, sort_order, is_cover } = body;

    if (!gallery_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'gallery_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title || null);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || null);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }
    if (is_cover !== undefined) {
      // Unset other covers first
      if (is_cover) {
        await db.prepare(`
          UPDATE portfolio_gallery SET is_cover = 0 WHERE portfolio_id = ?
        `).bind(portfolioId).run();
      }
      updates.push('is_cover = ?');
      values.push(is_cover ? 1 : 0);
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

    values.push(gallery_id, portfolioId);
    await db.prepare(`
      UPDATE portfolio_gallery
      SET ${updates.join(', ')}
      WHERE id = ? AND portfolio_id = ?
    `).bind(...values).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Gallery item updated'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Gallery] PATCH error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update gallery item'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Remove from gallery (doesn't delete media)
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
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

    const portfolioId = params.id;
    const body = await request.json() as any;
    const { gallery_id } = body;

    if (!gallery_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'gallery_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.prepare(`
      DELETE FROM portfolio_gallery
      WHERE id = ? AND portfolio_id = ?
    `).bind(gallery_id, portfolioId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Removed from gallery'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Gallery] DELETE error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to remove from gallery'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
