// Media management for manual portfolios
// GET: List media, POST: Add media, DELETE: Remove media
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth, viewerGuard } from '../../../../lib/adminAuth';
import { isVideoUrl, ingestToStream, streamThumb } from '../../../../lib/stream';

// GET: List all media for a portfolio
export const GET: APIRoute = async ({ request, locals, params }) => {
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

    const portfolioId = params.id;
    if (!portfolioId || isNaN(Number(portfolioId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid portfolio ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify portfolio exists
    const portfolio = await db.prepare(
      'SELECT id, project_name FROM portfolios WHERE id = ?'
    ).bind(portfolioId).first();

    if (!portfolio) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Portfolio not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all media for this portfolio (including video Stream fields and Cloudflare Images ID)
    const result = await db.prepare(`
      SELECT id, media_url, media_type, file_name, file_size, caption, sort_order, created_at,
             stream_uid, playback_url, thumbnail_url, duration_seconds, video_status,
             cloudflare_image_id
      FROM portfolio_media
      WHERE portfolio_id = ?
      ORDER BY sort_order ASC, created_at ASC
    `).bind(portfolioId).all();

    return new Response(JSON.stringify({
      success: true,
      portfolio_id: portfolioId,
      portfolio_name: portfolio.project_name,
      media: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Manual Portfolio Media] GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch media',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Add media to portfolio
export const POST: APIRoute = async ({ request, locals, params }) => {
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
    if (!portfolioId || isNaN(Number(portfolioId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid portfolio ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify portfolio exists
    const portfolio = await db.prepare(
      'SELECT id FROM portfolios WHERE id = ?'
    ).bind(portfolioId).first();

    if (!portfolio) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Portfolio not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const { media_url, media_type, file_name, file_size, caption,
            stream_uid, playback_url, thumbnail_url, duration_seconds, video_status,
            cloudflare_image_id } = body;

    console.log('[Manual Portfolio Media] POST body:', {
      portfolioId,
      media_url: media_url?.substring(0, 50) + '...',
      media_type,
      file_name,
      file_size,
      stream_uid: stream_uid || null,
      cloudflare_image_id: cloudflare_image_id || null
    });

    if (!media_url || typeof media_url !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Media URL is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate media type
    const validMediaTypes = ['image', 'video'];
    const finalMediaType = validMediaTypes.includes(media_type) ? media_type : 'image';

    // Server-side fallback: a video uploaded without a Stream UID (direct R2
    // upload) gets ingested into Stream now, so it renders fast + cross-browser.
    let effStreamUid = stream_uid || null;
    let effThumb = thumbnail_url || null;
    let effPlayback = playback_url || null;
    let effStatus = video_status || (finalMediaType === 'video' ? 'processing' : null);
    if (finalMediaType === 'video' && !effStreamUid && isVideoUrl(media_url)) {
      const uid = await ingestToStream(media_url, env);
      if (uid) { effStreamUid = uid; effThumb = streamThumb(uid, '1s', env) || effThumb; effStatus = 'processing'; }
    }

    // Get next sort order
    const lastMedia = await db.prepare(`
      SELECT MAX(sort_order) as max_order
      FROM portfolio_media
      WHERE portfolio_id = ?
    `).bind(portfolioId).first();
    const nextOrder = ((lastMedia?.max_order as number) || 0) + 1;

    // Insert media (with optional Stream video fields and Cloudflare Images ID)
    const result = await db.prepare(`
      INSERT INTO portfolio_media (
        portfolio_id, media_url, media_type, file_name, file_size, caption, sort_order,
        stream_uid, playback_url, thumbnail_url, duration_seconds, video_status,
        cloudflare_image_id, captured_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      portfolioId,
      media_url,
      finalMediaType,
      file_name || null,
      file_size || null,
      caption || null,
      nextOrder,
      effStreamUid,
      effPlayback,
      effThumb,
      duration_seconds || null,
      effStatus,
      cloudflare_image_id || null
    ).run();

    const mediaId = result.meta?.last_row_id;
    const changes = result.meta?.changes;

    console.log(`[Manual Portfolio Media] INSERT result:`, { mediaId, changes, success: result.success });

    // Auto-add this new item to the gallery so it shows publicly (gallery /
    // combined modes). Only the new item — never re-adds media you previously
    // excluded from the gallery on purpose.
    if (mediaId) {
      try {
        const gOrder = await db.prepare(
          'SELECT COALESCE(MAX(sort_order), -1) AS m FROM portfolio_gallery WHERE portfolio_id = ?'
        ).bind(portfolioId).first() as { m: number } | null;
        await db.prepare(
          'INSERT INTO portfolio_gallery (portfolio_id, media_id, sort_order) VALUES (?, ?, ?)'
        ).bind(portfolioId, mediaId, (Number(gOrder?.m ?? -1) + 1)).run();
      } catch (e) {
        console.error('[Manual Portfolio Media] auto-gallery insert failed:', e);
      }
    }

    // Get updated count
    const countResult = await db.prepare(
      'SELECT COUNT(*) as count FROM portfolio_media WHERE portfolio_id = ?'
    ).bind(portfolioId).first();

    console.log(`[Manual Portfolio Media] COUNT result:`, countResult);

    return new Response(JSON.stringify({
      success: true,
      media_id: mediaId,
      media_count: countResult?.count || 1
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Manual Portfolio Media] POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to add media',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH: Update media (reorder or update caption)
export const PATCH: APIRoute = async ({ request, locals, params }) => {
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
    if (!portfolioId || isNaN(Number(portfolioId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid portfolio ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const { media_id, sort_order, caption } = body;

    if (!media_id || isNaN(Number(media_id))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid media ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build update query
    const updateParts: string[] = [];
    const values: any[] = [];

    if (typeof sort_order === 'number') {
      updateParts.push('sort_order = ?');
      values.push(sort_order);
    }

    if (typeof caption === 'string') {
      updateParts.push('caption = ?');
      values.push(caption || null);
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

    values.push(media_id, portfolioId);

    await db.prepare(`
      UPDATE portfolio_media
      SET ${updateParts.join(', ')}
      WHERE id = ? AND portfolio_id = ?
    `).bind(...values).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Media updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Manual Portfolio Media] PATCH error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update media',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Remove media from portfolio
export const DELETE: APIRoute = async ({ request, locals, params }) => {
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
    const url = new URL(request.url);
    const mediaId = url.searchParams.get('media_id');

    if (!portfolioId || isNaN(Number(portfolioId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid portfolio ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!mediaId || isNaN(Number(mediaId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid media ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the media
    const result = await db.prepare(
      'DELETE FROM portfolio_media WHERE id = ? AND portfolio_id = ?'
    ).bind(mediaId, portfolioId).run();

    if (result.meta?.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Media not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get updated count
    const countResult = await db.prepare(
      'SELECT COUNT(*) as count FROM portfolio_media WHERE portfolio_id = ?'
    ).bind(portfolioId).first();

    console.log(`[Manual Portfolio Media] Deleted media ${mediaId} from portfolio ${portfolioId}`);

    return new Response(JSON.stringify({
      success: true,
      media_count: countResult?.count || 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Manual Portfolio Media] DELETE error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete media',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
