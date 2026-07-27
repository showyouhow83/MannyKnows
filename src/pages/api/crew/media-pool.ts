// Crew Media Pool API (crew session auth)
// POST: Save a pool item after the file is already in R2
// GET: Last 20 uploads by the current crew member (timeclock confirmation strip)

import type { APIRoute } from 'astro';
import { isVideoUrl, ingestToStream } from '../../../lib/stream';

async function getCrewFromSession(request: Request, db: any): Promise<{ id: number; name: string } | null> {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/crew_session=([^;]+)/);
  if (!match) return null;
  const session = await db.prepare(`
    SELECT cs.crew_lead_id, cl.name
    FROM crew_sessions cs JOIN crew_leads cl ON cs.crew_lead_id = cl.id
    WHERE cs.session_token = ? AND cs.expires_at > CURRENT_TIMESTAMP AND cl.active = 1
  `).bind(match[1]).first() as any;
  if (!session) return null;
  return { id: session.crew_lead_id, name: session.name };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return jsonResponse({ error: 'DB not configured' }, 503);

    const crew = await getCrewFromSession(request, db);
    if (!crew) return jsonResponse({ error: 'Not authenticated' }, 401);

    const body = await request.json() as {
      media_url?: string;
      media_type?: string;
      file_size?: number;
      original_filename?: string;
      note?: string;
    };

    if (!body.media_url || !body.media_type) {
      return jsonResponse({ error: 'media_url and media_type are required' }, 400);
    }
    if (body.media_type !== 'image' && body.media_type !== 'video') {
      return jsonResponse({ error: "media_type must be 'image' or 'video'" }, 400);
    }

    // Videos → Cloudflare Stream (ingest the R2 URL, store the UID).
    let streamUid: string | null = null;
    if (body.media_type === 'video' && isVideoUrl(body.media_url)) {
      streamUid = await ingestToStream(body.media_url, env);
    }

    const result = await db.prepare(`
      INSERT INTO media_pool
        (media_url, media_type, file_size, original_filename, note, uploaded_by_crew_id, stream_uid)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.media_url,
      body.media_type,
      body.file_size || null,
      body.original_filename || null,
      body.note?.trim() || null,
      crew.id,
      streamUid,
    ).run();

    return jsonResponse({
      success: true,
      id: result.meta?.last_row_id ?? null,
    }, 201);
  } catch (error) {
    console.error('[crew/media-pool] POST error:', error);
    return jsonResponse({ error: 'Failed to save media' }, 500);
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals as any).runtime?.env?.MK_APP_DB;
    if (!db) return jsonResponse({ error: 'DB not configured' }, 503);

    const crew = await getCrewFromSession(request, db);
    if (!crew) return jsonResponse({ error: 'Not authenticated' }, 401);

    const rows = await db.prepare(`
      SELECT id, media_url, media_type, note, created_at
      FROM media_pool
      WHERE uploaded_by_crew_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(crew.id).all();

    return jsonResponse({
      success: true,
      items: rows.results || [],
    });
  } catch (error) {
    console.error('[crew/media-pool] GET error:', error);
    return jsonResponse({ error: 'Failed to load recent uploads' }, 500);
  }
};
