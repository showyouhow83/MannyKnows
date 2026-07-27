// POST /api/portal/colors/upload-image
// Accepts multipart form: { token, item_id, file }
// Validates client_token, uploads paint card photo to R2, returns { success, url }.
import type { APIRoute } from 'astro';
import { publicUrlForR2Path } from '../../../../lib/publicUrl';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif']);

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    const bucket = env?.MK_MEDIA_BUCKET;
    if (!db || !bucket) return json({ error: 'Unavailable' }, 503);

    const form = await request.formData().catch(() => null);
    if (!form) return json({ error: 'Invalid form data' }, 400);

    const token = String(form.get('token') || '').trim();
    const itemId = String(form.get('item_id') || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
    const file = form.get('file') as File | null;

    if (!token) return json({ error: 'Not authorized' }, 403);
    if (!file || !(file instanceof File)) return json({ error: 'No file provided' }, 400);
    if (file.size > 15 * 1024 * 1024) return json({ error: 'File too large (max 15 MB)' }, 413);

    let contentType = file.type || 'image/jpeg';
    if (!ALLOWED_TYPES.has(contentType)) return json({ error: 'Only image files are allowed' }, 415);

    // Validate client_token → project id
    const project = await db.prepare(
      'SELECT id FROM projects WHERE client_token = ?'
    ).bind(token).first() as { id: number } | null;
    if (!project) return json({ error: 'Not authorized' }, 403);

    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const ts = Date.now();
    const safeItemId = itemId || 'color';
    const path = `originals/color-cards-${project.id}-${safeItemId}-${ts}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(path, arrayBuffer, {
      httpMetadata: { contentType },
      customMetadata: { uploadedAt: new Date().toISOString(), projectId: String(project.id), itemId: safeItemId },
    });

    const url = publicUrlForR2Path(path, request);
    return json({ success: true, url });
  } catch (e) {
    console.error('[portal/colors/upload-image] error:', e);
    return json({ error: 'Upload failed' }, 500);
  }
};
