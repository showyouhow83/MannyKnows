// AI Portfolio Polish Endpoint
//
// Generates a polished marketing-quality title + description for a portfolio
// using the richest context available: the portfolio row, its source project
// (if any), and that project's source quote (if any). Materials, scope, brand
// preference, year built, and project duration all feed the prompt so each
// portfolio gets distinctive copy rather than templated boilerplate.

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';
import { generatePortfolioCopy, PORTFOLIO_TYPE_LABELS } from '../../../lib/portfolio-copy';

export const prerender = false;

interface PolishBody {
  portfolio_id: number | string;
  custom_note?: string; // optional admin-provided guidance for the polish
}

// Paint-brand preference from the quote form (relevant to the interior
// painting service); only surfaces in copy when a quote actually named one.
const BRAND_LABELS: Record<string, string> = {
  'sherwin-williams': 'Sherwin-Williams',
  'benjamin-moore': 'Benjamin Moore',
};

// Pull product names out of a materials JSON blob, dropping prices/qty.
function extractMaterialNames(jsonStr: string | null | undefined): string[] {
  if (!jsonStr) return [];
  try {
    const arr = JSON.parse(jsonStr);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((m: any) => (typeof m === 'object' && m?.name ? String(m.name).trim() : ''))
      .filter(Boolean)
      .slice(0, 6);
  } catch { return []; }
}

function extractLaborDescriptions(jsonStr: string | null | undefined): string[] {
  if (!jsonStr) return [];
  try {
    const arr = JSON.parse(jsonStr);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((l: any) => (typeof l === 'object' && l?.description ? String(l.description).trim() : ''))
      .filter(Boolean)
      .slice(0, 6);
  } catch { return []; }
}

function summariseServices(jsonStr: string | null | undefined): string {
  if (!jsonStr) return '';
  try {
    const arr = JSON.parse(jsonStr);
    if (!Array.isArray(arr)) return '';
    return arr.map((s: any) => {
      const type = typeof s === 'string' ? s : (s?.type || s?.service || '');
      const scope = typeof s === 'object' && s?.scope ? ` — ${s.scope}` : '';
      return type ? `${type}${scope}` : '';
    }).filter(Boolean).join('; ');
  } catch { return ''; }
}

// "Belchertown" → "Belchertown, MA". Leaves an existing state suffix alone but
// normalises "Massachusetts" → "MA" so titles stay short.
function formatCity(city: string | null | undefined): string {
  if (!city) return '';
  const trimmed = city.trim();
  if (!trimmed) return '';
  if (/,\s*Massachusetts\b/i.test(trimmed)) return trimmed.replace(/,\s*Massachusetts\b/i, ', MA');
  if (/,\s*Connecticut\b/i.test(trimmed)) return trimmed.replace(/,\s*Connecticut\b/i, ', CT');
  if (/,\s*(MA|CT)\b/i.test(trimmed)) return trimmed;
  return `${trimmed}, MA`;
}

// (title normalization + AI generation live in src/lib/portfolio-copy.ts)

function computeDuration(
  started: string | null | undefined,
  completed: string | null | undefined,
  scheduledStart: string | null | undefined,
  scheduledEnd: string | null | undefined,
  estimated: string | null | undefined
): string {
  const s = started || scheduledStart;
  const e = completed || scheduledEnd;
  if (s && e) {
    const ms = new Date(e).getTime() - new Date(s).getTime();
    if (Number.isFinite(ms) && ms >= 0) {
      const days = Math.max(1, Math.round(ms / 86400000));
      return days === 1 ? '1 day' : `${days} days`;
    }
  }
  return (estimated || '').trim();
}

function firstName(full: string | null | undefined): string {
  if (!full) return '';
  const first = full.trim().split(/\s+/)[0] || '';
  return first.length >= 2 ? first : '';
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = env?.GEMINI_API_KEY;
    const db = env?.MK_APP_DB;
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'API key not configured' }), {
        status: 503, headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!db) {
      return new Response(JSON.stringify({ success: false, error: 'Database not available' }), {
        status: 503, headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as PolishBody;
    const portfolioId = Number(body.portfolio_id);
    if (!portfolioId || Number.isNaN(portfolioId)) {
      return new Response(JSON.stringify({ success: false, error: 'portfolio_id is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Load portfolio + (optional) source project + (optional) source quote so
    // the prompt has the richest possible factual context.
    const portfolio = await db.prepare(
      `SELECT project_name, project_type, description, client_name, client_city, source_project_id
       FROM portfolios WHERE id = ?`
    ).bind(portfolioId).first() as {
      project_name: string | null;
      project_type: string | null;
      description: string | null;
      client_name: string | null;
      client_city: string | null;
      source_project_id: number | null;
    } | null;

    if (!portfolio) {
      return new Response(JSON.stringify({ success: false, error: 'Portfolio not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    let project: any = null;
    let quote: any = null;
    if (portfolio.source_project_id) {
      project = await db.prepare(
        `SELECT quote_id, customer_name, customer_city, services, scope_description,
                materials, labor, scheduled_start, scheduled_end, started_at, completed_at
         FROM projects WHERE id = ?`
      ).bind(portfolio.source_project_id).first();

      if (project?.quote_id) {
        quote = await db.prepare(
          `SELECT scope_description, services, materials, labor,
                  year_built, repairs_needed, preferred_brand, estimated_duration
           FROM quotes WHERE id = ?`
        ).bind(project.quote_id).first();
      }
    }

    // Aggregate the strongest signal for each field (portfolio → project → quote).
    const typeKey = (portfolio.project_type || '').toLowerCase();
    const typeLabel = PORTFOLIO_TYPE_LABELS[typeKey] || 'Home improvement project';
    const cityFormatted = formatCity(portfolio.client_city || project?.customer_city);
    const services = summariseServices(project?.services || quote?.services);
    const scope = (project?.scope_description || quote?.scope_description || '').trim();
    const materialNames = extractMaterialNames(project?.materials || quote?.materials);
    const laborItems = extractLaborDescriptions(project?.labor || quote?.labor);
    const yearBuilt = (quote?.year_built || '').trim();
    const brand = BRAND_LABELS[(quote?.preferred_brand || '').toLowerCase()] || '';
    const repairs = (quote?.repairs_needed || '').trim();
    const duration = computeDuration(
      project?.started_at, project?.completed_at,
      project?.scheduled_start, project?.scheduled_end,
      quote?.estimated_duration
    );
    const customerFirst = firstName(portfolio.client_name || project?.customer_name);

    // Build a punchy, structured context block — Gemini follows headers well.
    const contextLines: string[] = [];
    contextLines.push(`Project type: ${typeLabel}`);
    if (cityFormatted) contextLines.push(`Location: ${cityFormatted}`);
    if (services) contextLines.push(`Services: ${services}`);
    if (scope) contextLines.push(`Scope: ${scope}`);
    if (yearBuilt) contextLines.push(`Year built: ${yearBuilt}`);
    if (brand) contextLines.push(`Preferred brand: ${brand}`);
    if (materialNames.length) contextLines.push(`Materials used: ${materialNames.join('; ')}`);
    if (laborItems.length) contextLines.push(`Work performed: ${laborItems.join('; ')}`);
    if (repairs && !/^no$/i.test(repairs)) contextLines.push(`Repairs/prep: ${repairs}`);
    if (duration) contextLines.push(`Duration: ${duration}`);
    if (customerFirst) contextLines.push(`Customer first name (optional, do not require): ${customerFirst}`);
    if (portfolio.project_name) contextLines.push(`Current rough title: ${portfolio.project_name}`);
    if (portfolio.description) contextLines.push(`Current rough description: ${portfolio.description}`);
    if (body.custom_note?.trim()) contextLines.push(`Admin note: ${body.custom_note.trim()}`);

    const copy = await generatePortfolioCopy(env, contextLines);
    if (!copy) {
      return new Response(JSON.stringify({ success: false, error: 'AI could not generate copy — try again.' }), {
        status: 502, headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ success: true, title: copy.title, description: copy.description }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Polish Portfolio] Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to polish portfolio' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
