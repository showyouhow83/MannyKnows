// Admin CRUD for the homepage hero slider (hero_slides table).
//   GET    /api/admin/hero-slides            → list slides (seeds defaults if empty)
//   POST   /api/admin/hero-slides            → create a slide (appended last)
//   PATCH  /api/admin/hero-slides            → update one { id, ...fields } OR reorder { reorder: [ids] }
//   DELETE /api/admin/hero-slides?id=N         → delete a slide
//
// The table is created lazily (IF NOT EXISTS) so the feature bootstraps itself
// on first admin load — no separate migration step required for it to work.
// DEFAULT_HERO_SLIDES is the (currently empty for MK) seed set; the public
// site does not render the slider yet, so an empty table just shows the
// manager's empty state.

import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';
import { DEFAULT_HERO_SLIDES, HERO_TITLE_MAX, HERO_DESC_MAX } from '../../../lib/heroSlides';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function requireAdmin(request: Request, env: any): Promise<boolean> {
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);
  return session.isAuthenticated;
}

async function ensureTable(db: any): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS hero_slides (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      title            TEXT    NOT NULL DEFAULT '',
      description      TEXT    NOT NULL DEFAULT '',
      link_url         TEXT    NOT NULL DEFAULT '#',
      image_url        TEXT    NOT NULL,
      image_mobile_url TEXT,
      alt              TEXT,
      sort_order       INTEGER NOT NULL DEFAULT 0,
      enabled          INTEGER NOT NULL DEFAULT 1,
      created_at       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON hero_slides (enabled, sort_order, id)').run();
}

const clampTitle = (s: unknown) => String(s ?? '').slice(0, HERO_TITLE_MAX);
const clampDesc = (s: unknown) => String(s ?? '').slice(0, HERO_DESC_MAX);
const cleanUrl = (s: unknown) => String(s ?? '').trim();

async function listSlides(db: any) {
  const r = await db.prepare(
    'SELECT id, title, description, link_url, image_url, image_mobile_url, alt, sort_order, enabled FROM hero_slides ORDER BY sort_order ASC, id ASC'
  ).all();
  return (r.results || []) as any[];
}

// Insert the default set the first time the manager is opened so the admin sees
// (and can edit) the slides that are currently live.
async function seedDefaults(db: any) {
  const stmts = DEFAULT_HERO_SLIDES.map((s) =>
    db.prepare(
      `INSERT INTO hero_slides (title, description, link_url, image_url, image_mobile_url, alt, sort_order, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
    ).bind(
      clampTitle(s.title), clampDesc(s.description), cleanUrl(s.link_url) || '#',
      s.image_url, s.image_mobile_url || null, s.alt || null, s.sort_order ?? 0
    )
  );
  if (stmts.length) await db.batch(stmts);
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'DB unavailable' }, 503);
    if (!(await requireAdmin(request, env))) return json({ success: false, error: 'Unauthorized' }, 401);

    await ensureTable(db);
    let slides = await listSlides(db);
    if (slides.length === 0) {
      await seedDefaults(db);
      slides = await listSlides(db);
    }
    return json({ success: true, slides, limits: { title: HERO_TITLE_MAX, description: HERO_DESC_MAX } });
  } catch (e) {
    console.error('[hero-slides GET]', e);
    return json({ success: false, error: 'Failed to load slides' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'DB unavailable' }, 503);
    if (!(await requireAdmin(request, env))) return json({ success: false, error: 'Unauthorized' }, 401);

    const b = await request.json() as any;
    const image_url = cleanUrl(b.image_url);
    if (!image_url) return json({ success: false, error: 'An image is required' }, 400);

    await ensureTable(db);
    const max = await db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM hero_slides').first() as { m: number } | null;
    const nextOrder = (max?.m ?? -1) + 1;

    const res = await db.prepare(
      `INSERT INTO hero_slides (title, description, link_url, image_url, image_mobile_url, alt, sort_order, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      clampTitle(b.title), clampDesc(b.description), cleanUrl(b.link_url) || '#',
      image_url, cleanUrl(b.image_mobile_url) || null, (b.alt ? String(b.alt).slice(0, 200) : null),
      nextOrder, b.enabled === 0 ? 0 : 1
    ).run();
    return json({ success: true, id: res.meta?.last_row_id });
  } catch (e) {
    console.error('[hero-slides POST]', e);
    return json({ success: false, error: 'Failed to create slide' }, 500);
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'DB unavailable' }, 503);
    if (!(await requireAdmin(request, env))) return json({ success: false, error: 'Unauthorized' }, 401);

    const b = await request.json() as any;
    await ensureTable(db);

    // Reorder: set sort_order from the position of each id in the array.
    if (Array.isArray(b.reorder)) {
      const ids = b.reorder.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n));
      if (ids.length) {
        const stmts = ids.map((id: number, i: number) =>
          db.prepare('UPDATE hero_slides SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(i, id)
        );
        await db.batch(stmts);
      }
      return json({ success: true });
    }

    const id = Number(b.id);
    if (!id) return json({ success: false, error: 'id is required' }, 400);

    const fields: string[] = [];
    const vals: any[] = [];
    if (b.title !== undefined) { fields.push('title = ?'); vals.push(clampTitle(b.title)); }
    if (b.description !== undefined) { fields.push('description = ?'); vals.push(clampDesc(b.description)); }
    if (b.link_url !== undefined) { fields.push('link_url = ?'); vals.push(cleanUrl(b.link_url) || '#'); }
    if (b.image_url !== undefined) { fields.push('image_url = ?'); vals.push(cleanUrl(b.image_url)); }
    if (b.image_mobile_url !== undefined) { fields.push('image_mobile_url = ?'); vals.push(cleanUrl(b.image_mobile_url) || null); }
    if (b.alt !== undefined) { fields.push('alt = ?'); vals.push(b.alt ? String(b.alt).slice(0, 200) : null); }
    if (b.enabled !== undefined) { fields.push('enabled = ?'); vals.push(b.enabled ? 1 : 0); }
    if (!fields.length) return json({ success: false, error: 'Nothing to update' }, 400);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    vals.push(id);
    await db.prepare(`UPDATE hero_slides SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run();
    return json({ success: true });
  } catch (e) {
    console.error('[hero-slides PATCH]', e);
    return json({ success: false, error: 'Failed to update slide' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals, url }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'DB unavailable' }, 503);
    if (!(await requireAdmin(request, env))) return json({ success: false, error: 'Unauthorized' }, 401);

    const id = Number(url.searchParams.get('id'));
    if (!id) return json({ success: false, error: 'id is required' }, 400);
    await ensureTable(db);
    await db.prepare('DELETE FROM hero_slides WHERE id = ?').bind(id).run();
    return json({ success: true });
  } catch (e) {
    console.error('[hero-slides DELETE]', e);
    return json({ success: false, error: 'Failed to delete slide' }, 500);
  }
};
