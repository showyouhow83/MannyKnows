// Quote Templates — list + create (admin session)
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

export const prerender = false;

// Mirrors the quote form's services dropdown (src/data/serviceTypes.ts) so a
// template can exist for any service type the admin can pick in /admin/quotes.
const VALID_TYPES = new Set([
  'kitchen_remodel', 'bathroom_remodel', 'interior_painting',
  'flooring', 'general_repairs', 'other',
]);

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

// Validate a sections payload at a low level — we trust admins not to craft
// malicious JSON, but a quick shape check catches typos that would otherwise
// blow up the editor / preview.
function validateSections(input: unknown): string | null {
  if (!Array.isArray(input)) return 'sections must be an array';
  for (const section of input as any[]) {
    if (!section || typeof section !== 'object') return 'each section must be an object';
    if (typeof section.title !== 'string') return 'each section needs a title string';
    if (!Array.isArray(section.items)) return 'each section needs an items array';
  }
  return null;
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const url = new URL(request.url);
    const includeArchived = url.searchParams.get('archived') === '1';

    const rows = includeArchived
      ? await db.prepare(`
          SELECT id, name, project_type, is_default, archived, sort_order,
                 created_at, updated_at,
                 json_array_length(sections) AS section_count
          FROM quote_templates
          ORDER BY archived ASC, project_type ASC, sort_order ASC, id ASC
        `).all()
      : await db.prepare(`
          SELECT id, name, project_type, is_default, archived, sort_order,
                 created_at, updated_at,
                 json_array_length(sections) AS section_count
          FROM quote_templates
          WHERE archived = 0
          ORDER BY project_type ASC, sort_order ASC, id ASC
        `).all();

    return json({ success: true, templates: rows.results || [] });
  } catch (error) {
    console.error('[admin/quote-templates] GET error:', error);
    return json({ error: 'Failed to load templates' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const body = await request.json() as {
      name?: string;
      project_type?: string;
      sections?: unknown;
      is_default?: boolean | number;
    };

    const name = (body.name || '').trim();
    const projectType = (body.project_type || '').trim().toLowerCase();
    const sections = body.sections ?? [];

    if (!name) return json({ error: 'name is required' }, 400);
    if (!VALID_TYPES.has(projectType)) return json({ error: `project_type must be one of: ${[...VALID_TYPES].join(', ')}` }, 400);
    const sectionsErr = validateSections(sections);
    if (sectionsErr) return json({ error: sectionsErr }, 400);

    const isDefault = body.is_default === true || body.is_default === 1 ? 1 : 0;

    // Only one default per project_type — if this one is being set as default,
    // clear the flag on any others of the same type.
    if (isDefault) {
      await db.prepare(
        'UPDATE quote_templates SET is_default = 0 WHERE project_type = ?'
      ).bind(projectType).run();
    }

    const result = await db.prepare(`
      INSERT INTO quote_templates (name, project_type, sections, is_default)
      VALUES (?, ?, ?, ?)
    `).bind(name, projectType, JSON.stringify(sections), isDefault).run();

    return json({
      success: true,
      id: result.meta?.last_row_id ?? null,
    }, 201);
  } catch (error) {
    console.error('[admin/quote-templates] POST error:', error);
    return json({ error: 'Failed to create template' }, 500);
  }
};
