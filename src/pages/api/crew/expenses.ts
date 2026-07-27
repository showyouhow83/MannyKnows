// Crew Expense Submission API (crew session auth, not admin)
// POST: Submit expense with optional receipt
// GET: Get own expenses for current week
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

async function getCrewFromSession(request: Request, db: any): Promise<{ id: number; name: string } | null> {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/crew_session=([^;]+)/);
  if (!match) return null;
  const session = await db.prepare(`
    SELECT cs.crew_lead_id, cl.name
    FROM crew_sessions cs JOIN crew_leads cl ON cs.crew_lead_id = cl.id
    WHERE cs.session_token = ? AND cs.expires_at > CURRENT_TIMESTAMP AND cl.active = 1
  `).bind(match[1]).first() as any;
  if (!session) return null;
  return { id: session.crew_lead_id, name: session.name };
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const crew = await getCrewFromSession(request, db);
    if (!crew) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const body = await request.json() as any;
    if (!body.work_date || !body.amount) {
      return new Response(JSON.stringify({ error: 'Date and amount are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // Crew portal can only submit 'crew' (reimbursable) or 'company_card'.
    // 'deduction' is admin-only — even if a crew member tries to send it, this
    // coerces to 'crew' so they can never deduct from their own paycheck.
    const paidWith = body.paid_with === 'company_card' ? 'company_card' : 'crew';

    const result = await db.prepare(`
      INSERT INTO crew_expenses (crew_lead_id, work_date, amount, description, receipt_url, paid_with)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(crew.id, body.work_date, body.amount, body.description || null, body.receipt_url || null, paidWith).run();

    return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to add expense' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const crew = await getCrewFromSession(request, db);
    if (!crew) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    // Get current pay week (Sun-Sat)
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    const sun = new Date(now); sun.setDate(now.getDate() - day);
    const sat = new Date(sun); sat.setDate(sun.getDate() + 6);
    const weekStart = sun.toISOString().slice(0, 10);
    const weekEnd = sat.toISOString().slice(0, 10);

    const result = await db.prepare(`
      SELECT * FROM crew_expenses
      WHERE crew_lead_id = ? AND work_date >= ? AND work_date <= ?
      ORDER BY work_date ASC
    `).bind(crew.id, weekStart, weekEnd).all();

    return new Response(JSON.stringify({ success: true, expenses: result.results || [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to load expenses' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
