// POST /api/projects/[id]/send-invoice  { row_id }
// Emails the customer an invoice for a single payment-schedule row (amount +
// mail-a-check instructions). Triggered from the Contract tab "Send Invoice".
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import { getBrand } from '../../../../lib/brand';
import { sendPaymentInvoiceToCustomer } from '../../../../lib/quote-emails';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return json({ error: 'Unauthorized' }, 401);

    const projectId = Number(params.id);
    if (!projectId) return json({ error: 'project id required' }, 400);

    const body = await request.json().catch(() => ({})) as { row_id?: string };
    const rowId = (body.row_id || '').trim();
    if (!rowId) return json({ error: 'row_id required' }, 400);

    const project = await db.prepare(
      'SELECT id, project_number, customer_name, customer_email, client_token, partner_id FROM projects WHERE id = ?'
    ).bind(projectId).first() as any;
    if (!project) return json({ error: 'Project not found' }, 404);
    if (!project.customer_email) return json({ error: 'This project has no customer email on file.' }, 400);

    const contract = await db.prepare(
      'SELECT payment_schedule, late_fee_amount, late_fee_grace_days FROM project_contracts WHERE project_id = ?'
    ).bind(projectId).first() as any;
    if (!contract) return json({ error: 'No contract for this project.' }, 404);

    let schedule: any[] = [];
    try { schedule = JSON.parse(contract.payment_schedule || '[]'); } catch { schedule = []; }
    const row = schedule.find((r: any) => String(r.id) === rowId);
    if (!row) return json({ error: 'Payment row not found.' }, 404);

    const brand = await getBrand(db, project.partner_id ? Number(project.partner_id) : null);
    const origin = request.headers.get('origin') || '';
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

    const result = await sendPaymentInvoiceToCustomer(
      {
        customer_name: project.customer_name || 'there',
        customer_email: project.customer_email,
        project_number: project.project_number || undefined,
        label: row.label || row.kind || 'Payment',
        amount: Number(row.amount) || 0,
        due_date: row.due_date || null,
        client_token: project.client_token || null,
        late_fee_amount: Number(contract.late_fee_amount) || 0,
        late_fee_grace_days: Number(contract.late_fee_grace_days) || 0,
      },
      env,
      isLocalhost,
      brand,
    );

    if (!result.success) return json({ error: result.error || 'Failed to send invoice' }, 500);

    // Log the send so the Contract tab can show "Invoiced {date}" + offer Resend.
    // Lazy-create the table so no separate migration is needed.
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS payment_invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_contract_id INTEGER,
          project_id INTEGER,
          row_id TEXT,
          amount REAL,
          sent_to TEXT,
          sent_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      await db.prepare(`
        INSERT INTO payment_invoices (project_contract_id, project_id, row_id, amount, sent_to)
        VALUES ((SELECT id FROM project_contracts WHERE project_id = ?), ?, ?, ?, ?)
      `).bind(projectId, projectId, rowId, Number(row.amount) || 0, project.customer_email).run();
    } catch (e) {
      console.error('[send-invoice] log write failed (non-fatal):', e);
    }

    return json({ success: true, sent_to: project.customer_email });
  } catch (error) {
    console.error('[send-invoice] error:', error);
    return json({ error: 'Failed to send invoice' }, 500);
  }
};
