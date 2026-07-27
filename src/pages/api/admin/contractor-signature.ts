// GET /api/admin/contractor-signature
// PUT /api/admin/contractor-signature
//
// Singleton store for the contractor signature that's auto-applied to
// every new project contract. v67 schema constrains this to id=1.

import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

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

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const row = await db.prepare('SELECT * FROM contractor_signature WHERE id = 1').first();
    return json({ success: true, signature: row || null });
  } catch (error) {
    console.error('[contractor-signature] GET error:', error);
    return json({ error: 'Failed to load signature' }, 500);
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const body = await request.json() as {
      signer_name?: string;
      printed_title?: string | null;
      signature_data_url?: string;
    };

    const signerName = (body.signer_name || '').trim();
    const printedTitle = (body.printed_title || '').trim() || null;
    const dataUrl = (body.signature_data_url || '').trim();

    if (!signerName) return json({ error: 'Your full name is required' }, 400);
    if (!dataUrl || !dataUrl.startsWith('data:image/')) return json({ error: 'A drawn or uploaded signature image is required' }, 400);

    // Upsert into the singleton row.
    await db.prepare(`
      INSERT INTO contractor_signature (id, signer_name, printed_title, signature_data_url, updated_at)
      VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        signer_name = excluded.signer_name,
        printed_title = excluded.printed_title,
        signature_data_url = excluded.signature_data_url,
        updated_at = CURRENT_TIMESTAMP
    `).bind(signerName, printedTitle, dataUrl).run();

    return json({ success: true });
  } catch (error) {
    console.error('[contractor-signature] PUT error:', error);
    return json({ error: 'Failed to save signature' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    await db.prepare('DELETE FROM contractor_signature WHERE id = 1').run();
    return json({ success: true });
  } catch (error) {
    console.error('[contractor-signature] DELETE error:', error);
    return json({ error: 'Failed to delete signature' }, 500);
  }
};
