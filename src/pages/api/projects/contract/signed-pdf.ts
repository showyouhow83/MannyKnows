// POST /api/projects/contract/signed-pdf
//
// Receives the signed-contract PDF generated client-side (inside a hidden
// iframe on /project/contract/[token] after the customer signs, or via the
// admin backfill button on the Contract tab) and:
//   1) writes the bytes to R2 under quotes/{quote_number}/contract_signed_<ts>.pdf
//      so it lives alongside the quote's attachments
//   2) sets project_contracts.signed_pdf_url to the public R2 URL
//
// Auth: admin session OR `X-Contract-Token: <project_contracts.contract_token>`
// matching the row. Customer browsers carry the token; admin browsers carry
// the session cookie. Either is sufficient.
//
// Body is the raw PDF bytes (Content-Type: application/pdf).

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import { publicUrlForR2Path } from '../../../../lib/publicUrl';

export const prerender = false;

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const bucket = env?.MK_MEDIA_BUCKET;
    if (!db || !bucket) return j({ success: false, error: 'Storage not configured' }, 503);

    // We accept the contract id (admin path) OR token (customer path) up
    // front so the same endpoint serves both flows.
    const url = new URL(request.url);
    const projectIdRaw = url.searchParams.get('project_id');
    const projectId = projectIdRaw ? parseInt(projectIdRaw, 10) : NaN;
    if (!projectId || Number.isNaN(projectId)) return j({ success: false, error: 'project_id required' }, 400);

    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.startsWith('application/pdf')) {
      return j({ success: false, error: 'Only PDFs are allowed' }, 400);
    }

    const contract = await db.prepare(`
      SELECT c.id, c.contract_token, p.project_number
      FROM project_contracts c
      INNER JOIN projects p ON p.id = c.project_id
      WHERE c.project_id = ?
    `).bind(projectId).first() as { id: number; contract_token: string | null; project_number: string } | null;
    if (!contract) return j({ success: false, error: 'Contract not found' }, 404);

    // Authorize: admin session OR `X-Contract-Token` matching this row.
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    const headerToken = (request.headers.get('X-Contract-Token') || '').trim();
    const tokenAuthorized = !!(headerToken && contract.contract_token && headerToken === contract.contract_token);
    if (!session.isAuthenticated && !tokenAuthorized) {
      return j({ success: false, error: 'Unauthorized' }, 401);
    }

    const data = await request.arrayBuffer();
    if (!data || data.byteLength === 0) return j({ success: false, error: 'Empty file' }, 400);
    if (data.byteLength > MAX_FILE_SIZE) return j({ success: false, error: 'File too large (max 20MB)' }, 413);

    // Path layout — keep contracts under their project number so the
    // bucket stays browsable: `contracts/<project_number>/signed_<ts>.pdf`.
    const timestamp = Date.now();
    const fileName = `signed_${timestamp}.pdf`;
    const r2Path = `contracts/${contract.project_number}/${fileName}`;

    await bucket.put(r2Path, data, {
      httpMetadata: {
        contentType: 'application/pdf',
        contentDisposition: `inline; filename="contract-${contract.project_number}-signed.pdf"`,
      },
      customMetadata: {
        projectId: String(projectId),
        contractId: String(contract.id),
        projectNumber: contract.project_number,
        uploadedAt: new Date().toISOString(),
      },
    });

    const fileUrl = publicUrlForR2Path(r2Path, request);

    await db.prepare(`
      UPDATE project_contracts
      SET signed_pdf_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(fileUrl, contract.id).run();

    console.log(`[contract/signed-pdf] project ${projectId} signed PDF saved (${data.byteLength} bytes) → ${fileUrl}`);

    return j({ success: true, signed_pdf_url: fileUrl });
  } catch (e) {
    console.error('[contract/signed-pdf] POST failed:', e);
    return j({ success: false, error: 'Upload failed' }, 500);
  }
};
