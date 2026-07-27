// Partner jobs CRUD (admin only).
//   GET    /api/admin/partners/jobs?partner_id=N   → jobs for a partner
//   POST   /api/admin/partners/jobs                → create job (mints crew_token)
//   PATCH  /api/admin/partners/jobs                → update job { id, ... }
//   DELETE /api/admin/partners/jobs?id=N           → delete job

import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function requireAdmin(request: Request, env: any) {
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);
  return session.isAuthenticated;
}

const STATUSES = ['pending', 'in_progress', 'completed'];

export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const partnerId = Number(url.searchParams.get('partner_id'));
    if (!partnerId) return json({ error: 'partner_id is required' }, 400);
    const jobs = await db.prepare(
      'SELECT * FROM partner_jobs WHERE partner_id = ? ORDER BY created_at DESC'
    ).bind(partnerId).all();
    return json({ success: true, jobs: jobs.results || [] });
  } catch (e) {
    console.error('[partner-jobs GET] error:', e);
    return json({ error: 'Failed to load jobs' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const b = await request.json() as any;
    const partnerId = Number(b.partner_id);
    if (!partnerId) return json({ error: 'partner_id is required' }, 400);

    const crewToken = crypto.randomUUID().substring(0, 10);
    const status = STATUSES.includes(b.status) ? b.status : 'pending';

    // Build a project-style ID: <PARTNER CODE>-<8 hex>. Falls back to "JOB"
    // when the partner has no code yet.
    const partner = await db.prepare('SELECT code FROM partners WHERE id = ?').bind(partnerId).first() as { code: string | null } | null;
    const code = (partner?.code || 'JOB').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'JOB';
    const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    const jobNumber = `${code}-${rand}`;

    const res = await db.prepare(`
      INSERT INTO partner_jobs
        (partner_id, client_name, address, phone, work_type, scope, colors, price, pdf_url, pdf_name, status, notes, crew_token, job_number, scheduled_start, scheduled_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      partnerId, b.client_name || null, b.address || null, b.phone || null,
      b.work_type || null, b.scope || null, b.colors || null, Number(b.price) || 0,
      b.pdf_url || null, b.pdf_name || null, status, b.notes || null, crewToken,
      jobNumber, b.scheduled_start || null, b.scheduled_end || null
    ).run();
    return json({ success: true, id: res.meta?.last_row_id, crew_token: crewToken, job_number: jobNumber });
  } catch (e) {
    console.error('[partner-jobs POST] error:', e);
    return json({ error: 'Failed to create job' }, 500);
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const b = await request.json() as any;
    const id = Number(b.id);
    if (!id) return json({ error: 'id is required' }, 400);

    const fields: string[] = [];
    const vals: any[] = [];
    for (const f of ['client_name', 'address', 'phone', 'work_type', 'scope', 'colors', 'pdf_url', 'pdf_name', 'notes', 'scheduled_start', 'scheduled_end']) {
      if (b[f] !== undefined) { fields.push(`${f} = ?`); vals.push(b[f] === '' ? null : b[f]); }
    }
    if (b.price !== undefined) { fields.push('price = ?'); vals.push(Number(b.price) || 0); }
    if (b.status !== undefined && STATUSES.includes(b.status)) { fields.push('status = ?'); vals.push(b.status); }
    if (!fields.length) return json({ error: 'Nothing to update' }, 400);
    fields.push('updated_at = CURRENT_TIMESTAMP');
    vals.push(id);
    await db.prepare(`UPDATE partner_jobs SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run();
    return json({ success: true });
  } catch (e) {
    console.error('[partner-jobs PATCH] error:', e);
    return json({ error: 'Failed to update job' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals, url }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const id = Number(url.searchParams.get('id'));
    if (!id) return json({ error: 'id is required' }, 400);
    await db.prepare('DELETE FROM partner_jobs WHERE id = ?').bind(id).run();
    return json({ success: true });
  } catch (e) {
    console.error('[partner-jobs DELETE] error:', e);
    return json({ error: 'Failed to delete job' }, 500);
  }
};
