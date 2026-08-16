// Customer uploads signed contract — updates project contract_status to 'signed'
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;

    if (!db) {
      return new Response(JSON.stringify({ success: false, error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as { client_token: string; signed_url: string };

    if (!body.client_token || !body.signed_url) {
      return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // The URL is shown to the admin as "the signed contract" — it must point at
    // our own media host (or the dev proxy), never at an arbitrary site.
    const signedUrl = String(body.signed_url).trim();
    const mediaHost = (cfEnv as any)?.MEDIA_PUBLIC_HOST || 'images.mannyknows.com';
    let urlOk = false;
    try {
      const u = new URL(signedUrl, request.url);
      urlOk = signedUrl.length <= 500 && (
        (u.protocol === 'https:' && u.hostname === mediaHost) ||
        (u.origin === new URL(request.url).origin && u.pathname.startsWith('/r2-local/'))
      );
    } catch {}
    if (!urlOk) {
      return new Response(JSON.stringify({ success: false, error: 'signed_url must be a file on our media host' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify project exists
    const project = await db.prepare(
      'SELECT id FROM projects WHERE client_token = ?'
    ).bind(body.client_token).first();

    if (!project) {
      return new Response(JSON.stringify({ success: false, error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update project with signed contract
    await db.prepare(`
      UPDATE projects
      SET project_signed_contract_url = ?, contract_status = 'pending_review', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(signedUrl, project.id).run();

    console.log(`[Contract] Signed contract uploaded for project ${project.id}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Contract] Upload signed error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to save' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
