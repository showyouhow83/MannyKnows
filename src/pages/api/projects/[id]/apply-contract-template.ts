// POST /api/projects/[id]/apply-contract-template
//
// Creates (or replaces) a project_contracts row from a contract_templates
// row + the project's linked quote. The new contract:
//
//   1. Snapshots the template's scope sections AS-IS (admin can edit after).
//   2. Imports the accepted quote's scopes (template_sections JSON) and
//      appends them to the template's scope, so the customer-visible work
//      text matches what they agreed to in the quote. The admin can re-order
//      / prune in the editor.
//   3. Copies the template's payment-schedule defaults + terms.
//   4. Auto-generates the payment schedule from the project's total +
//      start_date + the down/monthly counts. Rows are unsigned at first.
//   5. Mints a contract_token for the customer signing page.
//
// Body params:
//   template_id (number, required)
//   start_date  (YYYY-MM-DD, optional — falls back to project.scheduled_start)
//   replace     (boolean, optional — when true, overwrites the existing
//                contract instead of refusing. Default false.)

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { generatePaymentSchedule } from '../../../../lib/paymentSchedule';
import { AdminAuth } from '../../../../lib/adminAuth';
import { parseScopes, type QuoteScope, sumSubtotals } from '../../../../lib/quoteTemplateConstants';

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

// Stamp every section + item with a fresh id so the cloned scope's ids
// don't collide with the source template's. Identical helper to the one in
// quotes/[id]/apply-template.ts.
function cloneSections(rawSections: unknown): any[] {
  if (!Array.isArray(rawSections)) return [];
  return rawSections.map((s: any) => ({
    ...s,
    id: freshId('s'),
    items: Array.isArray(s.items) ? s.items.map((it: any) => ({
      ...it,
      id: freshId('i'),
    })) : [],
  }));
}

// Build the resolved payment schedule from total + start_date + counts.
// Rules (per the sample contract):
//   • Down payments are split evenly across `down_payment_count` rows.
//   • Each down payment is dated at monthly increments starting at start_date
//     (or today if no start date) so the admin sees a sensible cadence.
//   • Monthly payments start the month AFTER the last down payment and run
//     for `monthly_payment_count` months.
//   • Final-row rounding error goes on the LAST monthly payment so the sum
//     equals the contract total exactly.

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const projectId = Number(params.id);
    if (!projectId || Number.isNaN(projectId)) return json({ error: 'project id is required' }, 400);

    const body = await request.json() as {
      template_id?: number;
      start_date?: string | null;
      replace?: boolean;
    };
    const templateId = Number(body?.template_id);
    if (!templateId || Number.isNaN(templateId)) return json({ error: 'template_id is required' }, 400);

    // Load the project + its quote (for scope import) + the contract template
    // in one round trip.
    const [project, template, existingContract] = await Promise.all([
      db.prepare(`
        SELECT p.id, p.total, p.scheduled_start, p.scheduled_end, p.quote_id,
               q.template_sections AS quote_scopes,
               q.discount AS quote_discount
        FROM projects p
        LEFT JOIN quotes q ON p.quote_id = q.id
        WHERE p.id = ?
      `).bind(projectId).first() as Promise<any>,
      db.prepare('SELECT * FROM contract_templates WHERE id = ?').bind(templateId).first() as Promise<any>,
      db.prepare('SELECT id, status FROM project_contracts WHERE project_id = ?').bind(projectId).first() as Promise<any>,
    ]);

    if (!project) return json({ error: 'Project not found' }, 404);
    if (!template) return json({ error: 'Contract template not found' }, 404);

    if (existingContract && !body.replace) {
      return json({
        error: 'A contract already exists for this project. Pass replace:true to overwrite.',
        existing_status: existingContract.status,
      }, 409);
    }

    // Build the merged scope. The template's scope sections become a single
    // "Contract scope" wrapping; the quote's scopes (the customer-agreed work
    // text) are appended after. Admin can re-order / prune in the editor.
    const templateSections = (() => {
      try { return JSON.parse(template.sections || '[]'); } catch { return []; }
    })();
    const quoteScopes: QuoteScope[] = parseScopes(project.quote_scopes);
    const contractScopes: QuoteScope[] = [];
    if (templateSections.length > 0) {
      contractScopes.push({
        id: freshId('scope'),
        title: template.name || 'Contract scope',
        template_id: templateId,
        sections: cloneSections(templateSections),
      });
    }
    for (const qs of quoteScopes) {
      contractScopes.push({
        id: freshId('scope'),
        title: qs.title || 'Quoted scope',
        template_id: qs.template_id ?? null,
        sections: cloneSections(qs.sections),
      });
    }

    // Total: prefer the project's existing total (which already came from the
    // accepted quote). Fall back to sum of imported scope subtotals when the
    // project's total is 0/missing.
    let total = Number(project.total) || 0;
    if (total <= 0) total = sumSubtotals(contractScopes);
    // Discount lives on the originating quote (quotes.discount). The
    // projects table doesn't carry one — it stores `total` only.
    const discount = Number(project.quote_discount) || 0;

    const startDate = body.start_date ?? (project.scheduled_start as string | null);

    // Resolved schedule defaults — straight copy from template, admin can
    // override later.
    const downPct = Number(template.down_payment_percent);
    const downCount = Number(template.down_payment_count);
    const monthlyCount = Number(template.monthly_payment_count);

    // New contracts default to the balance-on-completion plan (down payment
    // + remaining balance due on the project end date). Admin can switch to
    // monthly installments in the contract editor.
    const paymentSchedule = generatePaymentSchedule({
      total,
      downPct,
      downCount,
      monthlyCount,
      startDate: startDate as string | null,
      endDate: project.scheduled_end as string | null,
      plan: 'end_date',
    });

    const terms = (() => {
      try { return JSON.parse(template.terms || '{}'); } catch { return {}; }
    })();

    // Token for the customer-signing page. New contract always gets a new
    // token; if `replace` is true the old contract row's token is dropped.
    const contractToken = crypto.randomUUID();

    if (existingContract) {
      // Replace mode: delete the old contract (cascades signatures), then
      // re-insert with the same project_id.
      await db.prepare('DELETE FROM project_contracts WHERE id = ?').bind(existingContract.id).run();
    }

    const result = await db.prepare(`
      INSERT INTO project_contracts (
        project_id, contract_template_id,
        scopes, total, discount,
        down_payment_percent, down_payment_count, monthly_payment_count,
        cancellation_window_days, cancellation_fee_amount,
        late_fee_amount, late_fee_grace_days, warranty_months,
        payment_schedule, terms,
        start_date, contract_token, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).bind(
      projectId, templateId,
      JSON.stringify(contractScopes), total, discount,
      downPct, downCount, monthlyCount,
      Number(template.cancellation_window_days), Number(template.cancellation_fee_amount),
      Number(template.late_fee_amount), Number(template.late_fee_grace_days), Number(template.warranty_months),
      JSON.stringify(paymentSchedule), JSON.stringify(terms),
      startDate || null, contractToken
    ).run();

    const contractId = result.meta?.last_row_id ?? null;

    // Snapshot the contractor signature onto the brand-new contract so the
    // customer sees a document that's already signed on our end. The
    // singleton in `contractor_signature` is the live admin setting; once
    // copied to `contract_signatures`, this contract's contractor sig is
    // frozen even if admin later updates the singleton.
    if (contractId) {
      try {
        const contractorSig = await db.prepare(
          'SELECT signer_name, signature_data_url FROM contractor_signature WHERE id = 1'
        ).first() as { signer_name: string; signature_data_url: string } | null;
        if (contractorSig) {
          // Use the same consent boilerplate as the customer's so the audit
          // trail row reads consistently when rendered side-by-side.
          const consentText = 'Counter-signed by MannyKnows at the time this contract was prepared. This electronic signature is the legal equivalent of a manual handwritten signature.';
          await db.prepare(`
            INSERT INTO contract_signatures
              (project_contract_id, signer_role, signer_name, signature_data_url, consent_text)
            VALUES (?, 'contractor', ?, ?, ?)
          `).bind(contractId, contractorSig.signer_name, contractorSig.signature_data_url, consentText).run();
        }
      } catch (sigErr) {
        // Don't block contract creation if the signature snapshot fails.
        console.warn('[apply-contract-template] contractor signature snapshot failed:', sigErr);
      }
    }

    return json({
      success: true,
      contract_id: contractId,
      contract_token: contractToken,
    }, 201);
  } catch (error) {
    console.error('[projects/[id]/apply-contract-template] error:', error);
    return json({ error: 'Failed to apply contract template' }, 500);
  }
};
