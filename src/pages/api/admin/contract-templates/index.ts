// Contract Templates — list + create (admin session).
// Mirrors the shape of /api/admin/quote-templates but layers on the
// payment-schedule + terms config that contracts carry beyond quotes.

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

// Bounded numeric parser — keeps malicious / typo input from blowing up the
// math downstream. Returns null if value can't be coerced or is out of range.
function clampNumber(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
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
          SELECT id, name, project_type, is_default, archived,
                 down_payment_percent, down_payment_count, monthly_payment_count,
                 cancellation_window_days, cancellation_fee_amount,
                 late_fee_amount, late_fee_grace_days, warranty_months,
                 created_at, updated_at,
                 json_array_length(sections) AS section_count
          FROM contract_templates
          ORDER BY archived ASC, project_type ASC, id ASC
        `).all()
      : await db.prepare(`
          SELECT id, name, project_type, is_default, archived,
                 down_payment_percent, down_payment_count, monthly_payment_count,
                 cancellation_window_days, cancellation_fee_amount,
                 late_fee_amount, late_fee_grace_days, warranty_months,
                 created_at, updated_at,
                 json_array_length(sections) AS section_count
          FROM contract_templates
          WHERE archived = 0
          ORDER BY project_type ASC, id ASC
        `).all();

    return json({ success: true, templates: rows.results || [] });
  } catch (error) {
    console.error('[admin/contract-templates] GET error:', error);
    return json({ error: 'Failed to load contract templates' }, 500);
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
      terms?: unknown;
      is_default?: boolean | number;
      down_payment_percent?: number;
      down_payment_count?: number;
      monthly_payment_count?: number;
      cancellation_window_days?: number;
      cancellation_fee_amount?: number;
      late_fee_amount?: number;
      late_fee_grace_days?: number;
      warranty_months?: number;
    };

    const name = (body.name || '').trim();
    const projectType = (body.project_type || '').trim().toLowerCase();
    const sections = body.sections ?? [];
    const terms = body.terms ?? {};

    if (!name) return json({ error: 'name is required' }, 400);
    if (!VALID_TYPES.has(projectType)) return json({ error: `project_type must be one of: ${[...VALID_TYPES].join(', ')}` }, 400);
    const sectionsErr = validateSections(sections);
    if (sectionsErr) return json({ error: sectionsErr }, 400);

    const isDefault = body.is_default === true || body.is_default === 1 ? 1 : 0;

    // Payment-schedule defaults — accept overrides but bounded.
    // MannyKnows payment shape: the setup fee is the one payment at kickoff
    // (waived on a prepaid year), then the monthly subscription. 5-business-day
    // full-refund window, no cancellation fee, no contractor-style warranty.
    const downPct = clampNumber(body.down_payment_percent, 0, 100) ?? 100;
    const downCount = clampNumber(body.down_payment_count, 0, 12) ?? 1;
    const monthlyCount = clampNumber(body.monthly_payment_count, 0, 60) ?? 12;
    const cancelDays = clampNumber(body.cancellation_window_days, 0, 30) ?? 5;
    const cancelFee = clampNumber(body.cancellation_fee_amount, 0, 100000) ?? 0;
    const lateFee = clampNumber(body.late_fee_amount, 0, 10000) ?? 0;
    const lateGrace = clampNumber(body.late_fee_grace_days, 0, 30) ?? 5;
    const warrantyMonths = clampNumber(body.warranty_months, 0, 240) ?? 0;

    if (isDefault) {
      await db.prepare(
        'UPDATE contract_templates SET is_default = 0 WHERE project_type = ?'
      ).bind(projectType).run();
    }

    const result = await db.prepare(`
      INSERT INTO contract_templates (
        name, project_type, sections, terms, is_default,
        down_payment_percent, down_payment_count, monthly_payment_count,
        cancellation_window_days, cancellation_fee_amount,
        late_fee_amount, late_fee_grace_days, warranty_months
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name, projectType, JSON.stringify(sections), JSON.stringify(terms), isDefault,
      downPct, downCount, monthlyCount,
      cancelDays, cancelFee,
      lateFee, lateGrace, warrantyMonths
    ).run();

    return json({
      success: true,
      id: result.meta?.last_row_id ?? null,
    }, 201);
  } catch (error) {
    console.error('[admin/contract-templates] POST error:', error);
    return json({ error: 'Failed to create contract template' }, 500);
  }
};
