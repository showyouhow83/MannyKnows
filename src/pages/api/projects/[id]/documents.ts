// Project Documents API
// GET   /api/projects/{id}/documents  — list a project's documents
// POST  /api/projects/{id}/documents  — upload a PDF (Content-Type: application/pdf)
//                                        OR sync from the originating quote
//                                        (Content-Type: application/json {action:'sync'})
//
// Admin only. Mirrors the quote-attachments endpoint. Documents are owned by
// the project: 'admin' docs are uploaded here; 'quote_promotion' docs are
// copied from the quote at promotion time (and can be re-synced).
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import { publicUrlForR2Path } from '../../../../lib/publicUrl';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_PER_PROJECT = 20;

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const GET: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return j({ success: false, error: 'Unauthorized' }, 401);
    const db = env?.MK_APP_DB;
    if (!db) return j({ success: false, error: 'DB not configured' }, 503);

    const projectId = parseInt(params.id as string, 10);
    if (!projectId) return j({ success: false, error: 'Invalid project id' }, 400);

    const result = await db.prepare(`
      SELECT id, project_id, label, file_url, file_name, file_size, source, uploaded_at
        FROM project_documents
       WHERE project_id = ?
       ORDER BY uploaded_at ASC, id ASC
    `).bind(projectId).all();

    // Also surface the structured contract (lives in project_contracts, not
    // project_documents) so the admin has it handy next to the estimate.
    // Prefer the LIVE preview page — it always reflects the current
    // signatures (incl. the contractor's countersignature), same as the
    // client portal. Fall back to the static signed-PDF snapshot.
    let contract: any = null;
    try {
      const c = await db.prepare(`
        SELECT contract_token, status, signed_pdf_url, signed_at
          FROM project_contracts
         WHERE project_id = ? AND status != 'void'
         ORDER BY id DESC LIMIT 1
      `).bind(projectId).first() as any;
      if (c && ['sent', 'signed', 'countersigned'].includes(String(c.status))) {
        const signed = c.status === 'signed' || c.status === 'countersigned';
        const url = c.contract_token
          ? `/project/contract-preview/${c.contract_token}/`
          : (c.signed_pdf_url || null);
        if (url) {
          contract = {
            label: signed ? 'Contract — Signed' : 'Contract — Awaiting signature',
            url,
            status: c.status,
            signed: signed,
            signed_at: c.signed_at || null,
          };
        }
      }
    } catch (e) {
      console.warn('[ProjectDocuments] contract lookup failed (continuing):', e);
    }

    return j({ success: true, documents: result.results || [], contract });
  } catch (e) {
    console.error('[ProjectDocuments] GET failed:', e);
    return j({ success: false, error: 'Failed to load documents' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    const bucket = env?.MK_MEDIA_BUCKET;
    if (!db) return j({ success: false, error: 'DB not configured' }, 503);

    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return j({ success: false, error: 'Unauthorized' }, 401);

    const projectId = parseInt(params.id as string, 10);
    if (!projectId) return j({ success: false, error: 'Invalid project id' }, 400);

    const project = await db.prepare(
      `SELECT id, project_number, quote_id FROM projects WHERE id = ?`
    ).bind(projectId).first() as { id: number; project_number: string; quote_id: number | null } | null;
    if (!project) return j({ success: false, error: 'Project not found' }, 404);

    // ── Upload a new PDF owned by the project ────────────────────────────────
    const contentType = request.headers.get('Content-Type') || '';
    if (!bucket) return j({ success: false, error: 'Storage not configured' }, 503);
    if (!contentType.startsWith('application/pdf')) {
      return j({ success: false, error: 'Only PDFs are allowed' }, 400);
    }

    const countRow = await db.prepare(`SELECT COUNT(*) AS n FROM project_documents WHERE project_id = ?`).bind(projectId).first() as { n: number };
    if ((countRow?.n ?? 0) >= MAX_PER_PROJECT) {
      return j({ success: false, error: `Maximum ${MAX_PER_PROJECT} documents per project` }, 400);
    }

    const data = await request.arrayBuffer();
    if (!data || data.byteLength === 0) return j({ success: false, error: 'Empty file' }, 400);
    if (data.byteLength > MAX_FILE_SIZE) return j({ success: false, error: 'File too large (max 20MB)' }, 413);

    function safeDecode(raw: string): string {
      try { return decodeURIComponent(raw); } catch { return raw; }
    }
    const labelRaw = request.headers.get('X-Document-Label') || 'Document';
    const label = safeDecode(labelRaw).trim().slice(0, 80) || 'Document';
    const filenameRaw = request.headers.get('X-Document-Filename') || 'document.pdf';
    const rawFileName = safeDecode(filenameRaw).trim();
    const fileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'document.pdf';

    const timestamp = Date.now();
    const r2Path = `projects/${project.project_number}/document_${timestamp}_${fileName}`;

    await bucket.put(r2Path, data, {
      httpMetadata: { contentType: 'application/pdf', contentDisposition: `inline; filename="${fileName}"` },
      customMetadata: { projectId: String(project.id), projectNumber: project.project_number, uploadedAt: new Date().toISOString(), label },
    });

    const fileUrl = publicUrlForR2Path(r2Path, request);

    const inserted = await db.prepare(`
      INSERT INTO project_documents (project_id, label, file_url, file_name, file_size, source)
      VALUES (?, ?, ?, ?, ?, 'admin')
    `).bind(projectId, label, fileUrl, fileName, data.byteLength).run();

    console.log(`[ProjectDocuments] Project ${projectId} +1 document "${label}" (${data.byteLength} bytes)`);

    return j({
      success: true,
      document: {
        id: inserted.meta.last_row_id,
        project_id: projectId,
        label, file_url: fileUrl, file_name: fileName, file_size: data.byteLength,
        source: 'admin',
      },
    });
  } catch (e) {
    console.error('[ProjectDocuments] POST failed:', e);
    return j({ success: false, error: 'Upload failed' }, 500);
  }
};
