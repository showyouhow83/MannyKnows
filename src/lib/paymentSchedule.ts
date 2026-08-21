// Payment-schedule generator — the ONE copy (was duplicated in
// apply-contract-template.ts and regenerate-payment-schedule.ts, and is now
// also used by the quote PATCH handler to keep a draft contract's schedule in
// sync when the quote's money changes after promotion).
//
// Two plans:
//   'end_date' (default) — down payment(s) + ONE balance row due on the
//                          project's end date. The balance row carries
//                          due_source:'end_date' so it stays synced when the
//                          admin later changes the end date.
//   'monthly'            — down payment(s) + N monthly installments.

export function freshId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export type PayRow = { id: string; kind: string; label: string; amount: number; due_date: string; due_source?: 'end_date' };

export function generatePaymentSchedule(opts: {
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
    const endDate = (opts.endDate || '').trim();
    rows.push({
      id: freshId('pay'),
      kind: 'final',
      label: 'Balance on completion',
      amount: balanceTotal,
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

// Money on a quote changed (discount / scope subtotals) — push the new figures
// down the denormalized chain: the promoted project's total, and, when an
// UNSIGNED draft contract exists, its total + discount + regenerated schedule
// (same plan the schedule already used). Signed/sent contracts are never
// touched — they are frozen legal documents; the admin amends those
// deliberately via the contract editor.
export async function propagateQuoteMoney(db: any, quoteId: number, total: number, discount: number): Promise<void> {
  const proj = await db.prepare(
    'SELECT id, scheduled_end FROM projects WHERE quote_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(quoteId).first();
  if (!proj) return;

  await db.prepare('UPDATE projects SET total = ? WHERE id = ?').bind(total, proj.id).run();

  const contract = await db.prepare(
    `SELECT id, status, down_payment_percent, down_payment_count, monthly_payment_count,
            start_date, payment_schedule
     FROM project_contracts WHERE project_id = ? ORDER BY id DESC LIMIT 1`
  ).bind(proj.id).first();
  if (!contract || contract.status !== 'draft') return;

  // Keep whichever plan the existing schedule used.
  let plan: 'end_date' | 'monthly' = 'end_date';
  try {
    const rows = JSON.parse((contract.payment_schedule as string) || '[]');
    if (Array.isArray(rows) && rows.some((r: any) => r?.kind === 'monthly')) plan = 'monthly';
  } catch {}

  const schedule = generatePaymentSchedule({
    total,
    downPct: Number(contract.down_payment_percent) || 100,
    downCount: Number(contract.down_payment_count) || 1,
    monthlyCount: Number(contract.monthly_payment_count) || 0,
    startDate: (contract.start_date as string) || null,
    endDate: (proj.scheduled_end as string) || null,
    plan,
  });

  await db.prepare(
    'UPDATE project_contracts SET total = ?, discount = ?, payment_schedule = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(total, discount, JSON.stringify(schedule), contract.id).run();
}
