// GET /api/projects/[id]/contract — fetch the project's contract (if any).
// PATCH /api/projects/[id]/contract — update fields (scopes, schedule, terms…).
// DELETE — void/clear it.
//
// POST is handled by the sibling endpoint apply-contract-template (which
// creates a contract row from a template, mirroring the quote flow).
//
// project_contracts is 1:1 with projects (UNIQUE constraint on project_id),
// so the project id alone is enough to identify a contract.

import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import { sendContractToCustomer } from '../../../../lib/contract-emails';
import { getBrand } from '../../../../lib/brand';

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

function clampNumber(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

export const GET: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const projectId = Number(params.id);
    if (!projectId || Number.isNaN(projectId)) return json({ error: 'project id is required' }, 400);

    const row = await db.prepare(
      'SELECT * FROM project_contracts WHERE project_id = ?'
    ).bind(projectId).first() as any;
    if (!row) return json({ success: true, contract: null });

    // Hydrate JSON columns so the client gets real arrays/objects.
    try { row.scopes = JSON.parse(row.scopes); } catch { row.scopes = []; }
    try { row.payment_schedule = JSON.parse(row.payment_schedule); } catch { row.payment_schedule = []; }
    try { row.terms = JSON.parse(row.terms); } catch { row.terms = {}; }

    // Include signature counts so the UI can show "signed by customer" etc.
    const sigs = await db.prepare(
      'SELECT id, signer_role, signer_name, signed_at FROM contract_signatures WHERE project_contract_id = ? ORDER BY signed_at ASC'
    ).bind(row.id).all();

    // Per-payment receipts (collected disbursements). The editor uses these to
    // mark rows as paid/locked; the signature data URLs are heavy so they're
    // only pulled here (not in the list view). Tolerant of a not-yet-migrated
    // table so the editor still loads if the deploy lands before v72.
    let receipts: { results?: unknown[] } = { results: [] };
    try {
      receipts = await db.prepare(
        `SELECT row_id, row_label, row_kind, amount, payment_method, check_number,
                customer_name, contractor_name, collected_at
         FROM payment_receipts WHERE project_contract_id = ? ORDER BY created_at ASC`
      ).bind(row.id).all();
    } catch (e) {
      console.error('[contract GET] payment_receipts query failed (table missing?):', e);
    }

    // The project's scheduled dates (from the Details tab) — the editor uses
    // scheduled_start to pre-fill the contract start date when it's blank.
    const proj = await db.prepare(
      'SELECT scheduled_start, scheduled_end, total AS project_total FROM projects WHERE id = ?'
    ).bind(projectId).first() as { scheduled_start: string | null; scheduled_end: string | null; project_total: number | null } | null;

    // Customer-submitted availability per payment row (soft preference).
    let availability: { results?: unknown[] } = { results: [] };
    try {
      availability = await db.prepare(
        'SELECT row_id, available_date, available_time, note FROM payment_availability WHERE project_contract_id = ?'
      ).bind(row.id).all();
    } catch (e) {
      console.error('[contract GET] payment_availability query failed (table missing?):', e);
    }

    // Invoice send-log per payment row (latest send per row → "Invoiced {date}").
    let invoices: { results?: unknown[] } = { results: [] };
    try {
      invoices = await db.prepare(
        'SELECT row_id, MAX(sent_at) AS sent_at, COUNT(*) AS send_count FROM payment_invoices WHERE project_contract_id = ? GROUP BY row_id'
      ).bind(row.id).all();
    } catch (e) {
      console.error('[contract GET] payment_invoices query failed (table missing?):', e);
    }

    return json({
      success: true,
      contract: row,
      signatures: sigs.results || [],
      receipts: receipts.results || [],
      availability: availability.results || [],
      invoices: invoices.results || [],
      project_scheduled_start: proj?.scheduled_start ?? null,
      project_scheduled_end: proj?.scheduled_end ?? null,
      project_total: proj?.project_total ?? null,
    });
  } catch (error) {
    console.error('[projects/[id]/contract] GET error:', error);
    return json({ error: 'Failed to load contract' }, 500);
  }
};

export const PATCH: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const projectId = Number(params.id);
    if (!projectId || Number.isNaN(projectId)) return json({ error: 'project id is required' }, 400);

    const existing = await db.prepare(
      'SELECT * FROM project_contracts WHERE project_id = ?'
    ).bind(projectId).first() as any;
    if (!existing) return json({ error: 'Contract not found — apply a template first' }, 404);

    const body = await request.json() as Record<string, unknown>;

    const safeParse = (raw: unknown, fallback: any) => {
      try { return JSON.parse((raw as string) || ''); } catch { return fallback; }
    };
    // A scope "structure signature" that excludes the fill-in fields (value +
    // finish). Two contracts with the same signature differ only in what the
    // customer/admin filled into color/dropdown fields — NOT in the agreed
    // terms, prices, scope text, or structure.
    const structSig = (scopes: any[]): string => JSON.stringify((scopes || []).map((sc: any) => ({
      id: sc.id, title: sc.title, template_id: sc.template_id,
      sections: (sc.sections || []).map((se: any) => ({
        id: se.id, title: se.title,
        items: (se.items || []).map((it: any) => ({
          id: it.id, type: it.type, label: it.label, text: it.text, amount: it.amount, options: it.options,
        })),
      })),
    })));
    // Human-readable list of what changed on a signed contract — emailed to the
    // customer so they know exactly what was updated (no re-sign required).
    const money = (n: unknown) => '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // Numeric fields. `material: true` ones (price, payment plan, legal terms)
    // alter the agreement → re-sign territory. The rest are informational.
    const NUM_FIELD_LABELS: Record<string, { label: string; money?: boolean; material?: boolean }> = {
      total: { label: 'Total', money: true, material: true }, discount: { label: 'Discount', money: true, material: true },
      down_payment_percent: { label: 'Down payment %', material: true }, down_payment_count: { label: 'Number of down payments', material: true },
      monthly_payment_count: { label: 'Number of monthly payments', material: true },
      cancellation_window_days: { label: 'Cancellation window (days)', material: true }, cancellation_fee_amount: { label: 'Cancellation fee', money: true, material: true },
      late_fee_amount: { label: 'Late fee', money: true, material: true }, late_fee_grace_days: { label: 'Late-fee grace (days)', material: true },
      warranty_months: { label: 'Warranty (months)', material: true },
    };
    // Splits the diff into MATERIAL changes (price/scope/payment/terms — these
    // change what was agreed, so a re-sign is warranted) and COSMETIC changes
    // (filling in colors/finishes, a schedule date) which never need a re-sign.
    function buildChangeSummary(): { material: string[]; cosmetic: string[] } {
      const material: string[] = [];
      const cosmetic: string[] = [];
      for (const [f, meta] of Object.entries(NUM_FIELD_LABELS)) {
        if (body[f] !== undefined && Number(body[f]) !== Number(existing[f] ?? 0)) {
          const o = existing[f] ?? 0;
          const line = `${meta.label}: ${meta.money ? money(o) : o} → ${meta.money ? money(body[f]) : body[f]}`;
          (meta.material ? material : cosmetic).push(line);
        }
      }
      // Start date is a schedule detail (weather clause already covers slippage)
      // — treat as cosmetic so a date nudge doesn't drag the customer back.
      if (body.start_date !== undefined) {
        const a = body.start_date ? String(body.start_date).trim() : '';
        const b = existing.start_date ? String(existing.start_date).trim() : '';
        if (a !== b) cosmetic.push(`Start date: ${b || '—'} → ${a || '—'}`);
      }
      if (body.payment_schedule !== undefined &&
          JSON.stringify(body.payment_schedule) !== JSON.stringify(safeParse(existing.payment_schedule, []))) material.push('Payment schedule updated');
      if (body.terms !== undefined &&
          JSON.stringify(body.terms) !== JSON.stringify(safeParse(existing.terms, {}))) material.push('Terms updated');
      if (body.scopes !== undefined && Array.isArray(body.scopes)) {
        const oldScopes = safeParse(existing.scopes, []);
        const oldItems: Record<string, any> = {};
        for (const sc of oldScopes) for (const se of (sc.sections || [])) for (const it of (se.items || [])) oldItems[it.id] = it;
        for (const sc of body.scopes as any[]) for (const se of (sc.sections || [])) for (const it of (se.items || [])) {
          const o = oldItems[it.id];
          if (!o) continue;
          // value/finish are the fill-in fields → cosmetic.
          if ((it.value || '') !== (o.value || '')) cosmetic.push(`${it.label || it.text || 'Field'}: ${o.value || '—'} → ${it.value || '—'}`);
          else if ((it.finish || '') !== (o.finish || '')) cosmetic.push(`${it.label || 'Field'} finish: ${o.finish || '—'} → ${it.finish || '—'}`);
        }
        // Added/removed/reworded scope items or changed prices → material.
        if (structSig(body.scopes) !== structSig(oldScopes)) material.push('Scope of work updated');
      }
      return { material, cosmetic };
    }

    // Editing a SIGNED contract:
    //   • cosmetic-only change  → apply, KEEP signature, email the customer the changes
    //   • material change       → needs an admin decision:
    //       - default (confirmResign:true) → clear signatures + revert to draft so the
    //         customer re-signs (one tap with re-use-signature)
    //       - override (skipResign:true)   → apply, KEEP signature, email the changes
    //   • amend:true (manual "Amend & re-sign" button) → always clears + drafts
    // With neither confirmResign nor skipResign set on a material change, we
    // return 409 `resign_required` so the client can prompt.
    const isSigned = existing.status === 'signed' || existing.status === 'countersigned';
    const isAmend = body.amend === true;
    let signedEditSummary: string[] = [];
    let willResign = false;
    if (isSigned && !isAmend) {
      const ignore = new Set(['status', 'amend', 'confirmResign', 'skipResign']);
      const contentKeys = Object.keys(body).filter(k => !ignore.has(k));
      if (contentKeys.length > 0) {
        const { material, cosmetic } = buildChangeSummary();
        if (material.length > 0 && !body.confirmResign && !body.skipResign) {
          // Hand the decision back to the admin (smart-default prompt).
          return json({ success: false, code: 'resign_required', material, cosmetic }, 409);
        }
        if (material.length > 0 && body.confirmResign === true) {
          willResign = true; // cleared below, same path as a manual amend
        } else {
          // cosmetic-only, or material with skipResign → keep signature + notify
          signedEditSummary = [...material, ...cosmetic];
        }
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    // Reset the executed signatures + PDF. Two flavours:
    //   • willResign (the "Require re-signature" prompt choice) → apply the edit
    //     and bounce straight to 'sent' + email the customer to re-sign now.
    //   • isAmend (the manual "Amend & re-sign" button) → drop to 'draft' so the
    //     admin can keep editing and send when ready.
    // The signed PDF in R2 is left in place (harmless orphan); only the DB
    // pointer is cleared.
    const resetSignatures = isSigned && (isAmend || willResign);
    if (resetSignatures) {
      await db.prepare('DELETE FROM contract_signatures WHERE project_contract_id = ?').bind(existing.id).run();
      updates.push('signed_pdf_url = NULL');
      updates.push('signed_at = NULL');
      updates.push('countersigned_at = NULL');
      if (willResign) {
        updates.push("status = 'sent'");
        updates.push('sent_at = CURRENT_TIMESTAMP');
      } else {
        updates.push("status = 'draft'");
      }
    }

    // JSON columns
    let scopeStructChanged = false;
    if (body.scopes !== undefined) {
      if (!Array.isArray(body.scopes)) return json({ error: 'scopes must be an array' }, 400);
      // A structural scope change reopens the customer's finalized colors.
      scopeStructChanged = structSig(body.scopes) !== structSig(safeParse(existing.scopes, []));
      updates.push('scopes = ?'); values.push(JSON.stringify(body.scopes));
    }
    if (body.payment_schedule !== undefined) {
      if (!Array.isArray(body.payment_schedule)) return json({ error: 'payment_schedule must be an array' }, 400);
      updates.push('payment_schedule = ?'); values.push(JSON.stringify(body.payment_schedule));
    }
    if (body.terms !== undefined) {
      updates.push('terms = ?'); values.push(JSON.stringify(body.terms));
    }

    // Plain text/numeric
    if (body.start_date !== undefined) {
      const sd = body.start_date ? String(body.start_date).trim() : null;
      updates.push('start_date = ?'); values.push(sd);
    }
    if (body.use_as_reference !== undefined) {
      // null / 0 / 1 — admin or customer can set this
      const v = body.use_as_reference;
      const stored = v === null || v === undefined ? null : (v === 1 || v === '1' || v === true ? 1 : 0);
      updates.push('use_as_reference = ?'); values.push(stored);
    }

    // Numeric overrides — same bounds as the template endpoint
    const numericFields: Array<[string, number, number]> = [
      ['total', 0, 10_000_000],
      ['discount', 0, 10_000_000],
      ['down_payment_percent', 0, 100],
      ['down_payment_count', 0, 12],
      ['monthly_payment_count', 0, 60],
      ['cancellation_window_days', 0, 30],
      ['cancellation_fee_amount', 0, 100000],
      ['late_fee_amount', 0, 10000],
      ['late_fee_grace_days', 0, 30],
      ['warranty_months', 0, 240],
    ];
    for (const [field, min, max] of numericFields) {
      if (body[field] !== undefined) {
        const v = clampNumber(body[field], min, max);
        if (v === null) return json({ error: `${field} out of range (${min}–${max})` }, 400);
        updates.push(`${field} = ?`); values.push(v);
      }
    }

    // Status: limited to admin-driven transitions. Customer-driven (sign)
    // goes through a separate endpoint. Skipped during an amend reset
    // (which already forced status='draft' above).
    if (body.status !== undefined && !resetSignatures) {
      const s = String(body.status).trim();
      if (!['draft', 'sent', 'void'].includes(s)) {
        return json({ error: 'status must be one of: draft, sent, void' }, 400);
      }
      // Sending requires a start_date (estimate is fine — admin should
      // pick a target; weather slip is covered by the weather clause).
      // Resolution order: incoming PATCH body → contract row → project's
      // scheduled_start (set on the Details tab). If we fall back to the
      // project date, we also copy it into the contract row in this same
      // UPDATE so subsequent renders + emails show it consistently.
      if (s === 'sent') {
        const incomingStart = typeof body.start_date === 'string' ? body.start_date.trim() : null;
        let effectiveStart: string | null = incomingStart || existing.start_date;
        if (!effectiveStart) {
          const proj = await db.prepare(
            'SELECT scheduled_start FROM projects WHERE id = ?'
          ).bind(projectId).first() as { scheduled_start: string | null } | null;
          const schedStart = proj?.scheduled_start ? String(proj.scheduled_start).trim() : null;
          if (schedStart) {
            effectiveStart = schedStart;
            // Sync the contract row so the customer email + signing page
            // both show the same date. Append-only — admin can still edit
            // start_date later through the contract editor.
            if (body.start_date === undefined) {
              updates.push('start_date = ?');
              values.push(schedStart);
            }
          }
        }
        if (!effectiveStart) {
          return json({
            error: 'A target start date is required before sending. Set it on the project Details tab (or in the contract editor) — weather variance is already covered by the weather clause.',
          }, 400);
        }
      }
      updates.push('status = ?'); values.push(s);
      if (s === 'void') updates.push('voided_at = CURRENT_TIMESTAMP');
      // Only stamp sent_at on the first transition to 'sent' (preserves the
      // original send timestamp on subsequent re-sends).
      if (s === 'sent' && existing.status !== 'sent') {
        updates.push('sent_at = CURRENT_TIMESTAMP');
      }
    }

    if (!updates.length) return json({ error: 'Nothing to update' }, 400);

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(existing.id);

    await db.prepare(`
      UPDATE project_contracts
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    // A scope update reopens the customer's finalized colors so they can adjust
    // them to the new scope. Best-effort — never blocks the contract save.
    if (scopeStructChanged) {
      try {
        await db.prepare('UPDATE projects SET colors_locked = 0 WHERE id = ?').bind(projectId).run();
      } catch (e) {
        console.error('[contract PATCH] colors unlock failed:', e);
      }
    }

    // Keep projects.total in sync with contract.total so the projects list
    // shows a non-zero price for projects created without a quote.
    if (body.total !== undefined) {
      const contractTotal = clampNumber(body.total, 0, 10_000_000);
      if (contractTotal !== null && contractTotal > 0) {
        await db.prepare(
          'UPDATE projects SET total = ? WHERE id = ?'
        ).bind(contractTotal, projectId).run();
      }
    }

    // Signed-contract edit: apply it, keep the signature, and email the
    // customer the EXACT list of what changed (no re-sign needed). Best-effort.
    if (signedEditSummary.length > 0) {
      try {
        const apiKey = env?.RESEND_API_KEY;
        const ctx = await db.prepare(
          'SELECT p.project_number, p.customer_name, p.customer_email, c.contract_token FROM project_contracts c INNER JOIN projects p ON p.id = c.project_id WHERE c.id = ?'
        ).bind(existing.id).first() as any;
        if (apiKey && ctx?.customer_email) {
          const { Resend } = await import('resend');
          const resend = new Resend(apiKey);
          const origin = new URL(request.url).origin;
          const link = ctx.contract_token ? `${origin}/project/contract/${ctx.contract_token}` : origin;
          const firstName = (ctx.customer_name || '').split(' ')[0] || 'there';
          const escHtml = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const list = signedEditSummary.map(c => `<li style="margin:4px 0;">${escHtml(c)}</li>`).join('');
          await resend.emails.send({
            from: 'MannyKnows <contracts@send.mannyknows.com>',
            to: ctx.customer_email,
            subject: `Update to your contract — ${ctx.project_number}`,
            html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b;">
              <h2 style="margin:0 0 12px;">We updated your contract</h2>
              <p style="font-size:15px;color:#475569;line-height:1.6;">Hi ${escHtml(firstName)}, we made the following change(s) to your contract for <strong>${escHtml(ctx.project_number)}</strong>. Your signature stays in place — no need to sign again.</p>
              <ul style="font-size:15px;color:#1e293b;line-height:1.6;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 14px 14px 30px;">${list}</ul>
              <p style="font-size:14px;color:#475569;">If anything looks off, just reply to this email or call us.</p>
              <p style="font-size:14px;"><a href="${link}" style="color:#2563eb;">View your contract →</a></p>
            </div>`,
          });
        }
      } catch (e) {
        console.error('[contract PATCH] change notification failed:', e);
      }
    }

    // Phase 6D — if this PATCH transitioned status to 'sent' (and wasn't
    // already there), fire the customer email. Loaded async after the DB
    // update so a Resend failure doesn't block the status flip.
    let emailSent = false;
    let emailError: string | undefined;
    // Fire the customer email when the admin explicitly sends/resends
    // (send_email flag), the auto re-send from "Require re-signature", OR the
    // first transition to 'sent'. Resends matter: the contract is already
    // 'sent', so the old `existing.status !== 'sent'` guard silently skipped
    // the email and surfaced as "email failed: unknown".
    const wantsEmail = body.send_email === true || willResign
      || (body.status === 'sent' && existing.status !== 'sent');
    if (wantsEmail) {
      try {
        const ctx = await db.prepare(`
          SELECT
            p.id AS project_id, p.project_number, p.customer_name, p.customer_email,
            c.contract_token, c.total, c.start_date,
            c.down_payment_percent, c.down_payment_count, c.monthly_payment_count, c.warranty_months,
            c.payment_schedule
          FROM project_contracts c
          INNER JOIN projects p ON p.id = c.project_id
          WHERE c.id = ?
        `).bind(existing.id).first() as any;
        if (!ctx?.customer_email) {
          emailError = 'No customer_email on the project — share the signing link manually.';
        } else {
          const resendApiKey = env?.RESEND_API_KEY;
          const notificationEmail = env?.NOTIFICATION_EMAIL;
          const origin = request.headers.get('origin') || '';
          const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
          // Derive an accurate plan summary from the real schedule rows.
          let paySummary: string | undefined;
          try {
            const sched = JSON.parse(ctx.payment_schedule || '[]') as Array<{ kind?: string }>;
            const dpPct = Number(ctx.down_payment_percent) || 0;
            const dpCount = Number(ctx.down_payment_count) || 0;
            const monthly = sched.filter(r => r && r.kind === 'monthly').length;
            paySummary = monthly > 0
              ? `${dpPct}% down × ${dpCount} + ${monthly} monthly`
              : `${dpPct}% down × ${dpCount}, balance on completion`;
          } catch { /* fall back to count-based summary */ }
          // White-label: brand the contract email if the project has a partner.
          const projPartner = await db.prepare('SELECT partner_id FROM projects WHERE id = ?')
            .bind(ctx.project_id).first() as { partner_id?: number | null } | null;
          const brand = await getBrand(db, projPartner?.partner_id);
          const result = await sendContractToCustomer(
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
              payment_summary: paySummary,
              warranty_months: Number(ctx.warranty_months) || 0,
            },
            { RESEND_API_KEY: resendApiKey, NOTIFICATION_EMAIL: notificationEmail || '' },
            isLocalhost,
            brand
          );
          emailSent = result.success;
          emailError = result.error;
        }
      } catch (err) {
        emailError = err instanceof Error ? err.message : 'Unknown error';
        console.error('[projects/[id]/contract] email send failed:', emailError);
      }
    }

    return json({ success: true, emailSent, emailError, amended: resetSignatures, resent: willResign, notifiedChanges: signedEditSummary });
  } catch (error) {
    console.error('[projects/[id]/contract] PATCH error:', error);
    return json({ error: 'Failed to update contract' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const projectId = Number(params.id);
    if (!projectId || Number.isNaN(projectId)) return json({ error: 'project id is required' }, 400);

    // Drop the contract entirely — admin will likely re-apply a template.
    // Signatures cascade-delete via the foreign key.
    const result = await db.prepare(
      'DELETE FROM project_contracts WHERE project_id = ?'
    ).bind(projectId).run();
    if (!result.meta?.changes) return json({ error: 'Contract not found' }, 404);

    return json({ success: true });
  } catch (error) {
    console.error('[projects/[id]/contract] DELETE error:', error);
    return json({ error: 'Failed to delete contract' }, 500);
  }
};
