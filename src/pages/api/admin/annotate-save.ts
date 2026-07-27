// POST /api/admin/annotate-save
//
// Receives a flattened, annotated image (red/green markup, arrows, notes,
// numbered pins + legend) as a JPEG data URL and saves it as a NEW image —
// the original is never touched. Annotated copies live under R2 'annotations/'
// and are deliberately EXCLUDED from portfolio promotion (see
// api/projects/index.ts portfolio copy + the project_updates posted_by tag).
//
// Body:
//   target    'quote' | 'project'
//   id        quote_id or project_id
//   data_url  "data:image/jpeg;base64,..."
//   caption   optional note
//
// Returns { success, url }

import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';
import { publicUrlForR2Path } from '../../../lib/publicUrl';

export const prerender = false;

const MAX_BYTES = 12 * 1024 * 1024; // 12MB — flattened JPEGs are modest

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; ext: string } | null {
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  try {
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, ext };
  } catch { return null; }
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    const bucket = env?.MK_MEDIA_BUCKET;
    if (!db || !bucket) return json({ success: false, error: 'Storage not configured' }, 503);

    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return json({ success: false, error: 'Unauthorized' }, 401);

    // Image is sent as RAW BINARY (not a base64 data_url in JSON) — a multi-MB
    // base64 body tripped Cloudflare's WAF and 403'd before reaching here.
    // target/id come from the query string, caption from a header.
    const reqUrl = new URL(request.url);
    const target = reqUrl.searchParams.get('target') || undefined;
    const id = Number(reqUrl.searchParams.get('id'));
    const caption = (request.headers.get('X-Anno-Caption') || 'Annotated').trim() || 'Annotated';

    if (target !== 'quote' && target !== 'project') return json({ success: false, error: 'target must be quote | project' }, 400);
    if (!id || Number.isNaN(id)) return json({ success: false, error: 'id is required' }, 400);

    const ct = request.headers.get('Content-Type') || 'image/jpeg';
    const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg';
    const contentType = ct.includes('png') ? 'image/png' : (ct.includes('webp') ? 'image/webp' : 'image/jpeg');
    const bytes = await request.arrayBuffer();
    if (!bytes || bytes.byteLength === 0) return json({ success: false, error: 'Empty image' }, 400);
    if (bytes.byteLength > MAX_BYTES) return json({ success: false, error: 'Image too large' }, 413);

    const ts = Date.now();
    // 'annotations/' prefix is the portfolio-exclusion signal.
    const r2Path = `annotations/${target}-${id}/${ts}.${ext}`;

    await bucket.put(r2Path, bytes, {
      httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { kind: 'annotation', target, targetId: String(id), createdAt: new Date().toISOString() },
    });

    const url = publicUrlForR2Path(r2Path, request);

    if (target === 'quote') {
      // Append to the quote's project_images array.
      const quote = await db.prepare('SELECT id, project_images FROM quotes WHERE id = ?').bind(id).first() as { id: number; project_images: string | null } | null;
      if (!quote) return json({ success: false, error: 'Quote not found' }, 404);
      let arr: string[] = [];
      try { arr = JSON.parse(quote.project_images || '[]'); } catch { arr = []; }
      arr.push(url);
      await db.prepare('UPDATE quotes SET project_images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(JSON.stringify(arr), id).run();
    } else {
      // Project: record as a project_updates row tagged posted_by='annotation'
      // so it's excluded from portfolio promotion + crew reference images.
      const project = await db.prepare('SELECT id FROM projects WHERE id = ?').bind(id).first();
      if (!project) return json({ success: false, error: 'Project not found' }, 404);
      await db.prepare(`
        INSERT INTO project_updates (project_id, image_url, note, posted_by, posted_by_name, created_at)
        VALUES (?, ?, ?, 'annotation', 'Admin', CURRENT_TIMESTAMP)
      `).bind(id, url, caption).run();
    }

    return json({ success: true, url });
  } catch (e) {
    console.error('[annotate-save] error:', e);
    return json({ success: false, error: 'Failed to save annotated image' }, 500);
  }
};
