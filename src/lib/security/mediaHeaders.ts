// Serve-time content-type policy for anything read back out of the media
// bucket (Aug 2026 hardening). Uploads store the client's declared MIME, and
// several upload paths accept it with `startsWith`, so the stored value can't
// be trusted at serve time: only known image/video/audio/PDF types render
// inline; SVG renders sandboxed (partner logos are SVG); everything else is
// forced to octet-stream + attachment so a stored HTML/JS blob can never
// execute on one of our origins. `nosniff` stops the browser second-guessing.
const INLINE_MEDIA_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif', 'image/bmp', 'image/x-icon',
  'video/mp4', 'video/quicktime', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm',
  'application/pdf',
]);
export function safeMediaHeaders(storedType?: string | null, storedDisposition?: string | null): Record<string, string> {
  const type = String(storedType || '').split(';')[0].trim().toLowerCase();
  const h: Record<string, string> = { 'X-Content-Type-Options': 'nosniff' };
  if (INLINE_MEDIA_TYPES.has(type)) {
    h['Content-Type'] = type;
    if (storedDisposition && /^(inline|attachment)(;|$)/i.test(storedDisposition)) h['Content-Disposition'] = storedDisposition;
  } else if (type === 'image/svg+xml') {
    h['Content-Type'] = type;
    h['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  } else {
    h['Content-Type'] = 'application/octet-stream';
    h['Content-Disposition'] = 'attachment';
  }
  return h;
}
