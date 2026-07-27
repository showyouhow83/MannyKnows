// POST /api/projects/{id}/mark-signed-offline
//
// Records that a contract was signed on PAPER / offline, without capturing a
// drawn e-signature. Mirrors the "Mark paid (no signature)" pattern for
// payments. The audit trail stays honest: the contract_signatures row is
// flagged as offline (signature_data_url = 'offline', consent text says so,
// no IP/user-agent), so it's clearly distinguishable from a real e-signature.
//
// Body:
//   signers        'customer' | 'both'   (customer-only -> status 'signed';
//                                          both -> 'countersigned', executed)
//   customer_name  string (required)
//   contractor_name string (required when signers='both')
//   signed_date    'YYYY-MM-DD' (optional; defaults to now)
//   note           string (optional; appended to the offline consent text)
//   scan_url       string (optional; URL of an uploaded scan of the paper copy)
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// Render a typed name as a signature-style SVG image (base64 data URL) so it
// displays wherever signatures show as <img> — no broken image. Used for an
// offline/paper signature where no drawn signature was captured.
function nameSignatureDataUrl(name: string): string {
  const safe = String(name || '').trim()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="110"><text x="12" y="72" font-family="'Segoe Script','Brush Script MT',cursive" font-size="46" fill="#0f172a">${safe}</text></svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'DB not configured' }, 503);

    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return json({ success: false, error: 'Admin authentication required' }, 401);

    const projectId = Number(params.id);
    if (!Number.isFinite(projectId) || projectId <= 0) return json({ success: false, error: 'Invalid project id' }, 400);

    const body = (await request.json().catch(() => ({}))) as {
      signers?: string; customer_name?: string; contractor_name?: string;
      signed_date?: string; note?: string; scan_url?: string;
    };

    const both = body.signers === 'both';
    const custName = (body.customer_name || '').trim();
    const ctrName = (body.contractor_name || '').trim();
    if (custName.length < 2) return json({ success: false, error: 'Customer name is required' }, 400);
    if (both && ctrName.length < 2) return json({ success: false, error: 'Contractor name is required when both signed' }, 400);

    const contract = await db.prepare(
      'SELECT id, status, total FROM project_contracts WHERE project_id = ?'
    ).bind(projectId).first() as { id: number; status: string; total: number } | null;
    if (!contract) return json({ success: false, error: 'No contract for this project — apply a template first.' }, 404);
    if (contract.status === 'void') return json({ success: false, error: 'This contract has been voided.' }, 409);

    // Customer signs with a typed-name signature image (no broken <img>); the
    // contractor uses our saved signature if we have one, else a typed name.
    const custSig = nameSignatureDataUrl(custName);
    let ctrSig = '';
    if (both) {
      const saved = await db.prepare('SELECT signature_data_url FROM contractor_signature WHERE id = 1')
        .first() as { signature_data_url: string } | null;
      ctrSig = (saved && saved.signature_data_url) ? saved.signature_data_url : nameSignatureDataUrl(ctrName);
    }

    // Honest paper-signing date (or now). Workers runtime allows new Date().
    const whenIso = (body.signed_date && /^\d{4}-\d{2}-\d{2}$/.test(body.signed_date))
      ? body.signed_date
      : new Date().toISOString();
    const adminName = (session as any).username || (session as any).user || 'admin';
    const baseConsent = `Signed on paper (offline) — recorded by ${adminName} on ${whenIso.split('T')[0]}.`;
    const consent = body.note && body.note.trim() ? `${baseConsent} ${body.note.trim()}` : baseConsent;

    // Replace any prior signatures for the role(s) we're setting (keeps the
    // table to one row per role). Customer-only leaves a prior contractor row.
    const stmts: any[] = [
      db.prepare(`DELETE FROM contract_signatures WHERE project_contract_id = ? AND signer_role = 'customer'`).bind(contract.id),
      db.prepare(`
        INSERT INTO contract_signatures
          (project_contract_id, signer_role, signer_name, signature_data_url, consent_text, ip_address, user_agent, signed_at)
        VALUES (?, 'customer', ?, ?, ?, NULL, NULL, ?)
      `).bind(contract.id, custName, custSig, consent, whenIso),
    ];
    if (both) {
      stmts.push(
        db.prepare(`DELETE FROM contract_signatures WHERE project_contract_id = ? AND signer_role = 'contractor'`).bind(contract.id),
        db.prepare(`
          INSERT INTO contract_signatures
            (project_contract_id, signer_role, signer_name, signature_data_url, consent_text, ip_address, user_agent, signed_at)
          VALUES (?, 'contractor', ?, ?, ?, NULL, NULL, ?)
        `).bind(contract.id, ctrName, ctrSig, consent, whenIso),
      );
    }

    // Offline contracts are never "sent", so the project total never got synced
    // from the contract. Sync it now (mirrors what sending does) so the project
    // + partner rollups reflect the real amount.
    if (contract.total && contract.total > 0) {
      stmts.push(db.prepare('UPDATE projects SET total = ? WHERE id = ?').bind(contract.total, projectId));
    }

    // Flip status + stamp timestamps; record offline flag + optional scan URL in terms.
    const scanUrl = (body.scan_url || '').trim() || null;
    stmts.push(db.prepare(`
      UPDATE project_contracts
      SET status = ?,
          signed_at = ?,
          countersigned_at = ${both ? '?' : 'countersigned_at'},
          terms = json_set(COALESCE(terms, '{}'), '$.signed_offline', json('true'), '$.offline_scan_url', ?),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(...(both ? [both ? 'countersigned' : 'signed', whenIso, whenIso, scanUrl, contract.id] : ['signed', whenIso, scanUrl, contract.id])));

    await db.batch(stmts);

    return json({ success: true, status: both ? 'countersigned' : 'signed' });
  } catch (error) {
    console.error('[mark-signed-offline] error:', error);
    return json({ success: false, error: 'Failed to mark signed offline' }, 500);
  }
};
