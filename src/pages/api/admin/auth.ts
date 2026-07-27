// Secure server-side admin authentication API
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { username, password } = await request.json() as { username?: string; password?: string };

    // Get client IP for rate limiting
    const clientIP = request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-forwarded-for') ||
                     'unknown';

    // Check rate limiting
    if (!AdminAuth.checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Too many login attempts. Please try again later.'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get credentials from environment variables - NO DEFAULTS for security
    // Support both development (process.env) and production (Cloudflare Workers env)
    const adminUsername = locals.runtime?.env?.ADMIN_USERNAME || process.env.ADMIN_USERNAME;
    const adminPassword = locals.runtime?.env?.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    // Security check: Ensure credentials are set
    if (!adminUsername || !adminPassword) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Admin authentication not configured'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate credentials
    if (username === adminUsername && password === adminPassword) {
      // Get session secret (use ADMIN_PASSWORD as fallback for signing)
      const sessionSecret = locals.runtime?.env?.SESSION_SECRET ||
                           process.env.SESSION_SECRET ||
                           adminPassword;

      // Create secure HMAC-signed session
      const { sessionCookie, expiresAt } = await AdminAuth.createSession(username, sessionSecret);

      // Authentication successful
      return new Response(JSON.stringify({
        success: true,
        message: 'Authentication successful',
        expiresAt: expiresAt.toISOString()
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': sessionCookie
        }
      });
    } else {
      // Authentication failed
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Authentication error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};