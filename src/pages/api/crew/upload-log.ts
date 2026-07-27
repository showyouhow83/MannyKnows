// Upload audit log (crew session auth). The timeclock uploader posts one entry
// per file — success or failure with a reason — so we have a record of WHY
// uploads drop (too large, rate limited, network, etc.) instead of guessing.
//
// POST { logs: [{ filename, file_size, media_type, note, result, reason }] }
// GET  ?limit=100  → recent log rows (admin/debugging)

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

async function getCrew(request: Request, db: any): Promise<{ id: number; name: string } | null> {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(/crew_session=([^;]+)/);
  if (!m) return null;
  const row = await db.prepare(`
    SELECT cs.crew_lead_id, cl.name
    FROM crew_sessions cs JOIN crew_leads cl ON cs.crew_lead_id = cl.id
    WHERE cs.session_token = ? AND cs.expires_at > CURRENT_TIMESTAMP AND cl.active = 1
  `).bind(m[1]).first() as any;
  return row ? { id: row.crew_lead_id, name: row.name } : null;
}

async function ensureTable(db: any) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS upload_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crew_id INTEGER,
      crew_name TEXT,
      filename TEXT,
      file_size INTEGER,
      media_type TEXT,
      note TEXT,
      result TEXT,
      reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = cfEnv?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    const crew = await getCrew(request, db);
    if (!crew) return json({ error: 'Not authenticated' }, 401);

    const body = await request.json() as { logs?: Array<{
      filename?: string; file_size?: number; media_type?: string;
      note?: string; result?: string; reason?: string;
    }> };
    const logs = (body.logs || []).slice(0, 500); // sane cap per request
    if (!logs.length) return json({ success: true, logged: 0 });

    await ensureTable(db);

    const stmts = logs.map(l => db.prepare(`
      INSERT INTO upload_logs (crew_id, crew_name, filename, file_size, media_type, note, result, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crew.id, crew.name,
      l.filename || null, l.file_size ?? null, l.media_type || null,
      l.note || null, l.result || null, l.reason || null,
    ));
    await db.batch(stmts);

    return json({ success: true, logged: logs.length });
  } catch (error) {
    console.error('[crew/upload-log] POST error:', error);
    return json({ error: 'Failed to write upload log' }, 500);
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = cfEnv?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    const crew = await getCrew(request, db);
    if (!crew) return json({ error: 'Not authenticated' }, 401);
    await ensureTable(db);
    const limit = Math.min(Number(new URL(request.url).searchParams.get('limit')) || 100, 500);
    const rows = await db.prepare(
      'SELECT * FROM upload_logs ORDER BY id DESC LIMIT ?'
    ).bind(limit).all();
    return json({ success: true, items: rows.results || [] });
  } catch (error) {
    console.error('[crew/upload-log] GET error:', error);
    return json({ error: 'Failed to read upload log' }, 500);
  }
};
