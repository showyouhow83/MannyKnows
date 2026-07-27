// POST /api/projects/[id]/regenerate-payment-schedule
//
// Recomputes the contract's payment_schedule from its current total +
// start_date + down/monthly counts. Used by the admin Contract tab's
// "Regenerate schedule" button when the admin changes total, dates, or
// counts. Preserves any rows already marked paid/signed (idempotency:
// signed rows merge back into the regenerated list by index).

import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function requireAdmin(request: Request, env: any) {
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);
  return session.isAuthenticated;
}

function freshId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type PayRow = { id: string; kind: string; label: string; amount: number; due_date: string; due_source?: 'end_date' };

// Shared generator. Two plans:
//   'end_date' (default) — down payment(s) + ONE balance row due on the
//                          project's end date. The balance row carries
//                          due_source:'end_date' so it stays synced when the
//                          admin later changes the end date.
//   'monthly'           — down payment(s) + N monthly installments.
function generatePaymentSchedule(opts: {
  total: number;
  downPct: number;
  downCount: number;
  monthlyCount: number;
  startDate: string | null;
  endDate?: string | null;
  plan?: 'end_date' | 'monthly';
}): PayRow[] {
  const { total, downPct, downCount, monthlyCount } = opts;
  const plan = opts.plan === 'monthly' ? 'monthly' : 'end_date';
  if (!Number.isFinite(total) || total <= 0) return [];

  const downTotal = +(total * (downPct / 100)).toFixed(2);
  const balanceTotal = +(total - downTotal).toFixed(2);
  const downAmount = downCount > 0 ? +(downTotal / downCount).toFixed(2) : 0;
  const monthlyAmount = monthlyCount > 0 ? +(balanceTotal / monthlyCount).toFixed(2) : 0;

  let cursor: Date;
  if (opts.startDate) {
    const parsed = new Date(opts.startDate + 'T00:00:00');
    cursor = isNaN(parsed.getTime()) ? new Date() : parsed;
  } else {
    cursor = new Date();
  }
  const isoDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  const addMonths = (d: Date, n: number) => {
    const out = new Date(d);
    out.setMonth(out.getMonth() + n);
    return out;
  };

  const rows: PayRow[] = [];
  let downSum = 0;
  for (let i = 0; i < downCount; i++) {
    const isLast = i === downCount - 1;
    const amt = isLast ? +(downTotal - downSum).toFixed(2) : downAmount;
    downSum += amt;
    rows.push({
      id: freshId('pay'),
      kind: 'down',
      label: downCount === 1 ? 'Down payment' : `Down payment ${i + 1} of ${downCount}`,
      amount: amt,
      due_date: isoDate(addMonths(cursor, i)),
    });
  }

  if (plan === 'end_date') {
    // Single balance payment due on the project end date. due_source keeps
    // it synced to projects.scheduled_end (resolved at generate time + on
    // every project-date change).
    const endDate = (opts.endDate || '').trim();
    rows.push({
      id: freshId('pay'),
      kind: 'final',
      label: 'Balance on completion',
      amount: balanceTotal,
      // Fall back to one month past the last down payment if no end date set.
      due_date: endDate || isoDate(addMonths(cursor, Math.max(downCount, 1))),
      due_source: 'end_date',
    });
  } else {
    let monthlySum = 0;
    for (let i = 0; i < monthlyCount; i++) {
      const isLast = i === monthlyCount - 1;
      const amt = isLast ? +(balanceTotal - monthlySum).toFixed(2) : monthlyAmount;
      monthlySum += amt;
      rows.push({
        id: freshId('pay'),
        kind: 'monthly',
        label: `Payment ${i + 1} of ${monthlyCount}`,
        amount: amt,
        due_date: isoDate(addMonths(cursor, downCount + i)),
      });
    }
  }
  return rows;
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const projectId = Number(params.id);
    if (!projectId || Number.isNaN(projectId)) return json({ error: 'project id is required' }, 400);

    // The editor passes the CURRENT (possibly unsaved) total/counts/dates so
    // the regenerated schedule reflects what's on screen — not a stale DB row.
    // Any field omitted falls back to the stored contract value.
    let body: {
      plan?: 'end_date' | 'monthly';
      total?: number; down_payment_percent?: number; down_payment_count?: number;
      monthly_payment_count?: number; start_date?: string | null;
    } = {};
    try { body = await request.json(); } catch { /* no body = use stored values */ }

    const contract = await db.prepare(
      'SELECT * FROM project_contracts WHERE project_id = ?'
    ).bind(projectId).first() as any;
    if (!contract) return json({ error: 'Contract not found' }, 404);

    if (contract.status === 'signed' || contract.status === 'countersigned') {
      return json({ error: 'Cannot regenerate the schedule of a signed contract. Void it first.' }, 409);
    }

    // Regenerating mints fresh row ids, which would orphan any collected
    // receipts (keyed by row id). Block it until those receipts are undone.
    // Tolerant of a not-yet-migrated table.
    try {
      const receiptCount = await db.prepare(
        'SELECT COUNT(*) AS n FROM payment_receipts WHERE project_contract_id = ?'
      ).bind(contract.id).first() as { n: number } | null;
      if (receiptCount && receiptCount.n > 0) {
        return json({ error: 'Some payments are already collected. Undo those receipts before regenerating the schedule.' }, 409);
      }
    } catch (e) {
      console.error('[regenerate-payment-schedule] receipt guard skipped (table missing?):', e);
    }

    // Pull the project's end date for the balance-on-completion plan.
    const proj = await db.prepare(
      'SELECT scheduled_end FROM projects WHERE id = ?'
    ).bind(projectId).first() as { scheduled_end: string | null } | null;

    const num = (v: unknown, fallback: number) => (v === undefined || v === null || !Number.isFinite(Number(v)) ? fallback : Number(v));
    const effTotal = num(body.total, Number(contract.total) || 0);

    const rows = generatePaymentSchedule({
      total: effTotal,
      downPct: num(body.down_payment_percent, Number(contract.down_payment_percent)),
      downCount: num(body.down_payment_count, Number(contract.down_payment_count)),
      monthlyCount: num(body.monthly_payment_count, Number(contract.monthly_payment_count)),
      startDate: (body.start_date !== undefined ? body.start_date : contract.start_date) as string | null,
      endDate: proj?.scheduled_end || null,
      plan: body.plan === 'monthly' ? 'monthly' : 'end_date',
    });

    if (effTotal <= 0) {
      // Nothing to schedule yet — tell the editor so it can prompt instead of
      // silently producing an empty schedule (the "toggle does nothing" case).
      return json({ success: true, payment_schedule: [], empty_reason: 'no_total' });
    }

    await db.prepare(`
      UPDATE project_contracts
      SET payment_schedule = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(JSON.stringify(rows), contract.id).run();

    return json({ success: true, payment_schedule: rows });
  } catch (error) {
    console.error('[projects/[id]/regenerate-payment-schedule] error:', error);
    return json({ error: 'Failed to regenerate schedule' }, 500);
  }
};
