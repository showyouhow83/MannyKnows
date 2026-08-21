// Before/After Pairs API for Manual Portfolios
// GET: List all pairs
// POST: Create pair with AI-generated title/description
// PATCH: Update pair (title, description, sort_order, is_cover)
// DELETE: Delete pair (keeps media)
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth, viewerGuard } from '../../../../lib/adminAuth';

// AI title/description generation using Gemini
async function generatePairMetadata(
  beforeUrl: string,
  afterUrl: string,
  geminiApiKey: string
): Promise<{ title: string; description: string }> {
  try {
    const prompt = `Analyze these before/after project photos and generate:
1. A short title (2-3 words) describing the area or view shown. Examples: "Kitchen Sink Wall", "Shower Surround", "Living Room Floor", "Hallway Trim", "Vanity Corner"
2. A brief description (under 10 words) of the transformation. Examples: "Dated cabinets replaced with shaker fronts", "New tile surround and fixtures installed"

Before image: ${beforeUrl}
After image: ${afterUrl}

Return ONLY a JSON object with this exact format, no markdown or other text:
{"title": "...", "description": "..."}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', file_uri: beforeUrl } },
              { inline_data: { mime_type: 'image/jpeg', file_uri: afterUrl } }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200
          }
        })
      }
    );

    if (!response.ok) {
      console.error('[Pairs API] Gemini error:', await response.text());
      return { title: 'Detail View', description: 'Before-and-after of the completed work' };
    }

    const result = await response.json() as any;
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || 'Detail View',
        description: parsed.description || 'Before-and-after of the completed work'
      };
    }

    return { title: 'Detail View', description: 'Before-and-after of the completed work' };
  } catch (error) {
    console.error('[Pairs API] AI generation error:', error);
    return { title: 'Detail View', description: 'Before-and-after of the completed work' };
  }
}

// GET: List all pairs for a portfolio
export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const portfolioId = params.id;

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

    // Get pairs with media URLs and types
    const result = await db.prepare(`
      SELECT
        p.id,
        p.portfolio_id,
        p.title,
        p.description,
        p.sort_order,
        p.is_cover,
        p.created_at,
        bm.id as before_media_id,
        bm.media_url as before_url,
        bm.media_type as before_type,
        am.id as after_media_id,
        am.media_url as after_url,
        am.media_type as after_type
      FROM portfolio_pairs p
      JOIN portfolio_media bm ON p.before_media_id = bm.id
      JOIN portfolio_media am ON p.after_media_id = am.id
      WHERE p.portfolio_id = ?
      ORDER BY p.sort_order ASC, p.created_at ASC
    `).bind(portfolioId).all();

    return new Response(JSON.stringify({
      success: true,
      pairs: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Pairs API] GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch pairs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Create a new pair with AI-generated metadata
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const geminiApiKey = env?.GEMINI_API_KEY;
    const portfolioId = params.id;

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
    const { before_media_id, after_media_id, title, description, generate_ai } = body;

    if (!before_media_id || !after_media_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'before_media_id and after_media_id are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify both media items exist and belong to this portfolio
    const beforeMedia = await db.prepare(
      'SELECT id, media_url FROM portfolio_media WHERE id = ? AND portfolio_id = ?'
    ).bind(before_media_id, portfolioId).first();

    const afterMedia = await db.prepare(
      'SELECT id, media_url FROM portfolio_media WHERE id = ? AND portfolio_id = ?'
    ).bind(after_media_id, portfolioId).first();

    if (!beforeMedia || !afterMedia) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid media IDs or media does not belong to this portfolio'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if these media items are already paired
    const existingPair = await db.prepare(`
      SELECT id FROM portfolio_pairs
      WHERE portfolio_id = ? AND (before_media_id = ? OR after_media_id = ? OR before_media_id = ? OR after_media_id = ?)
    `).bind(portfolioId, before_media_id, before_media_id, after_media_id, after_media_id).first();

    if (existingPair) {
      return new Response(JSON.stringify({
        success: false,
        error: 'One or both images are already paired'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate title/description using AI if requested or not provided
    let finalTitle = title;
    let finalDescription = description;
    let aiGenerated = false;

    if (generate_ai !== false && geminiApiKey && (!title || !description)) {
      const aiMetadata = await generatePairMetadata(
        beforeMedia.media_url as string,
        afterMedia.media_url as string,
        geminiApiKey
      );
      finalTitle = title || aiMetadata.title;
      finalDescription = description || aiMetadata.description;
      aiGenerated = true;
    }

    // Use defaults if still empty
    finalTitle = finalTitle || 'Detail View';
    finalDescription = finalDescription || '';

    // Get next sort order
    const orderResult = await db.prepare(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM portfolio_pairs WHERE portfolio_id = ?'
    ).bind(portfolioId).first();
    const nextOrder = (orderResult?.next_order as number) || 0;

    // Check if this is the first pair (make it cover by default)
    const pairCount = await db.prepare(
      'SELECT COUNT(*) as count FROM portfolio_pairs WHERE portfolio_id = ?'
    ).bind(portfolioId).first();
    const isCover = (pairCount?.count as number) === 0 ? 1 : 0;

    // Insert the pair
    const result = await db.prepare(`
      INSERT INTO portfolio_pairs (portfolio_id, before_media_id, after_media_id, title, description, sort_order, is_cover)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(portfolioId, before_media_id, after_media_id, finalTitle, finalDescription, nextOrder, isCover).run();

    const pairId = result.meta?.last_row_id;

    console.log(`[Pairs API] Created pair ${pairId} for portfolio ${portfolioId}: ${finalTitle}`);

    return new Response(JSON.stringify({
      success: true,
      pair_id: pairId,
      title: finalTitle,
      description: finalDescription,
      ai_generated: aiGenerated,
      is_cover: isCover === 1
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Pairs API] POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create pair',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH: Update a pair
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const portfolioId = params.id;

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
    const { pair_id, title, description, sort_order, is_cover } = body;

    if (!pair_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'pair_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify pair exists and belongs to this portfolio
    const existing = await db.prepare(
      'SELECT id FROM portfolio_pairs WHERE id = ? AND portfolio_id = ?'
    ).bind(pair_id, portfolioId).first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Pair not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }

    if (is_cover !== undefined) {
      // If setting as cover, unset other covers first
      if (is_cover) {
        await db.prepare(
          'UPDATE portfolio_pairs SET is_cover = 0 WHERE portfolio_id = ?'
        ).bind(portfolioId).run();
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

    values.push(pair_id);

    await db.prepare(`
      UPDATE portfolio_pairs SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Pair updated'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Pairs API] PATCH error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update pair',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Delete a pair (media stays)
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const portfolioId = params.id;

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
    const pairId = url.searchParams.get('pair_id');

    if (!pairId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'pair_id query parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify pair exists and belongs to this portfolio
    const existing = await db.prepare(
      'SELECT id, is_cover FROM portfolio_pairs WHERE id = ? AND portfolio_id = ?'
    ).bind(pairId, portfolioId).first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Pair not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the pair
    await db.prepare(
      'DELETE FROM portfolio_pairs WHERE id = ?'
    ).bind(pairId).run();

    // If this was the cover, make the first remaining pair the cover
    if (existing.is_cover) {
      await db.prepare(`
        UPDATE portfolio_pairs
        SET is_cover = 1
        WHERE portfolio_id = ?
        AND id = (SELECT id FROM portfolio_pairs WHERE portfolio_id = ? ORDER BY sort_order ASC LIMIT 1)
      `).bind(portfolioId, portfolioId).run();
    }

    console.log(`[Pairs API] Deleted pair ${pairId} from portfolio ${portfolioId}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Pair deleted'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Pairs API] DELETE error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete pair',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
