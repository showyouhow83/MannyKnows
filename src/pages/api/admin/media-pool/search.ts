// Search endpoint that powers the assign-modal picker on /admin/media-pool.
// Returns up to 20 matching records of the requested type.
// Each item: { id, label } where label is a human-friendly identifier.

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);

    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return json({ error: 'Unauthorized' }, 401);

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const q = (url.searchParams.get('q') || '').trim();
    const like = `%${q.toLowerCase()}%`;

    if (!['lead', 'quote', 'project', 'portfolio'].includes(type || '')) {
      return json({ error: 'type must be lead | quote | project | portfolio' }, 400);
    }

    let results: any[] = [];

    // Hide records that have already advanced to the next stage — once a
    // lead is promoted, new media belongs on the quote (and so on down the
    // pipeline). Status meanings on leads:
    //   - 'promoted' → has a quote
    //   - 'won' / 'completed' → went all the way through to portfolio
    //     (sync-pipeline.ts sets 'won' when the project becomes portfolio)
    //   - 'failed' / 'cancelled' → dead ends
    if (type === 'lead') {
      const excluded = "('promoted', 'won', 'completed', 'failed', 'cancelled')";
      const rows = q
        ? await db.prepare(`
            SELECT id, customer_name, address, city, status, created_at
            FROM leads
            WHERE status NOT IN ${excluded}
              AND (LOWER(customer_name) LIKE ? OR LOWER(address) LIKE ? OR LOWER(city) LIKE ?)
            ORDER BY created_at DESC LIMIT 20
          `).bind(like, like, like).all()
        : await db.prepare(
            `SELECT id, customer_name, address, city, status, created_at FROM leads WHERE status NOT IN ${excluded} ORDER BY created_at DESC LIMIT 20`
          ).all();
      results = (rows.results || []).map((r: any) => ({
        id: r.id,
        label: `${r.customer_name || 'Unnamed'}: ${r.city || r.address || 'no address'} · ${r.status}`,
      }));
    } else if (type === 'quote') {
      const excluded = "('project', 'failed')";
      const rows = q
        ? await db.prepare(`
            SELECT id, quote_number, customer_name, status, total
            FROM quotes
            WHERE status NOT IN ${excluded}
              AND (LOWER(customer_name) LIKE ? OR LOWER(quote_number) LIKE ?)
            ORDER BY created_at DESC LIMIT 20
          `).bind(like, like).all()
        : await db.prepare(
            `SELECT id, quote_number, customer_name, status, total FROM quotes WHERE status NOT IN ${excluded} ORDER BY created_at DESC LIMIT 20`
          ).all();
      results = (rows.results || []).map((r: any) => ({
        id: r.id,
        label: `${(r.quote_number || `#${r.id}`)}: ${r.customer_name || 'Unnamed'}${r.total ? ` · $${Number(r.total).toLocaleString()}` : ''} · ${r.status}`,
      }));
    } else if (type === 'project') {
      const excluded = "('portfolio')";
      const rows = q
        ? await db.prepare(`
            SELECT id, project_number, customer_name, customer_city, status
            FROM projects
            WHERE status NOT IN ${excluded}
              AND (LOWER(customer_name) LIKE ? OR LOWER(project_number) LIKE ? OR LOWER(customer_city) LIKE ?)
            ORDER BY created_at DESC LIMIT 20
          `).bind(like, like, like).all()
        : await db.prepare(
            `SELECT id, project_number, customer_name, customer_city, status FROM projects WHERE status NOT IN ${excluded} ORDER BY created_at DESC LIMIT 20`
          ).all();
      results = (rows.results || []).map((r: any) => ({
        id: r.id,
        label: `${r.project_number || `#${r.id}`}: ${r.customer_name || 'Unnamed'} · ${r.customer_city || ''} · ${r.status}`,
      }));
    } else {
      // Many portfolios share a project_name. Pull client_name + client_city
      // so the picker label has enough signal to disambiguate.
      const rows = q
        ? await db.prepare(`
            SELECT id, project_name, slug, is_published, client_name, client_city
            FROM portfolios
            WHERE LOWER(project_name) LIKE ?
               OR LOWER(slug) LIKE ?
               OR LOWER(COALESCE(client_name, '')) LIKE ?
               OR LOWER(COALESCE(client_city, '')) LIKE ?
            ORDER BY created_at DESC LIMIT 20
          `).bind(like, like, like, like).all()
        : await db.prepare(
            'SELECT id, project_name, slug, is_published, client_name, client_city FROM portfolios ORDER BY created_at DESC LIMIT 20'
          ).all();
      results = (rows.results || []).map((r: any) => {
        const parts = [];
        if (r.client_name) parts.push(r.client_name);
        if (r.client_city) parts.push(r.client_city);
        if (r.project_name) parts.push(r.project_name);
        const label = parts.join(' · ') || `Portfolio #${r.id}`;
        return { id: r.id, label: `${label}${r.is_published ? '' : ' (draft)'}` };
      });
    }

    return json({ success: true, results });
  } catch (error) {
    console.error('[admin/media-pool/search] error:', error);
    return json({ error: 'Search failed' }, 500);
  }
};
