// POST /api/projects/contract/sign
//
// Customer-side endpoint that captures an electronic signature on a
// project contract. Mirrors /api/quotes/respond — token-gated (no admin
// session), persists the signature + audit trail, and flips the contract
// status from 'sent' → 'signed'.
//
// Body params:
//   token              (required) — contract.contract_token UUID
//   signature_data_url (required) — base64 PNG from the canvas pad
//   signer_name        (required) — customer's typed full legal name
//   consent_text       (required) — exact wording of the consent checkbox
//   use_as_reference   (optional) — true/false answer to the reference Y/N
//
// Returns: { success, status }
// Refuses to sign if the contract is in draft / signed / countersigned / void.

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { sendContractSignedNotification, sendContractSignedToCustomer } from '../../../../lib/contract-emails';
import { notifyAdmin } from '../../../../lib/notify-admin';
import { getBrand } from '../../../../lib/brand';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);

    const body = await request.json() as {
      token?: string;
      signature_data_url?: string;
      signer_name?: string;
      consent_text?: string;
      use_as_reference?: boolean | number | null;
    };

    const token = (body.token || '').trim();
    const sigDataUrl = (body.signature_data_url || '').trim();
    const signerName = (body.signer_name || '').trim();
    const consentText = (body.consent_text || '').trim();
    if (!token) return json({ error: 'token is required' }, 400);
    if (!sigDataUrl || !sigDataUrl.startsWith('data:image/')) return json({ error: 'A drawn signature is required' }, 400);
    if (!signerName || signerName.length < 2) return json({ error: 'Your full legal name is required' }, 400);
    if (!consentText) return json({ error: 'Consent text missing' }, 400);

    // Look up the contract by token and gate by status.
    const contract = await db.prepare(
      'SELECT id, project_id, status FROM project_contracts WHERE contract_token = ?'
    ).bind(token).first() as { id: number; project_id: number; status: string } | null;

    if (!contract) return json({ error: 'Contract not found, check the link in your email.' }, 404);

    if (contract.status === 'draft') {
      return json({ error: 'This contract has not been sent yet. Please wait for MannyKnows to send it.' }, 409);
    }
    if (contract.status === 'void') {
      return json({ error: 'This contract has been voided. Please contact MannyKnows for a new one.' }, 409);
    }
    if (contract.status === 'signed' || contract.status === 'countersigned') {
      return json({ error: 'This contract has already been signed.' }, 409);
    }
    if (contract.status !== 'sent') {
      return json({ error: 'Contract is not available for signing right now.' }, 409);
    }

    // Audit-trail metadata.
    const ip = request.headers.get('CF-Connecting-IP')
      || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
      || null;
    const userAgent = request.headers.get('User-Agent') || null;

    // Save the signature first; only flip status if the insert succeeded
    // (otherwise we'd leave a 'signed' contract without an audit trail).
    const sigResult = await db.prepare(`
      INSERT INTO contract_signatures
        (project_contract_id, signer_role, signer_name, signature_data_url, consent_text, ip_address, user_agent)
      VALUES (?, 'customer', ?, ?, ?, ?, ?)
    `).bind(contract.id, signerName, sigDataUrl, consentText, ip, userAgent).run();

    if (!sigResult.meta?.last_row_id) {
      return json({ error: 'Failed to save signature' }, 500);
    }

    // Safety net: make sure the contractor signature is on this contract. It's
    // normally snapshotted from the singleton when the template is applied, but
    // a contract created BEFORE the contractor signature was set up would have
    // missed it. Snapshot it now so the executed contract shows both parties.
    try {
      const hasContractor = await db.prepare(
        "SELECT id FROM contract_signatures WHERE project_contract_id = ? AND signer_role = 'contractor'"
      ).bind(contract.id).first();
      if (!hasContractor) {
        const cs = await db.prepare(
          'SELECT signer_name, signature_data_url FROM contractor_signature WHERE id = 1'
        ).first() as { signer_name: string | null; signature_data_url: string | null } | null;
        if (cs?.signature_data_url) {
          await db.prepare(`
            INSERT INTO contract_signatures
              (project_contract_id, signer_role, signer_name, signature_data_url, consent_text)
            VALUES (?, 'contractor', ?, ?, ?)
          `).bind(contract.id, cs.signer_name || 'MannyKnows', cs.signature_data_url, 'Authorized representative of MannyKnows').run();
        }
      }
    } catch (e) {
      console.error('[contract/sign] contractor snapshot failed:', e);
    }

    // Reference answer (optional)
    const refUpdate = body.use_as_reference == null
      ? ''
      : `, use_as_reference = ${body.use_as_reference ? 1 : 0}`;

    await db.prepare(`
      UPDATE project_contracts
      SET status = 'signed',
          signed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
          ${refUpdate}
      WHERE id = ?
    `).bind(contract.id).run();

    console.log(`[contract/sign] Contract ${contract.id} signed by ${signerName} (project ${contract.project_id})`);

    // Alert admin (email + SMS). Additive + best-effort.
    try {
      const pinfo = await db.prepare('SELECT project_number, customer_name FROM projects WHERE id = ?').bind(contract.project_id).first() as any;
      await notifyAdmin(env, {
        subject: `Contract signed${pinfo?.project_number ? ` (${pinfo.project_number})` : ''}`,
        body: `${signerName || pinfo?.customer_name || 'Customer'} signed the contract.`,
        link: `/admin/projects?open=${contract.project_id}`,
      });
    } catch (e) { console.error('[contract/sign] admin notify failed:', e); }

    // Phase 6D — fire admin notification email. Best-effort: if Resend
    // fails, the signature is still saved + status is still flipped.
    try {
      const ctx = await db.prepare(`
        SELECT
          p.id AS project_id, p.project_number, p.customer_name, p.customer_email, p.partner_id,
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
              signer_name: signerName,
              signed_at: (ctx.signed_at as string | null) ?? undefined,
            },
            { RESEND_API_KEY: resendApiKey, NOTIFICATION_EMAIL: notificationEmail },
            isLocalhost
          );
        }

        // Customer confirmation — only needs Resend (not NOTIFICATION_EMAIL),
        // white-label aware, links straight to the signed contract.
        if (resendApiKey) {
          try {
            const origin = request.headers.get('origin') || '';
            const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
            const brand = await getBrand(db, ctx.partner_id);
            await sendContractSignedToCustomer(
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
                signer_name: signerName,
                signed_at: (ctx.signed_at as string | null) ?? undefined,
              },
              { RESEND_API_KEY: resendApiKey },
              isLocalhost,
              brand
            );
            console.log(`[contract/sign] customer confirmation sent for ${ctx.project_number}`);
          } catch (custErr) {
            console.error('[contract/sign] customer confirmation failed:', custErr);
          }
        }
      }
    } catch (err) {
      console.error('[contract/sign] admin notification failed:', err);
    }

    // `project_id` is returned so the customer-side signing page can kick
    // off the hidden-iframe autosave that generates the signed contract
    // PDF (mirrors the quote-acceptance signed-PDF flow).
    return json({ success: true, status: 'signed', project_id: contract.project_id });
  } catch (error) {
    console.error('[contract/sign] error:', error);
    return json({ error: 'Failed to sign contract' }, 500);
  }
};
