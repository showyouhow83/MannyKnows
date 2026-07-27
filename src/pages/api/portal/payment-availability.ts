// Customer availability for scheduled payments.
//
// POST /api/portal/payment-availability  { token, items: [{row_id, available_date, note}] }
//
// Auth = the project's client_token. Stores a soft "when can you pay this"
// preference per payment row; it never changes the contractual due date.

import type { APIRoute } from 'astro';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);

    const body = await request.json().catch(() => ({})) as { token?: string; items?: any[] };
    const token = (body.token || request.headers.get('X-Client-Token') || '').trim();
    if (!token) return json({ error: 'Not authorized' }, 403);

    // Resolve the project + its contract from the client_token.
    const proj = await db.prepare(
      'SELECT id, client_token FROM projects WHERE client_token = ?'
    ).bind(token).first() as { id: number; client_token: string } | null;
    if (!proj || proj.client_token !== token) return json({ error: 'Not authorized' }, 403);

    const contract = await db.prepare(
      'SELECT id FROM project_contracts WHERE project_id = ? LIMIT 1'
    ).bind(proj.id).first() as { id: number } | null;
    if (!contract) return json({ error: 'No contract on this project' }, 404);

    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return json({ error: 'Nothing to save' }, 400);

    const stmts: any[] = [];
    for (const it of items) {
      const rowId = String(it.row_id || '').trim();
      if (!rowId) continue;
      let date = String(it.available_date || '').trim();
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) date = '';
      let time = String(it.available_time || '').trim();
      if (time && !/^\d{2}:\d{2}$/.test(time)) time = '';
      const note = (it.note != null ? String(it.note) : '').slice(0, 400);
      stmts.push(db.prepare(`
        INSERT INTO payment_availability (project_contract_id, row_id, available_date, available_time, note, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT (project_contract_id, row_id) DO UPDATE SET
          available_date = excluded.available_date,
          available_time = excluded.available_time,
          note = excluded.note,
          updated_at = CURRENT_TIMESTAMP
      `).bind(contract.id, rowId, date || null, time || null, note || null));
    }
    if (!stmts.length) return json({ error: 'No valid rows' }, 400);
    await db.batch(stmts);

    return json({ success: true, saved: stmts.length });
  } catch (e) {
    console.error('[portal/payment-availability] error:', e);
    return json({ error: 'Failed to save availability' }, 500);
  }
};
