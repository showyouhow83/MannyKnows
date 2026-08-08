import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { RateLimiter } from '../../lib/security/rateLimiter.js';
import { DomainValidator } from '../../lib/security/domainValidator.js';

// Quote-form photo uploads → R2 (MK_MEDIA_BUCKET).
//
// Why a separate route from /api/contact: that endpoint runs every field
// through InputValidator, whose command-injection rule rejects base64 outright,
// and JSON-encoding image bytes inflates them ~33% inside a body that also
// carries the lead. Photos go here as multipart, the lead goes there as JSON,
// and the message carries the resulting links.
//
// This is unauthenticated by necessity (it's a public quote form), so the caps
// below are the only thing between the bucket and abuse. Same origin check and
// rate limiter as the contact endpoint.

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB each — R2 has room; the email did not
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/heic': 'heic', 'image/heif': 'heif',
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const bucket = (env as any)?.MK_MEDIA_BUCKET;
  if (!bucket) {
    // Ship-dark behaviour: the form still sends the lead, just without photos.
    return new Response(JSON.stringify({ error: 'Uploads unavailable', keys: [] }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }

  const domainResult = new DomainValidator().validateRequest(request);
  if (!domainResult.valid) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  const kv = (env as any)?.MK_KV_CHATBOT;
  if (kv) {
    const clientIP = clientAddress || request.headers.get('cf-connecting-ip') || 'unknown';
    const rate = await new RateLimiter(kv).checkRateLimit(clientIP, 'anonymous');
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: 'Too many uploads. Please wait a moment.' }), {
        status: 429, headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const form = await request.formData();
    const files = form.getAll('photos').filter((f): f is File => f instanceof File).slice(0, MAX_FILES);
    if (!files.length) {
      return new Response(JSON.stringify({ error: 'No files', keys: [] }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // One folder per submission keeps a lead's photos together in the bucket.
    const batch = crypto.randomUUID();
    const stamp = new Date().toISOString().slice(0, 10);
    const urls: string[] = [];

    for (const [i, file] of files.entries()) {
      const type = (file.type || '').toLowerCase();
      if (!ALLOWED_TYPES.includes(type)) continue;
      if (file.size === 0 || file.size > MAX_FILE_BYTES) continue;

      // Never trust the client filename for the key — derive it from the
      // validated content type instead, so nothing can traverse or collide.
      const key = `quote-photos/${stamp}/${batch}/${i + 1}.${EXT[type]}`;
      await bucket.put(key, file.stream(), {
        httpMetadata: { contentType: type },
        customMetadata: { originalName: String(file.name || '').slice(0, 120) },
      });
      urls.push(key);
    }

    return new Response(JSON.stringify({ keys: urls, batch }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('quote-upload failed:', err);
    // A failed upload must not cost the lead — the form carries on without it.
    return new Response(JSON.stringify({ error: 'Upload failed', keys: [] }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
