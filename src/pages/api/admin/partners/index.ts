// Partners CRUD (admin only).
//   GET    /api/admin/partners            → list partners (+ job counts/totals)
//   POST   /api/admin/partners            → create partner
//   PATCH  /api/admin/partners            → update partner { id, ... }
//   DELETE /api/admin/partners?id=N        → delete partner (cascades jobs)

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

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const partners = await db.prepare('SELECT * FROM partners ORDER BY archived ASC, name ASC').all();
    // Per-partner counts + totals — now from the PROJECTS assigned to each
    // partner (via partner_id), not the retired partner_jobs table. So the
    // count grows as you tag more Quotes/Projects to a partner.
    const agg = await db.prepare(
      'SELECT partner_id, COUNT(*) AS job_count, COALESCE(SUM(total),0) AS total FROM projects WHERE partner_id IS NOT NULL GROUP BY partner_id'
    ).all();
    const byId: Record<number, any> = {};
    for (const r of (agg.results || []) as any[]) byId[r.partner_id] = r;
    const list = (partners.results || []).map((p: any) => ({
      ...p,
      job_count: byId[p.id]?.job_count || 0,
      total: byId[p.id]?.total || 0,
    }));
    return json({ success: true, partners: list });
  } catch (e) {
    console.error('[partners GET] error:', e);
    return json({ error: 'Failed to load partners' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const b = await request.json() as any;
    const name = (b.name || '').trim();
    if (!name) return json({ error: 'Partner name is required' }, 400);

    // Derive a short code (used as the prefix for job IDs) from the name when
    // one isn't supplied — e.g. "Acme Contracting" → "ACM".
    const code = (b.code || name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3)).toUpperCase();
    const res = await db.prepare(`
      INSERT INTO partners (name, code, contact_name, phone, email, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(name, code || null, b.contact_name || null, b.phone || null, b.email || null, b.notes || null).run();
    return json({ success: true, id: res.meta?.last_row_id });
  } catch (e) {
    console.error('[partners POST] error:', e);
    return json({ error: 'Failed to create partner' }, 500);
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
    for (const f of ['name', 'contact_name', 'phone', 'email', 'notes', 'website', 'logo_url', 'address']) {
      if (b[f] !== undefined) { fields.push(`${f} = ?`); vals.push(b[f] === '' ? null : b[f]); }
    }
    if (b.code !== undefined) { fields.push('code = ?'); vals.push(b.code ? String(b.code).toUpperCase() : null); }
    if (b.archived !== undefined) { fields.push('archived = ?'); vals.push(b.archived ? 1 : 0); }
    if (!fields.length) return json({ error: 'Nothing to update' }, 400);

    // If the logo is changing, remember the old one so we can delete it from R2
    // after the update — re-uploading a logo overwrites/cleans up the prior file
    // instead of leaving orphans.
    let oldLogoUrl: string | null = null;
    if (b.logo_url !== undefined) {
      const cur = await db.prepare('SELECT logo_url FROM partners WHERE id = ?').bind(id).first() as { logo_url?: string } | null;
      oldLogoUrl = cur?.logo_url || null;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    vals.push(id);
    await db.prepare(`UPDATE partners SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run();

    // Best-effort cleanup of the replaced logo (only our own uploads).
    const newLogoUrl = b.logo_url === '' ? null : b.logo_url;
    if (oldLogoUrl && oldLogoUrl !== newLogoUrl && oldLogoUrl.includes('/partner-logos/')) {
      try {
        const bucket = env?.MK_MEDIA_BUCKET;
        const r2Path = oldLogoUrl.replace(/^https?:\/\/[^/]+\//, '');
        if (bucket && r2Path.startsWith('partner-logos/')) await bucket.delete(r2Path);
      } catch (delErr) {
        console.warn('[partners PATCH] old logo delete failed (continuing):', delErr);
      }
    }
    return json({ success: true });
  } catch (e) {
    console.error('[partners PATCH] error:', e);
    return json({ error: 'Failed to update partner' }, 500);
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
    await db.prepare('DELETE FROM partner_jobs WHERE partner_id = ?').bind(id).run();
    await db.prepare('DELETE FROM partners WHERE id = ?').bind(id).run();
    return json({ success: true });
  } catch (e) {
    console.error('[partners DELETE] error:', e);
    return json({ error: 'Failed to delete partner' }, 500);
  }
};
