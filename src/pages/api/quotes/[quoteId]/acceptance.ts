// Quote Acceptance Audit API
// GET /api/quotes/{quoteId}/acceptance — admin-only. Returns the acceptance
// audit row recorded when the customer accepted the quote (button OR signature
// flow): who, when, IP, device, consent, and whether a drawn signature exists.
//
// Both accept paths write a quote_signatures row (see /api/quotes/respond.ts),
// so this is the single source of truth for "how was this quote accepted".
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

export const GET: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return j({ success: false, error: 'Unauthorized' }, 401);

    const db = env?.MK_APP_DB;
    if (!db) return j({ success: false, error: 'DB not configured' }, 503);

    const quoteId = parseInt(params.quoteId as string, 10);
    if (!quoteId) return j({ success: false, error: 'Invalid quote id' }, 400);

    const sig = await db.prepare(`
      SELECT signer_name, signature_data_url, consent_text, ip_address, user_agent, signed_at
        FROM quote_signatures WHERE quote_id = ? LIMIT 1
    `).bind(quoteId).first() as {
      signer_name: string | null; signature_data_url: string | null;
      consent_text: string | null; ip_address: string | null;
      user_agent: string | null; signed_at: string | null;
    } | null;

    const q = await db.prepare(
      `SELECT status, responded_at, promoted_by FROM quotes WHERE id = ?`
    ).bind(quoteId).first() as { status: string | null; responded_at: string | null; promoted_by: string | null } | null;

    if (!sig) return j({ success: true, acceptance: null, status: q?.status || null });

    return j({
      success: true,
      status: q?.status || null,
      acceptance: {
        signer_name: sig.signer_name || null,
        // A real drawn signature is a long data URL; the button flow stores ''.
        has_signature: !!(sig.signature_data_url && sig.signature_data_url.length > 20),
        consent_text: sig.consent_text || null,
        ip_address: sig.ip_address || null,
        user_agent: sig.user_agent || null,
        signed_at: sig.signed_at || q?.responded_at || null,
        accepted_by_customer: (q?.promoted_by || '') === 'customer',
      },
    });
  } catch (e) {
    console.error('[QuoteAcceptance] GET failed:', e);
    return j({ success: false, error: 'Failed to load acceptance' }, 500);
  }
};

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
