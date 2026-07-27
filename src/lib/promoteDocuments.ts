// Copy a quote's PDF attachments into project_documents when the quote is
// promoted to a project (by customer acceptance OR admin promotion).
//
// The project then owns its own manageable copies — add more, or remove the
// promoted ones — without mutating the originating quote. file_url is shared
// with the quote copy (no R2 re-upload); see v91-project-documents.sql.
//
// Idempotent: skips any (project_id, file_url) already present, so it's safe to
// call again (e.g. after a signed PDF is generated post-promotion).
export async function promoteQuoteDocuments(
  db: any,
  quoteId: number | null | undefined,
  projectId: number | null | undefined
): Promise<number> {
  if (!db || !quoteId || !projectId) return 0;
  try {
    const res = await db.prepare(
      `SELECT label, file_url, file_name, file_size, uploaded_at
         FROM quote_attachments WHERE quote_id = ?`
    ).bind(quoteId).all();
    const rows = (res.results || []) as any[];
    let copied = 0;
    for (const a of rows) {
      if (!a.file_url) continue;
      const exists = await db.prepare(
        `SELECT id FROM project_documents WHERE project_id = ? AND file_url = ?`
      ).bind(projectId, a.file_url).first();
      if (exists) continue;
      await db.prepare(
        `INSERT INTO project_documents (project_id, label, file_url, file_name, file_size, source, uploaded_at)
         VALUES (?, ?, ?, ?, ?, 'quote_promotion', COALESCE(?, CURRENT_TIMESTAMP))`
      ).bind(
        projectId,
        a.label || 'Document',
        a.file_url,
        a.file_name || null,
        a.file_size || null,
        a.uploaded_at || null
      ).run();
      copied++;
    }
    if (copied) console.log(`[promoteQuoteDocuments] quote ${quoteId} -> project ${projectId}: +${copied} document(s)`);
    return copied;
  } catch (e) {
    console.error('[promoteQuoteDocuments] failed:', e);
    return 0;
  }
}
