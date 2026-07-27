// Local R2 proxy — serves files from the MK_MEDIA_BUCKET binding directly.
//
// Why: the prod public URL `https://images.mannyknows.com/...` is backed by
// the real R2 bucket. In dev, uploads go to local R2 (Miniflare's emulator)
// and that prod URL 404s. Upload endpoints route their `file_url` through
// here when the upload originated from localhost so dev testing actually
// shows the file. In prod the route still works (just slower than the
// custom-domain CDN), but no upload code points URLs at it in production.
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals, request }) => {
  const env = cfEnv;
  const bucket = env?.MK_MEDIA_BUCKET;
  if (!bucket) {
    return new Response('R2 binding not configured', { status: 503 });
  }

  const rawPath = (params.path as string) || '';
  // Reject traversal attempts up front
  if (!rawPath || rawPath.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  // Simple ETag-based 304 — handle the conditional check ourselves so we
  // don't depend on R2's onlyIf parameter shape (which has been finicky
  // across miniflare versions).
  const obj = await bucket.get(rawPath);
  if (!obj) return new Response('Not found', { status: 404 });

  const ifNoneMatch = request.headers.get('If-None-Match');
  if (ifNoneMatch && ifNoneMatch === obj.httpEtag) {
    return new Response(null, { status: 304, headers: { etag: obj.httpEtag } });
  }

  // miniflare's dev bridge can't serialise R2 streams or ArrayBuffer bodies
  // through its worker→Vite boundary. Wrap in a Uint8Array which Devalue
  // handles natively. Buffering is fine — small files.
  const data = new Uint8Array(await obj.arrayBuffer());
  const contentType = obj.httpMetadata?.contentType || 'application/octet-stream';
  const headers: Record<string, string> = {
    'content-type': contentType,
    'content-length': String(data.byteLength),
    'etag': obj.httpEtag,
    'cache-control': 'public, max-age=60',
  };
  // Preserve the inline disposition the upload set so PDFs render in
  // iframes (instead of triggering a download dialog) when this proxy is
  // used as a same-origin iframe source from /quote/accept.
  const disposition = obj.httpMetadata?.contentDisposition;
  if (disposition) headers['content-disposition'] = disposition;
  return new Response(data, { headers });
};
