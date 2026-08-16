// Admin Users API - Create and manage admin users
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { adminOnlyGuard, AdminAuth, generateSalt, hashPassword, type AdminUser } from '../../../lib/adminAuth';

// GET - List all admin users (requires admin session)
export const GET: APIRoute = async ({ request, locals }) => {
  const env = cfEnv;
  const db = env?.MK_APP_DB;
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

  // Verify admin session
  const session = await AdminAuth.validateSession(request, sessionSecret);
  if (!session.isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const users = await db.prepare(
      'SELECT id, username, display_name, email, role, status, last_login, login_count, created_at FROM admin_users ORDER BY created_at DESC'
    ).all();

    return new Response(JSON.stringify({
      success: true,
      users: users.results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST - Create new admin user (requires admin session)
export const POST: APIRoute = async ({ request, locals }) => {
  const env = cfEnv;
  const db = env?.MK_APP_DB;
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

  // Verify admin session — and the admin role: creating or disabling users
  // is not a manager's job.
  const session = await AdminAuth.validateSession(request, sessionSecret);
  if (!session.isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const roleDenied = adminOnlyGuard(session);
  if (roleDenied) return roleDenied;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json() as {
      username?: string; password?: string; displayName?: string; email?: string; role?: string;
    };
    const { username, password, displayName, email, role = 'admin' } = body;

    if (!['admin', 'manager', 'viewer'].includes(role)) {
      return new Response(JSON.stringify({ error: 'role must be admin, manager, or viewer' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return new Response(JSON.stringify({
        error: 'Username must be 3-20 characters (letters, numbers, underscores, hyphens)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if username already exists
    const existing = await db.prepare(
      'SELECT id FROM admin_users WHERE username = ?'
    ).bind(username).first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate salt and hash password
    const salt = await generateSalt();
    const passwordHash = await hashPassword(password, salt);

    // Insert new user
    await db.prepare(
      `INSERT INTO admin_users (username, password_hash, salt, display_name, email, role, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`
    ).bind(username, passwordHash, salt, displayName || username, email || null, role).run();

    console.log(`[Admin] New user created: ${username} by ${session.username}`);

    return new Response(JSON.stringify({
      success: true,
      message: `User "${username}" created successfully`,
      username,
      displayName: displayName || username,
      role
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    return new Response(JSON.stringify({ error: 'Failed to create user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE - Disable/delete admin user (requires admin session)
export const DELETE: APIRoute = async ({ request, locals }) => {
  const env = cfEnv;
  const db = env?.MK_APP_DB;
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

  // Verify admin session — and the admin role: creating or disabling users
  // is not a manager's job.
  const session = await AdminAuth.validateSession(request, sessionSecret);
  if (!session.isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const roleDenied = adminOnlyGuard(session);
  if (roleDenied) return roleDenied;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Disable user instead of deleting (soft delete)
    await db.prepare(
      'UPDATE admin_users SET status = ? WHERE id = ?'
    ).bind('disabled', userId).run();

    console.log(`[Admin] User disabled: ID ${userId} by ${session.username}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'User disabled successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error disabling admin user:', error);
    return new Response(JSON.stringify({ error: 'Failed to disable user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
