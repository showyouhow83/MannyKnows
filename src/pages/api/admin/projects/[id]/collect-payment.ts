// POST   /api/admin/projects/{id}/collect-payment  — record (or re-record) a
//        receipt for one payment_schedule row: amount received, method,
//        check #, date, and BOTH signatures (client + contractor).
// DELETE /api/admin/projects/{id}/collect-payment?row_id=...  — undo a receipt.
//
// Upserts by (project_contract_id, row_id). The signatures captured here
// populate the contract PDF's per-row "Client ___ / Contractor ___" column.

import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../../lib/adminAuth';
import { Resend } from 'resend';
import { emailHeader, emailFooter, emailButton } from '../../../../../lib/quote-emails';
import { getBrand, emailFrom } from '../../../../../lib/brand';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function requireAdmin(request: Request, env: any) {
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);
  return session.isAuthenticated;
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const projectId = Number(params.id);
    if (!projectId || Number.isNaN(projectId)) return json({ error: 'project id is required' }, 400);

    const contract = await db.prepare(
      'SELECT id FROM project_contracts WHERE project_id = ?'
    ).bind(projectId).first() as { id: number } | null;
    if (!contract) return json({ error: 'No contract for this project — apply a template first.' }, 404);

    const body = await request.json() as {
      row_id?: string;
      row_label?: string;
      row_kind?: string;
      amount?: number;
      payment_method?: string;
      check_number?: string | null;
      collected_at?: string | null;
      customer_name?: string;
      customer_signature_data_url?: string;
      contractor_name?: string;
      contractor_signature_data_url?: string;
    };

    const rowId = (body.row_id || '').trim();
    if (!rowId) return json({ error: 'row_id is required' }, 400);

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'A positive amount is required' }, 400);

    const custName = (body.customer_name || '').trim();
    const custSig = (body.customer_signature_data_url || '').trim();
    const ctrName = (body.contractor_name || '').trim();
    const ctrSig = (body.contractor_signature_data_url || '').trim();

    // "Mark as already paid" — records the payment as received WITHOUT the
    // in-person signature flow (e.g. paid by bank transfer / earlier). Names
    // optional; signatures skipped.
    const noSig = (body as any).no_signature === true;
    if (!noSig) {
      if (!custName || custName.length < 2) return json({ error: 'Customer name is required' }, 400);
      if (!custSig.startsWith('data:image/')) return json({ error: 'Customer signature is required' }, 400);
      if (!ctrName || ctrName.length < 2) return json({ error: 'Contractor name is required' }, 400);
      if (!ctrSig.startsWith('data:image/')) return json({ error: 'Contractor signature is required' }, 400);
    }

    const method = (body.payment_method || 'check').trim().toLowerCase();
    const checkNum = (body.check_number || '').trim() || null;
    const collectedAt = (body.collected_at || '').trim() || null;
    const rowLabel = (body.row_label || '').trim() || null;
    const rowKind = (body.row_kind || '').trim() || null;

    const ip = request.headers.get('CF-Connecting-IP')
      || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
      || null;
    const userAgent = request.headers.get('User-Agent') || null;

    // Upsert: one receipt per (contract, row). Re-collecting overwrites.
    await db.prepare(`
      INSERT INTO payment_receipts
        (project_contract_id, row_id, row_label, row_kind, amount, payment_method,
         check_number, customer_name, customer_signature_data_url, contractor_name,
         contractor_signature_data_url, collected_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (project_contract_id, row_id) DO UPDATE SET
        row_label = excluded.row_label,
        row_kind = excluded.row_kind,
        amount = excluded.amount,
        payment_method = excluded.payment_method,
        check_number = excluded.check_number,
        customer_name = excluded.customer_name,
        customer_signature_data_url = excluded.customer_signature_data_url,
        contractor_name = excluded.contractor_name,
        contractor_signature_data_url = excluded.contractor_signature_data_url,
        collected_at = excluded.collected_at,
        ip_address = excluded.ip_address,
        user_agent = excluded.user_agent
    `).bind(
      contract.id, rowId, rowLabel, rowKind, amount, method,
      checkNum, (custName || null), (custSig || null), (ctrName || null), (ctrSig || null), collectedAt, ip, userAgent
    ).run();

    // Receipt confirmation email — customer + admin. Best-effort.
    try {
      const proj = await db.prepare(
        'SELECT project_number, customer_name, customer_email, client_token, partner_id FROM projects WHERE id = ?'
      ).bind(projectId).first() as any;
      const apiKey = env?.RESEND_API_KEY;
      if (proj && apiKey) {
        const resend = new Resend(apiKey);
        const brand = await getBrand(db, proj.partner_id);
        const origin = new URL(request.url).origin;
        const link = `${origin}/project/${encodeURIComponent(proj.client_token)}`;
        const fmtMoney = (n: number) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const methodLine = `${method}${checkNum ? ` #${checkNum}` : ''}`;
        if (proj.customer_email) {
          const firstName = (proj.customer_name || '').split(' ')[0] || 'there';
          await resend.emails.send({
            from: emailFrom(brand, 'projects'),
            to: proj.customer_email,
            subject: `Payment received — ${fmtMoney(amount)} · ${proj.project_number}`,
            html: `<!DOCTYPE html><html><body style="margin:0;background:#f1f5f9;"><div style="max-width:600px;margin:0 auto;background:#fff;">
              ${emailHeader('Payment received', brand)}
              <div style="padding:32px 30px;">
                <h1 style="font-size:22px;color:#1e293b;margin:0 0 12px;">Thank you, ${escapeHtml(firstName)}!</h1>
                <p style="font-size:15px;color:#475569;line-height:1.6;">We've recorded your payment of <strong>${fmtMoney(amount)}</strong> (${escapeHtml(rowLabel || rowKind || 'payment')}) via ${escapeHtml(methodLine)}. A signed receipt is on file and your contract reflects it.</p>
                <div style="text-align:center;margin:24px 0;">${emailButton(link, 'View my project', 'blue')}</div>
              </div>
              ${emailFooter(undefined, brand)}
            </div></body></html>`,
          });
        }
        const adminTo = env?.NOTIFICATION_EMAIL || 'mm@mannyknows.com';
        if (adminTo) {
          await resend.emails.send({
            from: 'MannyKnows <projects@send.mannyknows.com>',
            to: adminTo,
            subject: `Payment collected ${fmtMoney(amount)} — ${proj.project_number}`,
            html: `<div style="font-family:sans-serif;"><h2>Payment recorded</h2>
              <p><strong>${escapeHtml(proj.project_number)}</strong> — ${escapeHtml(proj.customer_name || '')}</p>
              <p>${escapeHtml(rowLabel || rowKind || 'payment')}: <strong>${fmtMoney(amount)}</strong> · ${escapeHtml(methodLine)}${collectedAt ? ` · ${escapeHtml(collectedAt)}` : ''}</p></div>`,
          });
        }
      }
    } catch (e) {
      console.error('[collect-payment] receipt email failed:', e);
    }

    return json({ success: true, project_id: projectId, row_id: rowId });
  } catch (error) {
    console.error('[collect-payment] POST error:', error);
    return json({ error: 'Failed to record payment' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals, params, url }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const projectId = Number(params.id);
    if (!projectId || Number.isNaN(projectId)) return json({ error: 'project id is required' }, 400);

    const rowId = (url.searchParams.get('row_id') || '').trim();
    if (!rowId) return json({ error: 'row_id is required' }, 400);

    const contract = await db.prepare(
      'SELECT id FROM project_contracts WHERE project_id = ?'
    ).bind(projectId).first() as { id: number } | null;
    if (!contract) return json({ error: 'No contract for this project.' }, 404);

    await db.prepare(
      'DELETE FROM payment_receipts WHERE project_contract_id = ? AND row_id = ?'
    ).bind(contract.id, rowId).run();

    return json({ success: true });
  } catch (error) {
    console.error('[collect-payment] DELETE error:', error);
    return json({ error: 'Failed to undo receipt' }, 500);
  }
};
