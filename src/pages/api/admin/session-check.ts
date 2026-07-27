import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Use the real signing secret (not the hardcoded default) so this path
    // validates genuine cookies and can't accept a default-signed forgery.
    const env = (locals as any)?.runtime?.env;
    const session = await AdminAuth.validateSession(request, env?.SESSION_SECRET || env?.ADMIN_PASSWORD);

    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        isAuthenticated: false
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      isAuthenticated: true,
      username: session.username,
      expiresAt: session.expiresAt?.toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    return new Response(JSON.stringify({
      isAuthenticated: false,
      error: 'Session check failed'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
