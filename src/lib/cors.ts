// Shared CORS origin resolver for the upload/API endpoints.
//
// PROD origins are ALWAYS allowed (so production behaviour is unchanged).
// DEV origins (localhost / LAN) are honored ONLY when the Worker itself is
// running on a dev host — so the production Worker never grants CORS to
// localhost, without changing anything for real mannyknows.com requests.

const PROD_ORIGINS = [
  'https://mannyknows.com',
  'https://www.mannyknows.com',
];

const DEV_ORIGINS = [
  'http://localhost:4321',
  'http://localhost:4322',
  'http://localhost:4323',
  'http://localhost:3000',
  'http://10.0.0.80:4321',
];

function isDevHost(request: Request): boolean {
  let host = '';
  try { host = new URL(request.url).host; } catch {}
  return (
    /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) ||
    host.includes(':4321') || host.includes(':4322') || host.includes(':4323') || host.includes(':3000')
  );
}

// Returns the request's Origin (or Referer origin) if it is allowed, else null.
export function resolveAllowedOrigin(request: Request): string | null {
  const allowed = isDevHost(request) ? [...PROD_ORIGINS, ...DEV_ORIGINS] : PROD_ORIGINS;
  const origin = request.headers.get('Origin');
  if (origin && allowed.includes(origin)) return origin;
  const referer = request.headers.get('Referer');
  if (referer) {
    try {
      const o = new URL(referer).origin;
      if (allowed.includes(o)) return o;
    } catch {}
  }
  return null;
}
