// Project Document Item API
// PATCH  /api/projects/documents/{id}  — rename label
// DELETE /api/projects/documents/{id}  — remove from the project
//
// Admin only. DELETE removes the project_documents row. The R2 object is only
// deleted for 'admin'-sourced docs — 'quote_promotion' docs share their file
// with the originating quote's attachment, so we leave the R2 object alone.
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const PATCH: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return j({ success: false, error: 'Unauthorized' }, 401);
    const db = env?.MK_APP_DB;
    if (!db) return j({ success: false, error: 'DB not configured' }, 503);

    const id = parseInt(params.id as string, 10);
    if (!id) return j({ success: false, error: 'Invalid document id' }, 400);

    const body = await request.json().catch(() => ({})) as { label?: string };
    const label = (body.label || '').trim().slice(0, 80);
    if (!label) return j({ success: false, error: 'label is required' }, 400);

    const res = await db.prepare(`UPDATE project_documents SET label = ? WHERE id = ?`).bind(label, id).run();
    if ((res.meta?.changes ?? 0) === 0) return j({ success: false, error: 'Document not found' }, 404);

    return j({ success: true, id, label });
  } catch (e) {
    console.error('[ProjectDocumentItem] PATCH failed:', e);
    return j({ success: false, error: 'Failed to update document' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return j({ success: false, error: 'Unauthorized' }, 401);
    const db = env?.MK_APP_DB;
    if (!db) return j({ success: false, error: 'DB not configured' }, 503);

    const id = parseInt(params.id as string, 10);
    if (!id) return j({ success: false, error: 'Invalid document id' }, 400);

    const row = await db.prepare(
      `SELECT id, file_url, source FROM project_documents WHERE id = ?`
    ).bind(id).first() as { id: number; file_url: string; source: string } | null;
    if (!row) return j({ success: false, error: 'Document not found' }, 404);

    // Only delete the R2 object for project-owned uploads. Promoted docs share
    // the quote's file — deleting it would break the quote's copy.
    const bucket = env?.MK_MEDIA_BUCKET;
    if (row.source === 'admin' && bucket) {
      try {
        const r2Path = (row.file_url || '')
          .replace('https://images.mannyknows.com/', '')
          .replace(/^https?:\/\/[^/]+\/r2-local\//, '');
        if (r2Path && !r2Path.startsWith('http')) await bucket.delete(r2Path);
      } catch (e) {
        console.warn('[ProjectDocumentItem] R2 delete failed (continuing):', e);
      }
    }

    await db.prepare(`DELETE FROM project_documents WHERE id = ?`).bind(id).run();
    return j({ success: true, id });
  } catch (e) {
    console.error('[ProjectDocumentItem] DELETE failed:', e);
    return j({ success: false, error: 'Failed to delete document' }, 500);
  }
};
