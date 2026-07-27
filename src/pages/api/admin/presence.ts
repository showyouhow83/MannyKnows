// Admin presence / "who's editing what" — Layer 1 of concurrent-edit safety.
//
// Keyed on a per-DEVICE client id (not the username), so two people sharing one
// admin login still show up as two — and the "someone else is editing this"
// banner fires between them. One row per browser/device.
//
// POST /api/admin/presence   heartbeat: { client_id, record_type?, record_id?, page? }
//   → { others: [...] }  OTHER devices on the SAME record (last 30s)
//     { online: [...]  }  every device active anywhere (last 45s)
//     { me }              the caller's client_id (for "(you)" tagging)
// GET  /api/admin/presence   just the online list.
// DELETE /api/admin/presence { client_id }  clears the caller's presence.
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

const FRESH_RECORD_SECS = 30;
const FRESH_ONLINE_SECS = 45;
const STALE_PURGE_SECS = 600;

// New schema (per-device). A fresh table name avoids migrating the old
// username-keyed admin_presence table — presence is transient, so the old one
// just ages out and is harmless.
async function ensureTable(db: any) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS admin_presence_v2 (
      client_id   TEXT PRIMARY KEY,
      admin_name  TEXT,
      record_type TEXT,
      record_id   TEXT,
      page        TEXT,
      last_seen   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function auth(request: Request, env: any) {
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  return AdminAuth.validateSession(request, sessionSecret);
}

function safeClientId(raw: any): string {
  const s = String(raw || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  return s.length >= 6 ? s : '';
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return j({ success: false, error: 'DB not configured' }, 503);
    const session = await auth(request, env);
    if (!session.isAuthenticated) return j({ success: false, error: 'Unauthorized' }, 401);

    await ensureTable(db);

    const me = session.username || 'admin';
    const body = await request.json().catch(() => ({})) as any;
    // Fall back to a username-derived key if the client didn't send one, so a
    // heartbeat still works (it just collapses that user's devices to one row).
    const clientId = safeClientId(body.client_id) || `u_${me}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
    const recordType = (body.record_type || '').toString().slice(0, 32) || null;
    const recordId = body.record_id !== undefined && body.record_id !== null ? String(body.record_id).slice(0, 64) : null;
    const page = (body.page || '').toString().slice(0, 200) || null;

    await db.prepare(`
      INSERT INTO admin_presence_v2 (client_id, admin_name, record_type, record_id, page, last_seen)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(client_id) DO UPDATE SET
        admin_name  = excluded.admin_name,
        record_type = excluded.record_type,
        record_id   = excluded.record_id,
        page        = excluded.page,
        last_seen   = CURRENT_TIMESTAMP
    `).bind(clientId, me, recordType, recordId, page).run();

    try { await db.prepare(`DELETE FROM admin_presence_v2 WHERE last_seen < datetime('now', ?)`).bind(`-${STALE_PURGE_SECS} seconds`).run(); } catch {}

    // Other DEVICES on the same record (exclude self by client_id, so a second
    // session of the same login still counts as "someone else").
    let others: any[] = [];
    if (recordType && recordId) {
      const res = await db.prepare(`
        SELECT admin_name, last_seen FROM admin_presence_v2
         WHERE record_type = ? AND record_id = ? AND client_id != ?
           AND last_seen >= datetime('now', ?)
         ORDER BY last_seen DESC
      `).bind(recordType, recordId, clientId, `-${FRESH_RECORD_SECS} seconds`).all();
      others = res.results || [];
    }

    const onlineRes = await db.prepare(`
      SELECT client_id, admin_name, record_type, record_id, page, last_seen FROM admin_presence_v2
       WHERE last_seen >= datetime('now', ?)
       ORDER BY last_seen DESC
    `).bind(`-${FRESH_ONLINE_SECS} seconds`).all();

    return j({ success: true, others, online: onlineRes.results || [], me: clientId });
  } catch (e) {
    console.error('[Presence] POST failed:', e);
    return j({ success: false, error: 'presence failed' }, 500);
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return j({ success: false, error: 'DB not configured' }, 503);
    const session = await auth(request, env);
    if (!session.isAuthenticated) return j({ success: false, error: 'Unauthorized' }, 401);
    await ensureTable(db);
    const onlineRes = await db.prepare(`
      SELECT client_id, admin_name, record_type, record_id, page, last_seen FROM admin_presence_v2
       WHERE last_seen >= datetime('now', ?)
       ORDER BY last_seen DESC
    `).bind(`-${FRESH_ONLINE_SECS} seconds`).all();
    return j({ success: true, online: onlineRes.results || [] });
  } catch (e) {
    console.error('[Presence] GET failed:', e);
    return j({ success: false, error: 'presence failed' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return j({ success: false, error: 'DB not configured' }, 503);
    const session = await auth(request, env);
    if (!session.isAuthenticated) return j({ success: false, error: 'Unauthorized' }, 401);
    await ensureTable(db);
    const body = await request.json().catch(() => ({})) as any;
    const clientId = safeClientId(body.client_id);
    if (clientId) await db.prepare(`DELETE FROM admin_presence_v2 WHERE client_id = ?`).bind(clientId).run();
    return j({ success: true });
  } catch (e) {
    console.error('[Presence] DELETE failed:', e);
    return j({ success: false, error: 'presence failed' }, 500);
  }
};
