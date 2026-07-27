// POST /api/quotes/[id]/apply-template
//
// Apply a quote template to a quote. Phase 5: quotes hold an array of SCOPES,
// each scope owns its own sections.
//
// Body params:
//   template_id (number, required) — the template to apply
//   scope_id   (string, optional) — when provided AND found in the quote,
//                                    REPLACE that scope's sections (keep id
//                                    + title). When provided but NOT found
//                                    (the scope was auto-seeded client-side
//                                    and never saved), UPSERT a new scope
//                                    with that id so the client's local
//                                    state stays consistent. When omitted,
//                                    APPEND a brand-new scope.
//   scope_title (string, optional) — title for upsert/append; falls back to
//                                    the template's name.
//
// Returns the updated full template_sections array (QuoteScope[]) so the
// client can render directly without a refetch.

import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import { parseScopes, type QuoteScope, type QuoteSection } from '../../../../lib/quoteTemplateConstants';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function freshId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Clone a template's section list with fresh per-item IDs so multiple
// quotes don't share IDs (and so subsequent edits within one quote don't
// collide with a previously-applied template's items).
function cloneSections(rawSections: unknown): QuoteSection[] {
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

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);

    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return json({ error: 'Unauthorized' }, 401);

    const quoteId = Number(params.id);
    if (!quoteId || Number.isNaN(quoteId)) return json({ error: 'quote id is required' }, 400);

    const body = await request.json() as { template_id?: number; scope_id?: string; scope_title?: string };
    const templateId = Number(body?.template_id);
    const targetScopeId = (body?.scope_id || '').trim() || null;
    const clientScopeTitle = (body?.scope_title || '').trim() || null;
    if (!templateId || Number.isNaN(templateId)) return json({ error: 'template_id is required' }, 400);

    // Pull the current quote (for its template_sections) and the template
    // (for its sections + name) in one round-trip.
    const [quote, template] = await Promise.all([
      db.prepare('SELECT id, template_sections FROM quotes WHERE id = ?').bind(quoteId).first() as Promise<{ id: number; template_sections: string | null } | null>,
      db.prepare('SELECT id, name, sections FROM quote_templates WHERE id = ?').bind(templateId).first() as Promise<{ id: number; name: string; sections: string } | null>,
    ]);
    if (!quote) return json({ error: 'Quote not found' }, 404);
    if (!template) return json({ error: 'Template not found' }, 404);

    let templateSections: unknown;
    try { templateSections = JSON.parse(template.sections || '[]'); } catch { templateSections = []; }
    const clonedSections = cloneSections(templateSections);

    // Existing scopes (legacy flat data is transparently wrapped as one scope).
    const existingScopes = parseScopes(quote.template_sections);

    let updatedScopes: QuoteScope[];

    if (targetScopeId) {
      // REPLACE-this-scope mode. Find the scope by id and swap its sections.
      const idx = existingScopes.findIndex(s => s.id === targetScopeId);
      if (idx !== -1) {
        // Persisted scope: keep its id + title, swap the sections.
        updatedScopes = [...existingScopes];
        updatedScopes[idx] = {
          ...updatedScopes[idx],
          template_id: templateId,
          sections: clonedSections,
        };
      } else {
        // Scope id provided but unknown server-side — client-only scope (e.g.
        // the auto-seeded "Main scope" or a legacy-synthesized one). Upsert
        // with that id so the client's local state stays consistent. Title
        // comes from the client when known, falling back to template.name.
        const newScope: QuoteScope = {
          id: targetScopeId,
          title: clientScopeTitle || template.name,
          template_id: templateId,
          sections: clonedSections,
        };
        updatedScopes = [...existingScopes, newScope];
      }
    } else {
      // APPEND-new-scope mode. New scope gets the template's name as title.
      const newScope: QuoteScope = {
        id: freshId('scope'),
        title: template.name,
        template_id: templateId,
        sections: clonedSections,
      };
      updatedScopes = [...existingScopes, newScope];
    }

    await db.prepare(`
      UPDATE quotes
      SET template_id = ?,
          template_sections = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(templateId, JSON.stringify(updatedScopes), quoteId).run();

    return json({ success: true, template_sections: updatedScopes });
  } catch (error) {
    console.error('[quotes/[id]/apply-template] error:', error);
    return json({ error: 'Failed to apply template' }, 500);
  }
};
