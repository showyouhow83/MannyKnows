// Admin Login API - Multi-user support with D1 database
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth, verifyPassword, timingSafeEqual, type AdminUser } from '../../../lib/adminAuth';
import { kvRateLimit } from '../../../lib/rateLimit';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;

    // Get session secret for signing
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Get client IP for rate limiting
    const clientIP = request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     'unknown';

    // Check rate limit — KV-backed (global across isolates); the in-memory Map
    // is an ineffective per-isolate counter on Workers.
    const rlOk = await kvRateLimit(env?.MK_KV_SESSIONS as any, `login:${clientIP}`, 5, 15 * 60);
    if (!rlOk || !AdminAuth.checkRateLimit(clientIP)) {
      // Say WHEN to come back — a bare "try later" sends people into blind
      // retry loops that burn the next window the moment it opens.
      let mins = 15;
      try {
        const rec = await (env?.MK_KV_SESSIONS as any)?.get(`rl:login:${clientIP}`, 'json');
        if (rec?.r) mins = Math.max(1, Math.ceil((rec.r - Date.now()) / 60000));
      } catch {}
      return new Response(JSON.stringify({
        success: false,
        error: `Too many login attempts. Try again in about ${mins} minute${mins === 1 ? '' : 's'}. You get 5 tries per window.`
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as { username?: string; password?: string };
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Username and password required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let authenticated = false;
    let userDisplayName = username;
    let userRole = 'admin';

    // Try database authentication first (multi-user)
    if (db) {
      try {
        const user = await db.prepare(
          'SELECT * FROM admin_users WHERE username = ? AND status = ?'
        ).bind(username, 'active').first<AdminUser>();

        if (user) {
          // Verify password against stored hash
          const isValid = await verifyPassword(password, user.password_hash, user.salt);

          if (isValid) {
            authenticated = true;
            userDisplayName = user.display_name || username;
            userRole = user.role;

            // Update last login
            await db.prepare(
              'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?'
            ).bind(user.id).run();

            console.log(`[Admin] DB auth successful: ${username} (${userRole}) from ${clientIP}`);
          }
        }
      } catch (dbError) {
        // Table might not exist yet, fall through to legacy auth
        console.log('[Admin] DB auth not available, trying legacy auth');
      }
    }

    // Fallback to legacy environment variable authentication
    if (!authenticated) {
      const legacyUsername = env?.ADMIN_USERNAME;
      const legacyPassword = env?.ADMIN_PASSWORD;

      if (legacyUsername && legacyPassword) {
        // Constant-time, no short-circuit: always evaluate both comparisons so
        // response timing doesn't reveal a valid username or partial password.
        const [userOk, passOk] = await Promise.all([
          timingSafeEqual(username, legacyUsername),
          timingSafeEqual(password, legacyPassword),
        ]);
        if (userOk && passOk) {
          authenticated = true;
          console.log(`[Admin] Legacy auth successful: ${username} from ${clientIP}`);
        }
      }
    }

    // Authentication failed
    if (!authenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid username or password'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create session (include role for access control)
    const { sessionCookie, expiresAt } = await AdminAuth.createSession(username, sessionSecret, userRole);

    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful',
      displayName: userDisplayName,
      role: userRole,
      expiresAt: expiresAt.toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': sessionCookie
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Login failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
