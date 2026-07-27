// Light, password-less auth for the customer project portal.
//
// The portal URL already carries a hard-to-guess client_token, but the link
// can be forwarded. To keep a project private we add an email confirmation:
// the visitor proves they own the email on the project, we email them a
// short-lived magic link, and clicking it sets a signed 30-day cookie scoped
// to that project. No passwords, no accounts.
//
// Two signed artifacts, both HMAC-SHA256 over SESSION_SECRET:
//   - magic token  (in the emailed link)  — { pid, exp }, ~30 min TTL
//   - session value (in the cookie)        — { pid, exp }, 30 day TTL
// Binding to the numeric project id (not the client_token) means rotating the
// token later doesn't silently keep an old cookie valid for a different row.

const MAGIC_TTL_SECONDS = 30 * 60;            // 30 minutes
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function portalCookieName(projectId: number): string {
  return `mk_portal_${projectId}`;
}

async function hmac(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// nowSeconds is injectable so callers can pass a deterministic clock in tests.
function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

// ── Magic token (emailed link) ──────────────────────────────────────────
export async function makeMagicToken(projectId: number, secret: string): Promise<string> {
  const exp = nowSeconds() + MAGIC_TTL_SECONDS;
  const payload = `m:${projectId}:${exp}`;
  const sig = await hmac(payload, secret);
  return `${payload}:${sig}`;
}

export async function verifyMagicToken(token: string, secret: string): Promise<number | null> {
  const parts = (token || '').split(':');
  if (parts.length !== 4 || parts[0] !== 'm') return null;
  const [, pidStr, expStr, sig] = parts;
  const payload = `m:${pidStr}:${expStr}`;
  const expected = await hmac(payload, secret);
  if (!constantTimeEqual(expected, sig)) return null;
  if (Number(expStr) < nowSeconds()) return null;
  const pid = Number(pidStr);
  return Number.isFinite(pid) && pid > 0 ? pid : null;
}

// ── Session cookie ──────────────────────────────────────────────────────
export async function makeSessionValue(projectId: number, secret: string): Promise<string> {
  const exp = nowSeconds() + SESSION_TTL_SECONDS;
  const payload = `s:${projectId}:${exp}`;
  const sig = await hmac(payload, secret);
  return `${payload}:${sig}`;
}

export async function verifySessionValue(value: string, projectId: number, secret: string): Promise<boolean> {
  const parts = (value || '').split(':');
  if (parts.length !== 4 || parts[0] !== 's') return false;
  const [, pidStr, expStr, sig] = parts;
  if (Number(pidStr) !== projectId) return false;
  const payload = `s:${pidStr}:${expStr}`;
  const expected = await hmac(payload, secret);
  if (!constantTimeEqual(expected, sig)) return false;
  if (Number(expStr) < nowSeconds()) return false;
  return true;
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
