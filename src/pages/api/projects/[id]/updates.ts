// Project Updates API
// POST: Add progress update (image or note) - crew access via token
// GET: List updates - crew or admin access
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import { isVideoUrl, ingestToStream, streamThumb } from '../../../../lib/stream';

interface UpdateRequest {
  crew_token?: string;
  client_token?: string;
  image_url?: string;
  note?: string;
  posted_by?: string;
  posted_by_name?: string;
}

// POST: Add a progress update (crew via token OR admin via session)
export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const projectId = params.id;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!projectId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: UpdateRequest = await request.json();

    let postedBy = 'crew_lead';
    let postedByName = 'Crew';
    let project: any = null;

    // Auth: either crew_token or admin session
    if (body.crew_token) {
      // Crew access via token
      project = await db.prepare(`
        SELECT p.*, cl.name as crew_lead_name
        FROM projects p
        LEFT JOIN crew_leads cl ON p.crew_lead_id = cl.id
        WHERE p.id = ? AND p.crew_token = ?
      `).bind(projectId, body.crew_token).first();

      if (!project) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid project or access token'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      postedBy = 'crew_lead';
      postedByName = project.crew_lead_name || 'Crew';
    } else if (body.client_token) {
      // Customer access via the client portal token.
      project = await db.prepare(
        'SELECT * FROM projects WHERE id = ? AND client_token = ?'
      ).bind(projectId, body.client_token).first();
      if (!project) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid project or access token'
        }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
      postedBy = 'client';
      postedByName = project.customer_name || 'Customer';
    } else {
      // Admin access via session
      const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
      const session = await AdminAuth.validateSession(request, sessionSecret);

      if (!session.isAuthenticated) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required (crew_token or admin session)'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first();
      if (!project) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Project not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      postedBy = body.posted_by || 'admin';
      postedByName = body.posted_by_name || 'Admin';
    }

    // Must have at least image or note
    if (!body.image_url && !body.note) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Image or note is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Videos → Cloudflare Stream: ingest the just-uploaded R2 URL and store the
    // UID (+ poster) so it renders from Stream (fast, cross-browser) instead of
    // the raw file. Transcode runs async; the poster appears when it's ready.
    let streamUid: string | null = null;
    let posterUrl: string | null = null;
    if (body.image_url && isVideoUrl(body.image_url)) {
      streamUid = await ingestToStream(body.image_url, env);
      if (streamUid) posterUrl = streamThumb(streamUid);
    }

    // Crew-portal IMAGE uploads post straight onto THEIR project's Reference
    // Media (Manny, Aug 2026 — the pool detour is only for the timeclock
    // page's untargeted uploads). Inserted STARRED (crew/admin-only), so
    // nothing becomes client-visible until the admin unstars it.
    const starForCrew = postedBy === 'crew_lead' && body.image_url ? 1 : 0;

    // De-dupe by ORIGINAL filename within the project. R2 prefixes a fresh
    // timestamp on every upload, so the URL differs each time — matching on the
    // bare filename (timestamp stripped) means re-uploading the same file
    // OVERWRITES its reference row instead of appending a duplicate. Same rule
    // applies whether it came from a direct upload or a media-pool assignment.
    const baseName = (u: string) => {
      const seg = String(u || '').split('?')[0].split('/').pop() || '';
      return seg.replace(/^\d+_/, '').toLowerCase();
    };
    let result;
    if (body.image_url) {
      const newName = baseName(body.image_url);
      const existingRows = await db.prepare(
        'SELECT id, image_url FROM project_updates WHERE project_id = ? AND image_url IS NOT NULL'
      ).bind(projectId).all();
      const dupe = (existingRows.results || []).find((r: any) => baseName(r.image_url) === newName);

      if (dupe) {
        // Same file already on this project — overwrite in place (new URL + fresh
        // Stream UID/poster), keeping its star/visibility. No second copy.
        result = await db.prepare(`
          UPDATE project_updates
          SET image_url = ?, stream_uid = ?, poster_url = ?, created_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(body.image_url, streamUid, posterUrl, (dupe as any).id).run();
        console.log(`[ProjectUpdate] Overwrote duplicate "${newName}" in project ${projectId}`);
      } else {
        result = await db.prepare(`
          INSERT INTO project_updates (
            project_id, image_url, note, posted_by, posted_by_name, stream_uid, poster_url, is_starred, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(projectId, body.image_url, body.note || null, postedBy, postedByName, streamUid, posterUrl, starForCrew).run();
        console.log(`[ProjectUpdate] Added update to project ${projectId}${starForCrew ? ' (starred, crew upload)' : ''}`);
      }
    } else {
      // Note-only update (no image)
      result = await db.prepare(`
        INSERT INTO project_updates (
          project_id, image_url, note, posted_by, posted_by_name, created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(projectId, null, body.note || null, postedBy, postedByName).run();
      console.log(`[ProjectUpdate] Added note to project ${projectId}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Update added successfully',
      update_id: result.meta.last_row_id
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error adding project update:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to add update'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GET: List project updates
export const GET: APIRoute = async ({ request, locals, params, url }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const projectId = params.id;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!projectId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for admin or crew_token access
    const crewToken = url.searchParams.get('crew_token');
    let hasAccess = false;

    // Check admin auth
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (session.isAuthenticated) {
      hasAccess = true;
    }

    // Check crew token
    if (!hasAccess && crewToken) {
      const project = await db.prepare(
        'SELECT id FROM projects WHERE id = ? AND crew_token = ?'
      ).bind(projectId, crewToken).first();
      if (project) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch updates
    const result = await db.prepare(`
      SELECT * FROM project_updates
      WHERE project_id = ?
      ORDER BY created_at DESC
    `).bind(projectId).all();

    return new Response(JSON.stringify({
      success: true,
      updates: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching project updates:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch updates'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Remove a project update (admin only)
export const DELETE: APIRoute = async ({ request, locals, params, url }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const projectId = params.id;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Admin-only authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Admin authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updateId = url.searchParams.get('update_id');

    if (!projectId || !updateId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project ID and update ID are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the update exists and belongs to this project
    const update = await db.prepare(
      'SELECT id FROM project_updates WHERE id = ? AND project_id = ?'
    ).bind(updateId, projectId).first();

    if (!update) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Update not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the update
    await db.prepare(
      'DELETE FROM project_updates WHERE id = ?'
    ).bind(updateId).run();

    console.log(`[Admin] Deleted update ${updateId} from project ${projectId}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Update deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting project update:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete update'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH: toggle the "starred" flag on a project_update image. Starred =
// crew-only (shown on the crew page, hidden from the client portal).
export const PATCH: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const projectId = params.id;
    if (!db) return new Response(JSON.stringify({ success: false, error: 'Database not available' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({ success: false, error: 'Admin authentication required' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json().catch(() => ({})) as { update_id?: number; is_starred?: boolean | number };
    const updateId = body.update_id;
    if (!projectId || !updateId) {
      return new Response(JSON.stringify({ success: false, error: 'Project ID and update_id are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const update = await db.prepare('SELECT id FROM project_updates WHERE id = ? AND project_id = ?').bind(updateId, projectId).first();
    if (!update) {
      return new Response(JSON.stringify({ success: false, error: 'Update not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const starred = body.is_starred ? 1 : 0;
    await db.prepare('UPDATE project_updates SET is_starred = ? WHERE id = ?').bind(starred, updateId).run();

    return new Response(JSON.stringify({ success: true, is_starred: starred }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error toggling star on project update:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
