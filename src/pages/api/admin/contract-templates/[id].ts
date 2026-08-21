// Contract Templates — get / patch / delete a single template (admin session).
// Parallels /api/admin/quote-templates/[id] but covers the contract-only
// fields (payment-schedule defaults + terms blob).

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import { SERVICE_TYPES } from '../../../../data/serviceTypes';

export const prerender = false;

// The service catalog itself (src/data/serviceTypes.ts) is the validator —
// a stale local copy of this list is what broke template creation (Aug 2026).
const VALID_TYPES = new Set(SERVICE_TYPES.map((s) => s.value));

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

function validateSections(input: unknown): string | null {
  if (!Array.isArray(input)) return 'sections must be an array';
  for (const section of input as any[]) {
    if (!section || typeof section !== 'object') return 'each section must be an object';
    if (typeof section.title !== 'string') return 'each section needs a title string';
    if (!Array.isArray(section.items)) return 'each section needs an items array';
  }
  return null;
}

function clampNumber(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

export const GET: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const id = Number(params.id);
    if (!id || Number.isNaN(id)) return json({ error: 'id is required' }, 400);

    const row = await db.prepare(
      'SELECT * FROM contract_templates WHERE id = ?'
    ).bind(id).first() as any;
    if (!row) return json({ error: 'Not found' }, 404);

    try { row.sections = JSON.parse(row.sections); } catch { row.sections = []; }
    try { row.terms = JSON.parse(row.terms); } catch { row.terms = {}; }

    return json({ success: true, template: row });
  } catch (error) {
    console.error('[admin/contract-templates/[id]] GET error:', error);
    return json({ error: 'Failed to load contract template' }, 500);
  }
};

export const PATCH: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const id = Number(params.id);
    if (!id || Number.isNaN(id)) return json({ error: 'id is required' }, 400);

    const existing = await db.prepare(
      'SELECT id, project_type FROM contract_templates WHERE id = ?'
    ).bind(id).first() as { id: number; project_type: string } | null;
    if (!existing) return json({ error: 'Not found' }, 404);

    const body = await request.json() as Record<string, unknown>;

    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return json({ error: 'name cannot be empty' }, 400);
      updates.push('name = ?'); values.push(name);
    }
    if (body.project_type !== undefined) {
      const pt = String(body.project_type).trim().toLowerCase();
      if (!VALID_TYPES.has(pt)) return json({ error: 'invalid project_type' }, 400);
      updates.push('project_type = ?'); values.push(pt);
    }
    if (body.sections !== undefined) {
      const err = validateSections(body.sections);
      if (err) return json({ error: err }, 400);
      updates.push('sections = ?'); values.push(JSON.stringify(body.sections));
    }
    if (body.terms !== undefined) {
      // Terms is a JSON blob; admin authors it. Accept any shape — render-side
      // is tolerant of missing keys.
      updates.push('terms = ?'); values.push(JSON.stringify(body.terms));
    }
    if (body.is_default !== undefined) {
      const isDefault = body.is_default === true || body.is_default === 1 ? 1 : 0;
      if (isDefault) {
        const pt = body.project_type
          ? String(body.project_type).trim().toLowerCase()
          : existing.project_type;
        await db.prepare(
          'UPDATE contract_templates SET is_default = 0 WHERE project_type = ? AND id != ?'
        ).bind(pt, id).run();
      }
      updates.push('is_default = ?'); values.push(isDefault);
    }
    if (body.archived !== undefined) {
      updates.push('archived = ?'); values.push(body.archived === true || body.archived === 1 ? 1 : 0);
    }

    // Payment-schedule + warranty config — each clampNumber call validates
    // the override; out-of-range values get rejected outright.
    const numericFields: Array<[string, number, number]> = [
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

    if (!updates.length) return json({ error: 'Nothing to update' }, 400);

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.prepare(`
      UPDATE contract_templates
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    return json({ success: true });
  } catch (error) {
    console.error('[admin/contract-templates/[id]] PATCH error:', error);
    return json({ error: 'Failed to update contract template' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals, params }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);
    if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);

    const id = Number(params.id);
    if (!id || Number.isNaN(id)) return json({ error: 'id is required' }, 400);

    // ?hard=1 = permanent delete. Default = soft-delete (archived = 1).
    // Project contracts that already applied this template keep a frozen
    // copy of its scopes + terms (no FK back), so historical contracts are
    // unaffected by template deletion.
    const url = new URL(request.url);
    const hard = url.searchParams.get('hard') === '1';

    const result = hard
      ? await db.prepare('DELETE FROM contract_templates WHERE id = ?').bind(id).run()
      : await db.prepare(
          'UPDATE contract_templates SET archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(id).run();
    if (!result.meta?.changes) return json({ error: 'Not found' }, 404);

    return json({ success: true, hard });
  } catch (error) {
    console.error('[admin/contract-templates/[id]] DELETE error:', error);
    return json({ error: 'Failed to delete contract template' }, 500);
  }
};
