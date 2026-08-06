// Quote Attachments API
// POST   /api/quotes/{quoteId}/attachments  — upload a new PDF and link it
// GET    /api/quotes/{quoteId}/attachments  — list all attachments for a quote
//
// Admin only. Body for POST is the raw PDF bytes. Header X-Attachment-Label
// carries the customer-facing label (defaults to "Estimate").
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import { publicUrlForR2Path } from '../../../../lib/publicUrl';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_PER_QUOTE = 10;               // sanity cap; bump if it ever bites

export const GET: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return j({ success: false, error: 'Unauthorized' }, 401);
    }
    const db = env?.MK_APP_DB;
    if (!db) return j({ success: false, error: 'DB not configured' }, 503);

    const quoteId = parseInt(params.quoteId as string, 10);
    if (!quoteId) return j({ success: false, error: 'Invalid quote id' }, 400);

    const result = await db.prepare(`
      SELECT id, quote_id, label, file_url, file_name, file_size, uploaded_at, COALESCE(is_internal, 0) AS is_internal
        FROM quote_attachments
       WHERE quote_id = ?
       ORDER BY uploaded_at ASC, id ASC
    `).bind(quoteId).all();

    return j({ success: true, attachments: result.results || [] });
  } catch (e) {
    console.error('[QuoteAttachments] GET failed:', e);
    return j({ success: false, error: 'Failed to load attachments' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const bucket = env?.MK_MEDIA_BUCKET;
    if (!db || !bucket) return j({ success: false, error: 'Storage not configured' }, 503);

    const quoteId = parseInt(params.quoteId as string, 10);
    if (!quoteId) return j({ success: false, error: 'Invalid quote id' }, 400);

    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.startsWith('application/pdf')) {
      return j({ success: false, error: 'Only PDFs are allowed' }, 400);
    }

    // Look up the quote (need quote_number for the R2 path + quote_token
    // for the customer-side auth path).
    const quote = await db.prepare(
      `SELECT id, quote_number, quote_token FROM quotes WHERE id = ?`
    ).bind(quoteId).first() as { id: number; quote_number: string; quote_token: string | null } | null;
    if (!quote) return j({ success: false, error: 'Quote not found' }, 404);

    // Authorize: admin session OR `X-Quote-Token: <quote_token>` matching
    // this row. The token path lets the customer's browser (after they
    // sign on /quote/accept/[token]) upload a signed-PDF version without
    // needing admin auth.
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    const headerToken = (request.headers.get('X-Quote-Token') || '').trim();
    const tokenAuthorized = !!(headerToken && quote.quote_token && headerToken === quote.quote_token);
    if (!session.isAuthenticated && !tokenAuthorized) {
      return j({ success: false, error: 'Unauthorized' }, 401);
    }

    // Cap so a runaway script can't fill the bucket
    const countRow = await db.prepare(`SELECT COUNT(*) AS n FROM quote_attachments WHERE quote_id = ?`).bind(quoteId).first() as { n: number };
    if ((countRow?.n ?? 0) >= MAX_PER_QUOTE) {
      return j({ success: false, error: `Maximum ${MAX_PER_QUOTE} attachments per quote` }, 400);
    }

    const data = await request.arrayBuffer();
    if (!data || data.byteLength === 0) return j({ success: false, error: 'Empty file' }, 400);
    if (data.byteLength > MAX_FILE_SIZE) return j({ success: false, error: 'File too large (max 20MB)' }, 413);

    // Headers are URL-encoded client-side so unicode (em-dash etc.) can
    // round-trip through ISO-8859-1 HTTP header values. Try-decode and
    // fall back to the raw value if decode fails (older clients).
    function safeDecode(raw: string): string {
      try { return decodeURIComponent(raw); } catch { return raw; }
    }
    const labelRaw = request.headers.get('X-Attachment-Label') || 'Estimate';
    const label = safeDecode(labelRaw).trim().slice(0, 80) || 'Estimate';
    const filenameRaw = request.headers.get('X-Attachment-Filename') || 'estimate.pdf';
    const rawFileName = safeDecode(filenameRaw).trim();
    // Strip any path/illegal chars so we never end up with traversal
    const fileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'estimate.pdf';

    const timestamp = Date.now();
    const r2Path = `quotes/${quote.quote_number}/attachment_${timestamp}_${fileName}`;

    await bucket.put(r2Path, data, {
      httpMetadata: {
        contentType: 'application/pdf',
        contentDisposition: `inline; filename="${fileName}"`,
      },
      customMetadata: {
        quoteId: String(quote.id),
        quoteNumber: quote.quote_number,
        uploadedAt: new Date().toISOString(),
        label,
      },
    });

    const fileUrl = publicUrlForR2Path(r2Path, request);

    const inserted = await db.prepare(`
      INSERT INTO quote_attachments (quote_id, label, file_url, file_name, file_size)
      VALUES (?, ?, ?, ?, ?)
    `).bind(quoteId, label, fileUrl, fileName, data.byteLength).run();
    const insertedId = inserted.meta.last_row_id;

    // Replace semantics: any prior attachment on this quote with the same
    // label (e.g. resaving "Estimate", or "Estimate — Interior") is now
    // stale, so wipe it. AND when uploading a signed copy ("X — Signed"),
    // also wipe its unsigned counterpart ("X") — once the customer's
    // signature is on file the unsigned pre-acceptance PDF stops being
    // useful. Done AFTER the new row is in place so a half-failed delete
    // can't leave the quote attachment-less.
    const labelsToReplace = new Set<string>([label]);
    // Detect the "— Signed" / "- Signed" suffix (em-dash or hyphen,
    // optional surrounding whitespace) and add the base label to the
    // replacement set so the unsigned version is dropped alongside the
    // prior signed copy.
    const signedSuffix = /[\s]*[: -][\s]*signed\s*$/i;
    if (signedSuffix.test(label)) {
      const base = label.replace(signedSuffix, '').trim();
      if (base) labelsToReplace.add(base);
    }

    let replacedCount = 0;
    try {
      const placeholders = Array.from(labelsToReplace).map(() => '?').join(',');
      const stale = await db.prepare(`
        SELECT id, file_url FROM quote_attachments
        WHERE quote_id = ? AND label IN (${placeholders}) AND id != ?
      `).bind(quoteId, ...labelsToReplace, insertedId).all();
      const staleRows = (stale.results || []) as Array<{ id: number; file_url: string }>;
      for (const row of staleRows) {
        // Best-effort R2 delete, then drop the DB row. Mirrors the delete
        // path used by the dedicated /api/quotes/attachments/[id] DELETE.
        try {
          const oldR2Path = (row.file_url || '')
            .replace('https://images.mannyknows.com/', '')
            .replace(/^https?:\/\/[^/]+\/r2-local\//, '');
          if (oldR2Path && !oldR2Path.startsWith('http')) await bucket.delete(oldR2Path);
        } catch (delErr) {
          console.warn(`[QuoteAttachments] stale R2 delete failed (id=${row.id}):`, delErr);
        }
        await db.prepare('DELETE FROM quote_attachments WHERE id = ?').bind(row.id).run();
        replacedCount++;
      }
    } catch (replaceErr) {
      // Replacement failure shouldn't fail the upload — the new attachment
      // is already in the DB. Worst case: admin sees both old + new on the
      // PDFs tab and can delete the old one manually.
      console.warn('[QuoteAttachments] replace-by-label cleanup failed (continuing):', replaceErr);
    }

    console.log(`[QuoteAttachments] Quote ${quoteId} +1 attachment "${label}" (${data.byteLength} bytes)${replacedCount ? `: replaced ${replacedCount} prior` : ''}`);

    // If this quote was already promoted to a project, mirror the attachment
    // into project_documents so the project's Documents tab stays in sync
    // automatically — e.g. the "Estimate — Signed" PDF the customer's browser
    // generates a moment AFTER acceptance (which is after the project was
    // created). This is why no manual "sync" button is needed.
    try {
      const proj = await db.prepare(
        `SELECT id FROM projects WHERE quote_id = ? ORDER BY created_at DESC LIMIT 1`
      ).bind(quoteId).first() as { id: number } | null;
      if (proj) {
        const exists = await db.prepare(
          `SELECT id FROM project_documents WHERE project_id = ? AND file_url = ?`
        ).bind(proj.id, fileUrl).first();
        if (!exists) {
          await db.prepare(
            `INSERT INTO project_documents (project_id, label, file_url, file_name, file_size, source)
             VALUES (?, ?, ?, ?, ?, 'quote_promotion')`
          ).bind(proj.id, label, fileUrl, fileName, data.byteLength).run();
        }
        // Mirror the replace-by-label cleanup: drop stale project copies (e.g.
        // the promoted unsigned "Estimate" once "Estimate — Signed" arrives).
        const phl = Array.from(labelsToReplace).map(() => '?').join(',');
        await db.prepare(
          `DELETE FROM project_documents WHERE project_id = ? AND label IN (${phl}) AND file_url != ?`
        ).bind(proj.id, ...labelsToReplace, fileUrl).run();
      }
    } catch (mirrorErr) {
      console.warn('[QuoteAttachments] project_documents mirror failed (continuing):', mirrorErr);
    }

    return j({
      success: true,
      replaced: replacedCount,
      attachment: {
        id: insertedId,
        quote_id: quoteId,
        label,
        file_url: fileUrl,
        file_name: fileName,
        file_size: data.byteLength,
      },
    });
  } catch (e) {
    console.error('[QuoteAttachments] POST failed:', e);
    return j({ success: false, error: 'Upload failed' }, 500);
  }
};

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
