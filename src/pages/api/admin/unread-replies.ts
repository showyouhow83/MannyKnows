import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

// "Mark all read" needs to silence three kinds of notifications: customer
// replies (which have a per-row read_at), new leads (status='new'), and
// recent quote responses (status accepted/declined within 7d). The latter
// two don't have a read-state column, so we stash a per-admin "last seen
// notifications at" timestamp in KV and filter against it on every GET.
function lastSeenKey(username: string): string {
  return `notif:last_seen:${username.toLowerCase()}`;
}

// GET: Fetch all pending notifications (replies, new leads, quote responses)
export const GET: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env;
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);

  if (!session.isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const db = env?.MK_APP_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
  }

  // Per-admin "last seen" timestamp — Mark all read writes this; GET filters
  // leads + quoteResponses to items NEWER than this timestamp so dismissed
  // ones don't reappear in the bell. Customer replies are still gated on
  // their own read_at column (existing behaviour).
  const kv = env?.MK_ADMIN_KV;
  const username = session.username || 'anonymous';
  let lastSeen: string | null = null;
  if (kv) {
    try { lastSeen = await kv.get(lastSeenKey(username)); } catch {}
  }
  // SQLite-friendly comparison: 'YYYY-MM-DD HH:MM:SS' strings sort
  // chronologically. If lastSeen is missing, use the unix epoch so all
  // rows pass through.
  const lastSeenSql = lastSeen || '1970-01-01 00:00:00';

  // 1. Unread customer replies (gated on per-row read_at — unchanged)
  const repliesResult = await db.prepare(`
    SELECT m.id, m.quote_id, m.subject, m.body, m.sender_name, m.sender_email, m.created_at,
           q.quote_number, q.customer_name
    FROM messages m
    LEFT JOIN quotes q ON m.quote_id = q.id
    WHERE m.sender_type = 'customer'
      AND m.read_at IS NULL
    ORDER BY m.created_at DESC
    LIMIT 20
  `).all();

  // 2. New leads since the admin's last "Mark all read"
  const leadsResult = await db.prepare(`
    SELECT id, customer_name, customer_email, service_type, created_at
    FROM leads
    WHERE status = 'new'
      AND created_at > ?
    ORDER BY created_at DESC
    LIMIT 10
  `).bind(lastSeenSql).all();

  // 3. Quote responses (accepted/declined) in last 7 days AND newer than
  //    the admin's last "Mark all read".
  const quoteResponsesResult = await db.prepare(`
    SELECT id, quote_number, customer_name, status, responded_at
    FROM quotes
    WHERE status IN ('accepted', 'declined')
      AND responded_at IS NOT NULL
      AND responded_at >= datetime('now', '-7 days')
      AND responded_at > ?
    ORDER BY responded_at DESC
    LIMIT 10
  `).bind(lastSeenSql).all();

  const replies = repliesResult.results || [];
  const leads = leadsResult.results || [];
  const quoteResponses = quoteResponsesResult.results || [];

  return new Response(JSON.stringify({
    success: true,
    replies,
    leads,
    quoteResponses,
    total: replies.length + leads.length + quoteResponses.length
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
};

// POST: Mark notifications as read
export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env;
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);

  if (!session.isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const db = env?.MK_APP_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
  }

  const body = await request.json() as { quote_id?: number; mark_all?: boolean };

  if (body.mark_all) {
    // Mark customer-reply rows AND stamp the per-admin "last seen"
    // timestamp so new leads + recent quote responses also drop out of
    // the bell. Both side-effects happen together so the bell flips to 0
    // immediately on the next GET.
    await db.prepare(`
      UPDATE messages SET read_at = datetime('now')
      WHERE sender_type = 'customer' AND read_at IS NULL
    `).run();

    const kv = env?.MK_ADMIN_KV;
    const username = session.username || 'anonymous';
    if (kv) {
      // SQLite CURRENT_TIMESTAMP format so the GET's string compare works.
      const nowSql = new Date().toISOString().replace('T', ' ').slice(0, 19);
      try { await kv.put(lastSeenKey(username), nowSql); } catch (err) {
        console.warn('[unread-replies] KV put failed (non-fatal):', err);
      }
    }

  } else if (body.quote_id) {
    await db.prepare(`
      UPDATE messages SET read_at = datetime('now')
      WHERE quote_id = ? AND sender_type = 'customer' AND read_at IS NULL
    `).bind(body.quote_id).run();
  } else {
    return new Response(JSON.stringify({ error: 'quote_id or mark_all required' }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
