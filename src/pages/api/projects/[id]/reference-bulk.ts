// Bulk operations on a project's Reference Media (project_updates rows).
// Admin only. POST { action: 'delete' | 'to_pool', ids: number[] }
//   delete  → permanently remove the selected project_updates rows
//   to_pool → move them back into media_pool (source 'admin-reassign'),
//             then remove them from the project. Used to undo a wrong
//             pool→project assignment in bulk.
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const isVideoUrl = (u: string) => !!u && /\.(mp4|mov|webm|m4v)(?:\?|$)/i.test(u);

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const projectId = params.id;

    if (!db) return json({ success: false, error: 'Database not available' }, 503);

    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return json({ success: false, error: 'Admin authentication required' }, 401);

    const body = (await request.json().catch(() => ({}))) as { action?: string; ids?: unknown };
    const action = body.action;
    const ids = Array.isArray(body.ids)
      ? body.ids.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0)
      : [];

    if (!projectId) return json({ success: false, error: 'Project ID required' }, 400);
    if (action !== 'delete' && action !== 'to_pool') return json({ success: false, error: 'Invalid action' }, 400);
    if (!ids.length) return json({ success: false, error: 'No items selected' }, 400);

    const placeholders = ids.map(() => '?').join(',');

    // Only operate on rows that actually belong to THIS project.
    const rows = (await db.prepare(
      `SELECT id, image_url, stream_uid, note FROM project_updates WHERE project_id = ? AND id IN (${placeholders})`
    ).bind(projectId, ...ids).all()).results as Array<{ id: number; image_url: string | null; stream_uid: string | null; note: string | null }>;

    if (!rows.length) return json({ success: false, error: 'No matching items found' }, 404);
    const validIds = rows.map((r) => r.id);
    const vp = validIds.map(() => '?').join(',');

    if (action === 'to_pool') {
      // media_pool.uploaded_by_crew_id is NOT NULL (FK → crew_leads), so we need
      // a valid crew id. Prefer this project's assigned crew lead; otherwise fall
      // back to any crew lead. source 'admin-reassign' is what actually marks
      // the origin. If there are no crew leads at all, we can't satisfy the FK.
      const proj = await db.prepare('SELECT crew_lead_id FROM projects WHERE id = ?').bind(projectId).first() as { crew_lead_id: number | null } | null;
      let crewId: number | null = proj?.crew_lead_id ?? null;
      if (!crewId) {
        const anyCrew = await db.prepare('SELECT id FROM crew_leads ORDER BY id LIMIT 1').first() as { id: number } | null;
        crewId = anyCrew?.id ?? null;
      }
      if (!crewId) return json({ success: false, error: 'Move to pool needs at least one crew lead to exist' }, 400);

      // Re-insert each media row into the pool (tagged to this project), then
      // delete the originals. Note-only rows (no image_url) are skipped for the
      // pool insert but still removed from the project.
      const batch: any[] = [];
      for (const r of rows) {
        if (!r.image_url) continue;
        const mediaType = r.stream_uid || isVideoUrl(r.image_url) ? 'video' : 'image';
        batch.push(
          db.prepare(
            `INSERT INTO media_pool (media_url, media_type, original_filename, note, uploaded_by_crew_id, project_id, source, stream_uid, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'admin-reassign', ?, CURRENT_TIMESTAMP)`
          ).bind(r.image_url, mediaType, null, r.note || null, crewId, projectId, r.stream_uid || null)
        );
      }
      batch.push(db.prepare(`DELETE FROM project_updates WHERE project_id = ? AND id IN (${vp})`).bind(projectId, ...validIds));
      await db.batch(batch);
      return json({ success: true, moved: rows.filter((r) => r.image_url).length, removed: validIds.length });
    }

    // action === 'delete'
    await db.prepare(`DELETE FROM project_updates WHERE project_id = ? AND id IN (${vp})`).bind(projectId, ...validIds).run();
    return json({ success: true, deleted: validIds.length });
  } catch (error) {
    console.error('[reference-bulk] error:', error);
    return json({ success: false, error: 'Bulk operation failed' }, 500);
  }
};
