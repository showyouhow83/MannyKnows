// Admin Crew Expenses API
// GET: Get expenses for a date range
// POST: Add expense
// DELETE: Remove expense
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    const env = cfEnv;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const weekStart = url.searchParams.get('week_start');
    const weekEnd = url.searchParams.get('week_end');
    if (!weekStart || !weekEnd) return new Response(JSON.stringify({ error: 'week_start and week_end required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const result = await db.prepare(`
      SELECT e.*, cl.name as crew_name
      FROM crew_expenses e
      JOIN crew_leads cl ON e.crew_lead_id = cl.id
      WHERE e.work_date >= ? AND e.work_date <= ?
      ORDER BY e.work_date ASC, e.created_at ASC
    `).bind(weekStart, weekEnd).all();

    return new Response(JSON.stringify({ success: true, expenses: result.results || [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to load expenses' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const body = await request.json() as any;
    if (!body.crew_lead_id || !body.work_date || !body.amount) {
      return new Response(JSON.stringify({ error: 'crew_lead_id, work_date, and amount are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // Admin can record three kinds of expenses:
    //   'crew'         — out-of-pocket, reimbursed (adds to paycheck)
    //   'company_card' — already paid by company (FYI only, no pay impact)
    //   'deduction'    — admin paid for something on crew's behalf (subtracts from paycheck)
    const paidWith = body.paid_with === 'company_card' ? 'company_card'
      : body.paid_with === 'deduction' ? 'deduction'
      : 'crew';

    const result = await db.prepare(`
      INSERT INTO crew_expenses (crew_lead_id, work_date, amount, description, receipt_url, paid_with)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(body.crew_lead_id, body.work_date, body.amount, body.description || null, body.receipt_url || null, paidWith).run();

    return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to add expense' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const body = await request.json() as any;
    if (!body.id) return new Response(JSON.stringify({ error: 'Expense ID required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const updates: string[] = [];
    const params: any[] = [];
    if (body.crew_lead_id !== undefined) { updates.push('crew_lead_id = ?'); params.push(body.crew_lead_id); }
    if (body.work_date !== undefined) { updates.push('work_date = ?'); params.push(body.work_date); }
    if (body.amount !== undefined) { updates.push('amount = ?'); params.push(body.amount); }
    if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description || null); }
    if (body.receipt_url !== undefined) { updates.push('receipt_url = ?'); params.push(body.receipt_url || null); }
    if (body.paid_with !== undefined) {
      updates.push('paid_with = ?');
      const pw = body.paid_with === 'company_card' ? 'company_card'
        : body.paid_with === 'deduction' ? 'deduction'
        : 'crew';
      params.push(pw);
    }

    if (updates.length === 0) return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    params.push(body.id);
    await db.prepare(`UPDATE crew_expenses SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update expense' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const reqUrl = new URL(request.url);
    const id = reqUrl.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'Expense ID required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    await db.prepare('DELETE FROM crew_expenses WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete expense' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
