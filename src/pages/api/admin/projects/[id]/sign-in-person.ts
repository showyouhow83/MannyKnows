// POST /api/admin/projects/{id}/sign-in-person
//
// Captures BOTH customer + contractor signatures in a single transaction.
// Used when the admin meets the customer in person (e.g. picking up the
// deposit) and they sign on the admin's iPad. The contractor signature
// captured here overrides the saved singleton ONLY for this contract —
// the global contractor_signature row is left untouched.
//
// Body:
//   customer_name                     string
//   customer_signature_data_url       data:image/...
//   customer_consent_text             string
//   contractor_name                   string
//   contractor_signature_data_url     data:image/...
//   contractor_consent_text           string
//   use_as_reference                  true|false|null  (optional Y/N)
//
// On success, the contract status flips to 'countersigned' (both sides
// done in one shot) and signed_at + countersigned_at are stamped.
// Returns { success, project_id } so the page can kick off the signed-PDF
// generation iframe.

import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../../lib/adminAuth';
import { sendContractSignedNotification } from '../../../../../lib/contract-emails';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);

    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return json({ error: 'Unauthorized' }, 401);

    const projectId = Number(params.id);
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return json({ error: 'Invalid project id' }, 400);
    }

    const body = await request.json() as {
      customer_name?: string;
      customer_signature_data_url?: string;
      customer_consent_text?: string;
      contractor_name?: string;
      contractor_signature_data_url?: string;
      contractor_consent_text?: string;
      use_as_reference?: boolean | number | null;
      check_number?: string | null;
    };

    const custName = (body.customer_name || '').trim();
    const custSig = (body.customer_signature_data_url || '').trim();
    const custConsent = (body.customer_consent_text || '').trim();
    const ctrName = (body.contractor_name || '').trim();
    const ctrSig = (body.contractor_signature_data_url || '').trim();
    const ctrConsent = (body.contractor_consent_text || '').trim();

    if (!custName || custName.length < 2) return json({ error: 'Customer full legal name is required' }, 400);
    if (!custSig.startsWith('data:image/')) return json({ error: 'Customer signature is required' }, 400);
    if (!custConsent) return json({ error: 'Customer consent text is required' }, 400);
    if (!ctrName || ctrName.length < 2) return json({ error: 'Contractor full legal name is required' }, 400);
    if (!ctrSig.startsWith('data:image/')) return json({ error: 'Contractor signature is required' }, 400);
    if (!ctrConsent) return json({ error: 'Contractor consent text is required' }, 400);

    const contract = await db.prepare(
      'SELECT id, status FROM project_contracts WHERE project_id = ?'
    ).bind(projectId).first() as { id: number; status: string } | null;

    if (!contract) return json({ error: 'No contract for this project — apply a template first.' }, 404);
    if (contract.status === 'void') return json({ error: 'This contract has been voided.' }, 409);
    if (contract.status === 'countersigned') return json({ error: 'This contract is already fully signed.' }, 409);

    // Audit trail.
    const ip = request.headers.get('CF-Connecting-IP')
      || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
      || null;
    const userAgent = request.headers.get('User-Agent') || null;

    // Wipe any prior in-flight signatures on this contract (e.g. customer
    // signed remotely earlier, then they reverted to in-person). Keeps the
    // contract_signatures table clean — one customer + one contractor.
    await db.prepare('DELETE FROM contract_signatures WHERE project_contract_id = ?').bind(contract.id).run();

    // Insert customer + contractor signatures in one batch.
    await db.batch([
      db.prepare(`
        INSERT INTO contract_signatures
          (project_contract_id, signer_role, signer_name, signature_data_url, consent_text, ip_address, user_agent)
        VALUES (?, 'customer', ?, ?, ?, ?, ?)
      `).bind(contract.id, custName, custSig, custConsent, ip, userAgent),
      db.prepare(`
        INSERT INTO contract_signatures
          (project_contract_id, signer_role, signer_name, signature_data_url, consent_text, ip_address, user_agent)
        VALUES (?, 'contractor', ?, ?, ?, ?, ?)
      `).bind(contract.id, ctrName, ctrSig, ctrConsent, ip, userAgent),
    ]);

    // Flip status. Both parties signed at the same time, so countersigned
    // is immediate. Reference Y/N + check number stored if provided.
    const refValue = body.use_as_reference == null ? null : (body.use_as_reference ? 1 : 0);
    const checkNum = (body.check_number || '').trim() || null;

    await db.prepare(`
      UPDATE project_contracts
      SET status = 'countersigned',
          signed_at = CURRENT_TIMESTAMP,
          countersigned_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          use_as_reference = CASE WHEN ? IS NULL THEN use_as_reference ELSE ? END,
          terms = CASE WHEN ? IS NULL THEN terms ELSE json_set(COALESCE(terms, '{}'), '$.check_number', ?) END
      WHERE id = ?
    `).bind(refValue, refValue, checkNum, checkNum, contract.id).run();

    console.log(`[contract/sign-in-person] Contract ${contract.id} signed in-person — customer:${custName} contractor:${ctrName}`);

    // A check number at signing means the DOWN PAYMENT was received in person.
    // Record a receipt for the down-payment row (reusing the signatures we just
    // captured) so the contract's payment table shows it as collected and the
    // Collect button flips to paid. No check → no receipt (the down payment may
    // be coming later or via another method, which the admin records manually).
    if (checkNum) {
      try {
        const schedRow = await db.prepare('SELECT payment_schedule FROM project_contracts WHERE id = ?')
          .bind(contract.id).first() as { payment_schedule: string | null } | null;
        let rows: any[] = [];
        try { rows = JSON.parse(schedRow?.payment_schedule || '[]'); } catch {}
        const downRow = rows.find((r) => r && r.kind === 'down') || rows[0];
        if (downRow && downRow.id) {
          const today = new Date().toISOString().split('T')[0];
          await db.prepare(`
            INSERT INTO payment_receipts
              (project_contract_id, row_id, row_label, row_kind, amount, payment_method,
               check_number, customer_name, customer_signature_data_url, contractor_name,
               contractor_signature_data_url, collected_at, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, 'check', ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (project_contract_id, row_id) DO UPDATE SET
              row_label = excluded.row_label, row_kind = excluded.row_kind, amount = excluded.amount,
              payment_method = excluded.payment_method, check_number = excluded.check_number,
              customer_name = excluded.customer_name, customer_signature_data_url = excluded.customer_signature_data_url,
              contractor_name = excluded.contractor_name, contractor_signature_data_url = excluded.contractor_signature_data_url,
              collected_at = excluded.collected_at
          `).bind(
            contract.id, downRow.id, downRow.label || 'Down payment', downRow.kind || 'down',
            Number(downRow.amount) || 0, checkNum, custName, custSig, ctrName, ctrSig, today, ip, userAgent
          ).run();
          console.log(`[contract/sign-in-person] Down payment receipt recorded (check ${checkNum}) for row ${downRow.id}`);
        }
      } catch (e) {
        console.error('[sign-in-person] down payment receipt failed:', e);
      }
    }

    // Best-effort admin notification (same template as remote signing). If
    // Resend fails we still return success — the signatures are saved.
    try {
      const ctx = await db.prepare(`
        SELECT
          p.id AS project_id, p.project_number, p.customer_name, p.customer_email,
          c.contract_token, c.total, c.start_date,
          c.down_payment_percent, c.down_payment_count, c.monthly_payment_count, c.warranty_months,
          c.signed_at
        FROM project_contracts c
        INNER JOIN projects p ON p.id = c.project_id
        WHERE c.id = ?
      `).bind(contract.id).first() as any;
      if (ctx) {
        const resendApiKey = env?.RESEND_API_KEY;
        const notificationEmail = env?.NOTIFICATION_EMAIL;
        if (resendApiKey && notificationEmail) {
          const origin = request.headers.get('origin') || '';
          const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
          await sendContractSignedNotification(
            {
              project_id: ctx.project_id as number,
              project_number: ctx.project_number as string,
              customer_name: ctx.customer_name as string,
              customer_email: ctx.customer_email as string,
              contract_token: ctx.contract_token as string,
              total: Number(ctx.total) || 0,
              start_date: ctx.start_date as string | null,
              down_payment_percent: Number(ctx.down_payment_percent) || 0,
              down_payment_count: Number(ctx.down_payment_count) || 0,
              monthly_payment_count: Number(ctx.monthly_payment_count) || 0,
              warranty_months: Number(ctx.warranty_months) || 0,
              signer_name: custName + ' (in-person with ' + ctrName + ')',
              signed_at: (ctx.signed_at as string | null) ?? undefined,
            },
            { RESEND_API_KEY: resendApiKey, NOTIFICATION_EMAIL: notificationEmail },
            isLocalhost
          );
        }
      }
    } catch (err) {
      console.error('[contract/sign-in-person] notification failed:', err);
    }

    return json({ success: true, project_id: projectId, contract_id: contract.id });
  } catch (error) {
    console.error('[contract/sign-in-person] error:', error);
    return json({ error: 'Failed to record in-person signing' }, 500);
  }
};
