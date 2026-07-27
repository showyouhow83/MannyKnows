// POST /api/admin/messages/upload
// Uploads an attachment (image, video, PDF) for admin→customer messages.
// Returns { success, url, name, type, size }.

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import { publicUrlForR2Path } from '../../../../lib/publicUrl';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
};

const MAX_SIZE_VIDEO = 200 * 1024 * 1024; // 200 MB
const MAX_SIZE_OTHER = 25 * 1024 * 1024;  // 25 MB

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const bucket = env?.MK_MEDIA_BUCKET;
    if (!bucket) return json({ error: 'Storage not configured' }, 503);

    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return json({ error: 'Unauthorized' }, 401);

    const form = await request.formData().catch(() => null);
    if (!form) return json({ error: 'Invalid form data' }, 400);

    const file = form.get('file') as File | null;
    if (!file || !(file instanceof File)) return json({ error: 'No file provided' }, 400);

    const mimeType = file.type || 'application/octet-stream';
    const ext = ALLOWED_TYPES[mimeType];
    if (!ext) return json({ error: 'File type not allowed. Accepted: images, videos, PDFs.' }, 415);

    const isVideo = mimeType.startsWith('video/');
    const maxSize = isVideo ? MAX_SIZE_VIDEO : MAX_SIZE_OTHER;
    if (file.size > maxSize) {
      return json({ error: `File too large (max ${isVideo ? '200' : '25'} MB)` }, 413);
    }

    const ts = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const path = `message-attachments/${ts}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(path, arrayBuffer, {
      httpMetadata: { contentType: mimeType },
      customMetadata: { uploadedAt: new Date().toISOString(), originalName: file.name.slice(0, 200) },
    });

    const url = publicUrlForR2Path(path, request);
    return json({ success: true, url, name: file.name, type: mimeType, size: file.size });
  } catch (e) {
    console.error('[messages/upload] error:', e);
    return json({ error: 'Upload failed' }, 500);
  }
};
