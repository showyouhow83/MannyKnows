// POST /api/portal/video-poster
//
// Caches a captured video poster frame so we stop re-pulling .mov metadata
// on every pageview. The first time a video tile mounts in any portal
// (crew, client, admin), JS extracts a JPEG from the video canvas and POSTs
// it here. We store it in R2 at posters/{kind}-{id}.jpg and stamp the URL
// onto the row (project_updates.poster_url or portfolio_media.poster_url).
//
// Auth: any of
//   - admin session
//   - X-Crew-Token header matching the crew_token of the row's project
//   - X-Client-Token header matching the client_token of the row's project
// This mirrors the fact that anyone who can SEE the video already has
// implicit authority to compute and cache its first frame.
//
// Body params:
//   kind       'project_update' | 'portfolio_media'
//   id         row id (int)
//   data_url   "data:image/jpeg;base64,..."
//
// Returns: { success, poster_url } | { success: true, already_set: true }

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';
import { publicUrlForR2Path } from '../../../lib/publicUrl';

const MAX_POSTER_SIZE = 500 * 1024; // 500KB: first-frame JPEGs should be small

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; mime: string } | null {
  const m = /^data:(image\/[a-zA-Z]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const mime = m[1];
  const b64 = m[2];
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, mime };
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const bucket = env?.MK_MEDIA_BUCKET;
    if (!db || !bucket) return json({ success: false, error: 'Storage not configured' }, 503);

    const body = await request.json() as {
      kind?: 'project_update' | 'portfolio_media';
      id?: number;
      data_url?: string;
    };

    const kind = body.kind;
    const id = Number(body.id);
    const dataUrl = (body.data_url || '').trim();
    if (kind !== 'project_update' && kind !== 'portfolio_media') {
      return json({ success: false, error: 'kind must be project_update | portfolio_media' }, 400);
    }
    if (!Number.isFinite(id) || id <= 0) return json({ success: false, error: 'id required' }, 400);
    if (!dataUrl.startsWith('data:image/')) return json({ success: false, error: 'data_url must be an image data URL' }, 400);

    const decoded = decodeDataUrl(dataUrl);
    if (!decoded) return json({ success: false, error: 'Invalid data URL' }, 400);
    if (decoded.bytes.byteLength === 0) return json({ success: false, error: 'Empty image' }, 400);
    if (decoded.bytes.byteLength > MAX_POSTER_SIZE) {
      return json({ success: false, error: 'Poster too large (max 500KB)' }, 413);
    }

    // Look up the row + verify authorization.
    let posterExists = false;
    let projectId: number | null = null;
    if (kind === 'project_update') {
      const row = await db.prepare(
        'SELECT id, project_id, poster_url FROM project_updates WHERE id = ?'
      ).bind(id).first() as { id: number; project_id: number; poster_url: string | null } | null;
      if (!row) return json({ success: false, error: 'project_update not found' }, 404);
      if (row.poster_url) {
        // Already captured — idempotent no-op. Cheaper than re-uploading the
        // same frame from a second viewer.
        return json({ success: true, already_set: true, poster_url: row.poster_url });
      }
      projectId = row.project_id;
    } else {
      const row = await db.prepare(
        'SELECT id, portfolio_id, poster_url FROM portfolio_media WHERE id = ?'
      ).bind(id).first() as { id: number; portfolio_id: number; poster_url: string | null } | null;
      if (!row) return json({ success: false, error: 'portfolio_media not found' }, 404);
      if (row.poster_url) {
        return json({ success: true, already_set: true, poster_url: row.poster_url });
      }
      posterExists = false;
      // portfolio_media has no per-row tokens; admin-only.
    }

    // Authorize.
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    let authorized = session.isAuthenticated;

    if (!authorized && kind === 'project_update' && projectId) {
      const crewToken = (request.headers.get('X-Crew-Token') || '').trim();
      const clientToken = (request.headers.get('X-Client-Token') || '').trim();
      if (crewToken || clientToken) {
        const tokens = await db.prepare(
          'SELECT crew_token, client_token FROM projects WHERE id = ?'
        ).bind(projectId).first() as { crew_token: string | null; client_token: string | null } | null;
        if (tokens) {
          if (crewToken && tokens.crew_token && crewToken === tokens.crew_token) authorized = true;
          if (clientToken && tokens.client_token && clientToken === tokens.client_token) authorized = true;
        }
      }
    }
    if (!authorized) return json({ success: false, error: 'Unauthorized' }, 401);
    if (posterExists) return json({ success: false, error: 'unexpected' }, 500);

    const ext = decoded.mime === 'image/png' ? 'png' : 'jpg';
    const r2Path = `posters/${kind}-${id}.${ext}`;
    await bucket.put(r2Path, decoded.bytes, {
      httpMetadata: { contentType: decoded.mime, cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { kind, sourceId: String(id), capturedAt: new Date().toISOString() },
    });

    const posterUrl = publicUrlForR2Path(r2Path, request);

    if (kind === 'project_update') {
      await db.prepare('UPDATE project_updates SET poster_url = ? WHERE id = ?').bind(posterUrl, id).run();
    } else {
      await db.prepare('UPDATE portfolio_media SET poster_url = ? WHERE id = ?').bind(posterUrl, id).run();
    }

    return json({ success: true, poster_url: posterUrl });
  } catch (e) {
    console.error('[portal/video-poster] error:', e);
    return json({ success: false, error: 'Failed to save poster' }, 500);
  }
};
