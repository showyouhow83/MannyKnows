// Quote Attachment Item API
// PATCH  /api/quotes/attachments/{id}  — rename label
// DELETE /api/quotes/attachments/{id}  — remove from DB and R2
//
// Admin only.
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

export const PATCH: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return j({ success: false, error: 'Unauthorized' }, 401);
    }
    const db = env?.MK_APP_DB;
    if (!db) return j({ success: false, error: 'DB not configured' }, 503);

    const id = parseInt(params.id as string, 10);
    if (!id) return j({ success: false, error: 'Invalid attachment id' }, 400);

    const body = await request.json().catch(() => ({})) as { label?: string; is_internal?: boolean | number };

    const sets: string[] = [];
    const vals: any[] = [];
    if (typeof body.label === 'string') {
      const label = body.label.trim().slice(0, 80);
      if (!label) return j({ success: false, error: 'label cannot be empty' }, 400);
      sets.push('label = ?'); vals.push(label);
    }
    if (body.is_internal !== undefined) {
      sets.push('is_internal = ?'); vals.push(body.is_internal ? 1 : 0);
    }
    if (!sets.length) return j({ success: false, error: 'Nothing to update' }, 400);

    const res = await db.prepare(`UPDATE quote_attachments SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run();
    if ((res.meta?.changes ?? 0) === 0) return j({ success: false, error: 'Attachment not found' }, 404);

    return j({ success: true, id });
  } catch (e) {
    console.error('[QuoteAttachmentItem] PATCH failed:', e);
    return j({ success: false, error: 'Failed to update attachment' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return j({ success: false, error: 'Unauthorized' }, 401);
    }
    const db = env?.MK_APP_DB;
    const bucket = env?.MK_MEDIA_BUCKET;
    if (!db || !bucket) return j({ success: false, error: 'Storage not configured' }, 503);

    const id = parseInt(params.id as string, 10);
    if (!id) return j({ success: false, error: 'Invalid attachment id' }, 400);

    const row = await db.prepare(`SELECT id, file_url FROM quote_attachments WHERE id = ?`).bind(id).first() as { id: number; file_url: string } | null;
    if (!row) return j({ success: false, error: 'Attachment not found' }, 404);

    // Best-effort R2 delete — DB cleanup is the source of truth.
    // Handle both prod (images.mannyknows.com) and dev (/r2-local) URLs.
    try {
      const r2Path = (row.file_url || '')
        .replace('https://images.mannyknows.com/', '')
        .replace(/^https?:\/\/[^/]+\/r2-local\//, '');
      if (r2Path && !r2Path.startsWith('http')) await bucket.delete(r2Path);
    } catch (e) {
      console.warn('[QuoteAttachmentItem] R2 delete failed (continuing):', e);
    }

    await db.prepare(`DELETE FROM quote_attachments WHERE id = ?`).bind(id).run();

    return j({ success: true, id });
  } catch (e) {
    console.error('[QuoteAttachmentItem] DELETE failed:', e);
    return j({ success: false, error: 'Failed to delete attachment' }, 500);
  }
};

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
