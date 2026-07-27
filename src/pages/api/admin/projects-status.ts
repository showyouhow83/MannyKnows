// Lightweight project-status feed for the admin Projects list. Lets the list
// refresh each card's status badge (Needs Crew / Ready / Awaiting Signature /
// Contract Not Sent) live, without a full page reload.
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'DB unavailable' }, 503);

    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return json({ success: false, error: 'Unauthorized' }, 401);

    const rows = await db.prepare(`
      SELECT p.id, p.status, p.crew_lead_id,
             pc.status AS contract_status,
             cl.name AS crew_lead_name
      FROM projects p
      LEFT JOIN project_contracts pc ON pc.project_id = p.id
      LEFT JOIN crew_leads cl ON cl.id = p.crew_lead_id
    `).all();

    return json({ success: true, projects: rows.results || [] });
  } catch (e) {
    console.error('[projects-status] error:', e);
    return json({ success: false, error: 'Failed' }, 500);
  }
};
