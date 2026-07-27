// Build the public URL for a freshly-uploaded R2 object.
//
// - Localhost requests get a relative-to-localhost URL via the /r2-local
//   proxy route, so dev uploads actually display in the dev environment.
// - Everything else gets the canonical images.mannyknows.com URL backed by
//   R2's custom domain (CDN-cached, no Worker invocation per fetch).
//
// The decision is request-driven, not env-driven, so a deployed worker still
// emits prod URLs even if you ever run wrangler dev against it.
export function publicUrlForR2Path(r2Path: string, request: Request): string {
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  const candidate = origin || referer;

  if (candidate) {
    try {
      const url = new URL(candidate);
      const host = url.hostname;
      const isLocal =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host);
      if (isLocal) {
        // Astro's trailingSlash:'always' config does not auto-redirect URLs
        // that look like file paths (with extensions), so we add the slash
        // ourselves. Browsers don't care; the file still renders.
        return `${url.origin}/r2-local/${r2Path}/`;
      }
    } catch {
      // fall through to prod URL
    }
  }
  return `https://images.mannyknows.com/${r2Path}`;
}
