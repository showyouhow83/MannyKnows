// Admin Media Pool API (admin session auth)
// GET ?count=1   → returns total + per-type counts (for the nav badge)
// GET (default)  → returns pool items grouped by media_type with uploader name
// DELETE ?id=N   → removes a pool row (R2 file stays for v1)

import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

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

    const url = new URL(request.url);

    if (url.searchParams.get('count') === '1') {
      const row = await db.prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN media_type = 'image' THEN 1 ELSE 0 END) AS images,
          SUM(CASE WHEN media_type = 'video' THEN 1 ELSE 0 END) AS videos
        FROM media_pool
      `).first() as { total: number; images: number; videos: number };
      return json({
        success: true,
        count: Number(row?.total || 0),
        images_count: Number(row?.images || 0),
        videos_count: Number(row?.videos || 0),
      });
    }

    const rows = await db.prepare(`
      SELECT
        mp.id, mp.media_url, mp.media_type, mp.file_size, mp.original_filename,
        mp.note, mp.created_at, mp.uploaded_by_crew_id, mp.project_id, mp.source, mp.stream_uid,
        cl.name AS uploader_name,
        p.project_number AS project_number, p.customer_name AS project_customer
      FROM media_pool mp
      LEFT JOIN crew_leads cl ON cl.id = mp.uploaded_by_crew_id
      LEFT JOIN projects p ON p.id = mp.project_id
      ORDER BY mp.created_at DESC
    `).all();

    const all = rows.results || [];
    const images = all.filter((r: any) => r.media_type === 'image');
    const videos = all.filter((r: any) => r.media_type === 'video');

    return json({ success: true, images, videos });
  } catch (error) {
    console.error('[admin/media-pool] GET error:', error);
    return json({ error: 'Failed to load media pool' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    const bucket = env?.MK_MEDIA_BUCKET;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id'));
    if (!id || Number.isNaN(id)) return json({ error: 'id is required' }, 400);

    // Grab the URL before deleting the row so we can also drop the file from R2.
    // Pool items are never referenced anywhere else (assignment moves them to
    // the destination table first, so by the time we're deleting, this file
    // is genuinely unreferenced).
    const row = await db.prepare(
      'SELECT media_url FROM media_pool WHERE id = ?'
    ).bind(id).first() as { media_url: string } | null;

    const result = await db.prepare('DELETE FROM media_pool WHERE id = ?').bind(id).run();
    if (!result.meta?.changes) return json({ error: 'Not found' }, 404);

    // Best-effort R2 cleanup. The media custom domain (MEDIA_PUBLIC_HOST,
    // default images.mannyknows.com) is the public face of the R2 bucket,
    // so the key is whatever sits after that prefix. Failure here shouldn't
    // bubble up — the DB row is already gone.
    if (row?.media_url && bucket) {
      const host = (env?.MEDIA_PUBLIC_HOST || 'images.mannyknows.com').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const key = row.media_url.replace(new RegExp(`^https?://${host}/`), '');
      if (key && key !== row.media_url) {
        try { await bucket.delete(key); }
        catch (err) { console.error('[admin/media-pool] R2 delete failed for', key, err); }
      }
    }

    return json({ success: true });
  } catch (error) {
    console.error('[admin/media-pool] DELETE error:', error);
    return json({ error: 'Failed to delete' }, 500);
  }
};
