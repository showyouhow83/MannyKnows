// Admin Logout API
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

// GET handler - redirect to /admin after clearing cookie
export const GET: APIRoute = async () => {
  const logoutCookie = AdminAuth.createLogoutCookie();

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/admin',
      'Set-Cookie': logoutCookie
    }
  });
};

// POST handler - for AJAX logout calls (returns JSON)
export const POST: APIRoute = async () => {
  const logoutCookie = AdminAuth.createLogoutCookie();

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': logoutCookie
    }
  });
};
