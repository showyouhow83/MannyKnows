// Crew materials / gear issuance log.
// GET    /api/admin/crew/materials?crew_lead_id=N  — list issuances for a crew member
// POST   /api/admin/crew/materials                 — add an issuance
// DELETE /api/admin/crew/materials?id=N            — remove an issuance
//
// Admin only.

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function requireAdmin(request: Request, env: any) {
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);
  return session.isAuthenticated;
}

export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ success: false, error: 'Unauthorized' }, 401);

    const crewLeadId = Number(url.searchParams.get('crew_lead_id'));
    if (!crewLeadId || Number.isNaN(crewLeadId)) {
      return json({ success: false, error: 'crew_lead_id is required' }, 400);
    }

    const res = await db.prepare(`
      SELECT id, crew_lead_id, item, category, quantity, date_given, note, created_at
        FROM crew_materials
       WHERE crew_lead_id = ?
       ORDER BY date_given DESC, id DESC
    `).bind(crewLeadId).all();

    return json({ success: true, materials: res.results || [] });
  } catch (e) {
    console.error('[crew/materials] GET error:', e);
    return json({ success: false, error: 'Failed to load materials' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ success: false, error: 'Unauthorized' }, 401);

    const body = await request.json() as {
      crew_lead_id?: number;
      item?: string;
      category?: string;
      quantity?: number;
      date_given?: string;
      note?: string;
    };

    const crewLeadId = Number(body.crew_lead_id);
    const item = (body.item || '').trim();
    if (!crewLeadId || Number.isNaN(crewLeadId)) return json({ success: false, error: 'crew_lead_id is required' }, 400);
    if (!item) return json({ success: false, error: 'Item is required' }, 400);

    const crew = await db.prepare('SELECT id FROM crew_leads WHERE id = ?').bind(crewLeadId).first();
    if (!crew) return json({ success: false, error: 'Crew member not found' }, 404);

    const category = (body.category || '').trim() || null;
    const quantity = Number.isFinite(Number(body.quantity)) && Number(body.quantity) > 0 ? Number(body.quantity) : 1;
    const dateGiven = (body.date_given || '').trim() || null;
    const note = (body.note || '').trim() || null;

    const inserted = await db.prepare(`
      INSERT INTO crew_materials (crew_lead_id, item, category, quantity, date_given, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(crewLeadId, item, category, quantity, dateGiven, note).run();

    return json({
      success: true,
      material: {
        id: inserted.meta?.last_row_id ?? null,
        crew_lead_id: crewLeadId, item, category, quantity, date_given: dateGiven, note,
      },
    }, 201);
  } catch (e) {
    console.error('[crew/materials] POST error:', e);
    return json({ success: false, error: 'Failed to add material' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals, url }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ success: false, error: 'Unauthorized' }, 401);

    const id = Number(url.searchParams.get('id'));
    if (!id || Number.isNaN(id)) return json({ success: false, error: 'id is required' }, 400);

    await db.prepare('DELETE FROM crew_materials WHERE id = ?').bind(id).run();
    return json({ success: true });
  } catch (e) {
    console.error('[crew/materials] DELETE error:', e);
    return json({ success: false, error: 'Failed to delete material' }, 500);
  }
};
