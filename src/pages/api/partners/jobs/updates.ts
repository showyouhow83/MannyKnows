// POST /api/partners/jobs/updates  { crew_token, image_url?, note? }
//
// Crew progress photos/notes for a PARTNER job. Token-auth via the job's
// crew_token (mirrors /api/projects/[id]/updates for our own projects).

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'DB not configured' }, 503);

    const body = await request.json().catch(() => ({})) as { crew_token?: string; image_url?: string; note?: string };
    const token = (body.crew_token || '').trim();
    if (!token) return json({ success: false, error: 'Access token required' }, 403);

    const job = await db.prepare('SELECT id FROM partner_jobs WHERE crew_token = ?').bind(token).first() as { id: number } | null;
    if (!job) return json({ success: false, error: 'Invalid project or access token' }, 403);

    if (!body.image_url && !body.note) return json({ success: false, error: 'Image or note is required' }, 400);

    await db.prepare(
      `INSERT INTO partner_job_updates (partner_job_id, image_url, note, posted_by, posted_by_name)
       VALUES (?, ?, ?, 'crew_lead', 'Crew')`
    ).bind(job.id, body.image_url || null, body.note || null).run();

    return json({ success: true });
  } catch (e) {
    console.error('[partner-job updates] error:', e);
    return json({ success: false, error: 'Failed to save update' }, 500);
  }
};
