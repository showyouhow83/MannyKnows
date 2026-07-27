// Crew Login API
// POST: Authenticate crew member by name + phone, return session cookie (expires end of day)
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Strip leading country code 1 if 11 digits
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

function normalizeName(name: string): string {
  // Remove all spaces, lowercase — "John D" and "johnd" and "JOHN D" all become "johnd"
  return name.trim().toLowerCase().replace(/\s+/g, '');
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json() as any;
    const name = body.name?.trim();
    const phone = body.phone?.trim();

    if (!name || !phone) {
      return new Response(JSON.stringify({ error: 'Name and phone number are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const phoneDigits = normalizePhone(phone);
    const nameLower = normalizeName(name);

    // Find crew member — match normalized phone AND name (spaces stripped, case-insensitive)
    const result = await db.prepare(`
      SELECT * FROM crew_leads
      WHERE active = 1
        AND REPLACE(LOWER(TRIM(name)), ' ', '') = ?
        AND SUBSTR(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, '-', ''), ' ', ''), '(', ''), ')', ''), '+', ''), -10) = ?
    `).bind(nameLower, phoneDigits.slice(-10)).first() as any;

    if (!result) {
      return new Response(JSON.stringify({ error: 'Name and phone number not found. Please check your information or contact your manager.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // Generate session token — expires at end of current day (midnight ET)
    const sessionToken = crypto.randomUUID();
    const now = new Date();
    // Expire at end of today in ET (UTC-4 summer / UTC-5 winter) — approx UTC-4
    const endOfDayET = new Date(now);
    endOfDayET.setUTCHours(23 + 4, 59, 59, 0); // 11:59 PM ET = 3:59 AM next day UTC
    if (endOfDayET <= now) endOfDayET.setUTCDate(endOfDayET.getUTCDate() + 1);

    // Clean up old sessions for this crew member
    await db.prepare('DELETE FROM crew_sessions WHERE crew_lead_id = ? OR expires_at < CURRENT_TIMESTAMP').bind(result.id).run();

    // Insert new session
    await db.prepare(`
      INSERT INTO crew_sessions (crew_lead_id, session_token, expires_at)
      VALUES (?, ?, ?)
    `).bind(result.id, sessionToken, endOfDayET.toISOString()).run();

    console.log(`[Crew] ${result.name} logged in`);

    return new Response(JSON.stringify({
      success: true,
      crew: { id: result.id, name: result.name }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `crew_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
      }
    });

  } catch (error) {
    console.error('Crew login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET: Validate current session, return crew member info
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ authenticated: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/crew_session=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ authenticated: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const sessionToken = match[1];
    const session = await db.prepare(`
      SELECT cs.crew_lead_id, cs.expires_at, cl.name, cl.hourly_rate
      FROM crew_sessions cs
      JOIN crew_leads cl ON cs.crew_lead_id = cl.id
      WHERE cs.session_token = ? AND cs.expires_at > CURRENT_TIMESTAMP AND cl.active = 1
    `).bind(sessionToken).first() as any;

    if (!session) return new Response(JSON.stringify({ authenticated: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({
      authenticated: true,
      crew: { id: session.crew_lead_id, name: session.name }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch {
    return new Response(JSON.stringify({ authenticated: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};

// DELETE: Logout
export const DELETE: APIRoute = async ({ request, locals }) => {
  const env = cfEnv;
  const db = env?.MK_APP_DB;
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/crew_session=([^;]+)/);
  if (match && db) {
    await db.prepare('DELETE FROM crew_sessions WHERE session_token = ?').bind(match[1]).run().catch(() => {});
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'crew_session=; Path=/; HttpOnly; Max-Age=0'
    }
  });
};
