// Assign pool items to a destination record (Lead / Quote / Project / Portfolio).
// Appends to the destination's media column/table, then deletes the pool rows.
// Files stay in R2 — only the DB references move.
//
// Videos are accepted on every target type. URLs preserve their file extension
// (.mov/.mp4 etc.), so admin/client/crew renderers detect video vs. image at
// render time without needing a separate column.

import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import { streamThumb } from '../../../../lib/stream';

const MAX_LEAD_IMAGES = 15;
const MAX_QUOTE_IMAGES = 100;

// D1 caps bound parameters at ~100 per statement. Keep IN(...) batches well
// under that so other bindings on the same query (target_id etc.) never push
// us over the limit.
const D1_PARAM_CHUNK = 50;

type TargetType = 'lead' | 'quote' | 'project' | 'portfolio';

interface AssignBody {
  pool_ids: number[];
  target_type: TargetType;
  target_id: number;
  caption?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// De-dupe key: the original filename with R2's timestamp prefix stripped and
// lowercased (e.g. `1782..._IMG_4170.jpeg` → `img_4170.jpeg`). Re-assigning a
// file that already exists on the target overwrites it instead of duplicating.
function baseName(u: string): string {
  const seg = String(u || '').split('?')[0].split('/').pop() || '';
  return seg.replace(/^\d+_/, '').toLowerCase();
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);

    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return json({ error: 'Unauthorized' }, 401);

    const body = await request.json() as AssignBody;
    const poolIds = (body.pool_ids || []).map(Number).filter(n => Number.isFinite(n));
    const targetId = Number(body.target_id);
    const caption = (body.caption || '').trim() || null;

    if (!poolIds.length) return json({ error: 'pool_ids must be a non-empty array' }, 400);
    if (!targetId || Number.isNaN(targetId)) return json({ error: 'target_id is required' }, 400);
    if (!['lead', 'quote', 'project', 'portfolio'].includes(body.target_type)) {
      return json({ error: 'target_type must be lead | quote | project | portfolio' }, 400);
    }

    // Load pool items in chunks to dodge D1's per-statement parameter cap.
    type PoolItem = {
      id: number; media_url: string; media_type: 'image' | 'video';
      original_filename: string | null; file_size: number | null;
      uploader_name: string | null; stream_uid: string | null;
    };
    const items: PoolItem[] = [];
    for (const ids of chunk(poolIds, D1_PARAM_CHUNK)) {
      const placeholders = ids.map(() => '?').join(',');
      const res = await db.prepare(`
        SELECT mp.id, mp.media_url, mp.media_type, mp.original_filename, mp.file_size,
               mp.stream_uid, cl.name AS uploader_name
        FROM media_pool mp
        LEFT JOIN crew_leads cl ON cl.id = mp.uploaded_by_crew_id
        WHERE mp.id IN (${placeholders})
      `).bind(...ids).all();
      items.push(...((res.results || []) as PoolItem[]));
    }

    if (!items.length) return json({ error: 'No matching pool items' }, 404);

    const assigned: number[] = [];
    const errors: Array<{ pool_id: number; error: string }> = [];
    // Visibility: how many were NEW rows vs. de-dupe OVERWRITES of an existing
    // same-filename item. Returned so the UI can show "added X / overwritten Y".
    let added = 0;
    let overwritten = 0;

    if (body.target_type === 'lead') {
      const lead = await db.prepare(
        'SELECT id, project_images FROM leads WHERE id = ?'
      ).bind(targetId).first() as { id: number; project_images: string | null } | null;
      if (!lead) return json({ error: 'Lead not found' }, 404);

      let urls: string[] = [];
      try { urls = JSON.parse(lead.project_images || '[]'); } catch { urls = []; }

      for (const it of items) {
        const dupIdx = urls.findIndex(u => baseName(u) === baseName(it.media_url));
        if (dupIdx >= 0) {
          urls[dupIdx] = it.media_url; // overwrite same-filename
          overwritten++;
          assigned.push(it.id);
          continue;
        }
        if (urls.length >= MAX_LEAD_IMAGES) {
          errors.push({ pool_id: it.id, error: `Lead already at max ${MAX_LEAD_IMAGES} items` });
          continue;
        }
        urls.push(it.media_url);
        added++;
        assigned.push(it.id);
      }

      if (assigned.length) {
        await db.prepare(
          'UPDATE leads SET project_images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(JSON.stringify(urls), targetId).run();
      }
    } else if (body.target_type === 'quote') {
      const quote = await db.prepare(
        'SELECT id, project_images FROM quotes WHERE id = ?'
      ).bind(targetId).first() as { id: number; project_images: string | null } | null;
      if (!quote) return json({ error: 'Quote not found' }, 404);

      let urls: string[] = [];
      try { urls = JSON.parse(quote.project_images || '[]'); } catch { urls = []; }

      for (const it of items) {
        const dupIdx = urls.findIndex(u => baseName(u) === baseName(it.media_url));
        if (dupIdx >= 0) {
          urls[dupIdx] = it.media_url; // overwrite same-filename
          overwritten++;
          assigned.push(it.id);
          continue;
        }
        if (urls.length >= MAX_QUOTE_IMAGES) {
          errors.push({ pool_id: it.id, error: `Quote already at max ${MAX_QUOTE_IMAGES} items` });
          continue;
        }
        urls.push(it.media_url);
        added++;
        assigned.push(it.id);
      }

      if (assigned.length) {
        await db.prepare(
          'UPDATE quotes SET project_images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(JSON.stringify(urls), targetId).run();
      }
    } else if (body.target_type === 'project') {
      const project = await db.prepare(
        'SELECT id FROM projects WHERE id = ?'
      ).bind(targetId).first() as { id: number } | null;
      if (!project) return json({ error: 'Project not found' }, 404);

      // De-dupe by ORIGINAL filename (timestamp stripped): assigning a file
      // that's already in this project's reference media overwrites that row
      // instead of adding a second copy — same rule as direct uploads.
      const existingRows = await db.prepare(
        'SELECT id, image_url FROM project_updates WHERE project_id = ? AND image_url IS NOT NULL'
      ).bind(targetId).all();
      const byName = new Map<string, number>();
      (existingRows.results || []).forEach((r: any) => byName.set(baseName(r.image_url), r.id));

      // One prepared statement per item, shipped as a single batch (one D1 round
      // trip in a transaction). Each is an UPDATE if the file already exists on
      // the project, else an INSERT.
      const stmts = items.map(it => {
        const poster = it.stream_uid ? (streamThumb(it.stream_uid, '1s', env) || null) : null;
        const existingId = byName.get(baseName(it.media_url));
        if (existingId) {
          overwritten++;
          return db.prepare(`
            UPDATE project_updates
            SET image_url = ?, stream_uid = ?, poster_url = ?, created_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(it.media_url, it.stream_uid || null, poster, existingId);
        }
        added++;
        return db.prepare(`
          INSERT INTO project_updates (project_id, image_url, note, posted_by, posted_by_name, stream_uid, poster_url, created_at)
          VALUES (?, ?, ?, 'crew_lead', ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(targetId, it.media_url, caption, it.uploader_name || 'Crew', it.stream_uid || null, poster);
      });
      if (stmts.length) await db.batch(stmts);
      for (const it of items) assigned.push(it.id);
    } else {
      // portfolio
      const portfolio = await db.prepare(
        'SELECT id FROM portfolios WHERE id = ?'
      ).bind(targetId).first() as { id: number } | null;
      if (!portfolio) return json({ error: 'Portfolio not found' }, 404);

      const sortRow = await db.prepare(
        'SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM portfolio_media WHERE portfolio_id = ?'
      ).bind(targetId).first() as { max_order: number } | null;
      let nextOrder = Number(sortRow?.max_order ?? -1) + 1;

      const gSortRow = await db.prepare(
        'SELECT COALESCE(MAX(sort_order), -1) AS m FROM portfolio_gallery WHERE portfolio_id = ?'
      ).bind(targetId).first() as { m: number } | null;
      let gOrder = Number(gSortRow?.m ?? -1) + 1;

      // De-dupe by filename so re-assigning a batch OVERWRITES the existing
      // same-file media instead of duplicating it (this is what produced 133
      // rows on a 89-item re-assign). Match against existing media_url/file_name.
      const existingMedia = await db.prepare(
        'SELECT id, media_url, file_name FROM portfolio_media WHERE portfolio_id = ?'
      ).bind(targetId).all();
      const pmByName = new Map<string, number>();
      (existingMedia.results || []).forEach((r: any) => {
        pmByName.set(baseName(r.media_url || r.file_name || ''), r.id);
      });

      // Insert individually so we can capture each new media id and auto-add it
      // to the gallery (so assigned media shows publicly). Only the newly
      // assigned items — never touches your existing curation.
      for (const it of items) {
        const key = baseName(it.media_url || it.original_filename || '');
        const existingId = pmByName.get(key);
        if (existingId) {
          await db.prepare(`
            UPDATE portfolio_media
            SET media_url = ?, media_type = ?, file_name = ?, file_size = ?, stream_uid = ?
            WHERE id = ?
          `).bind(
            it.media_url, it.media_type, it.original_filename || null,
            it.file_size || null, it.stream_uid || null, existingId,
          ).run();
          overwritten++;
          assigned.push(it.id);
          continue;
        }
        const ins = await db.prepare(`
          INSERT INTO portfolio_media (portfolio_id, media_url, media_type, file_name, file_size, caption, sort_order, stream_uid, captured_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          targetId, it.media_url, it.media_type, it.original_filename || null,
          it.file_size || null, caption, nextOrder, it.stream_uid || null,
        ).run();
        nextOrder++;
        const newMediaId = ins.meta?.last_row_id;
        if (newMediaId) {
          await db.prepare(
            'INSERT INTO portfolio_gallery (portfolio_id, media_id, sort_order) VALUES (?, ?, ?)'
          ).bind(targetId, newMediaId, gOrder).run();
          gOrder++;
          pmByName.set(key, newMediaId);
        }
        added++;
        assigned.push(it.id);
      }
    }

    // Remove successfully assigned pool rows, again chunked for safety.
    if (assigned.length) {
      const deleteStmts = chunk(assigned, D1_PARAM_CHUNK).map(ids => {
        const ph = ids.map(() => '?').join(',');
        return db.prepare(`DELETE FROM media_pool WHERE id IN (${ph})`).bind(...ids);
      });
      if (deleteStmts.length) await db.batch(deleteStmts);
    }

    return json({
      success: true,
      assigned_count: assigned.length,
      added,
      overwritten,
      skipped: errors.length,
      assigned_ids: assigned,
      errors,
    });
  } catch (error) {
    console.error('[admin/media-pool/assign] error:', error);
    return json({ error: 'Failed to assign media' }, 500);
  }
};
