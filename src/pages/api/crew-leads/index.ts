// Crew Leads API Endpoint
// GET: List all crew leads (admin only)
// POST: Create new crew lead (admin only)
// PATCH: Update crew lead (admin only)
// DELETE: Soft delete crew lead (admin only)
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

type PayModel = 'hourly' | 'salaried_daily';

interface CrewLeadCreateRequest {
  name: string;
  email?: string;
  phone: string;
  hourly_rate?: number;
  bonus_start_date?: string; // YYYY-MM-DD; when this crew member started accruing the year-end bonus
  is_driver?: boolean | number;
  pay_model?: PayModel;
  salary_daily_hours?: number;
  salary_daily_rate?: number;
}

interface CrewLeadUpdateRequest {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  hourly_rate?: number;
  active?: boolean;
  bonus_start_date?: string | null;
  is_driver?: boolean | number;
  pay_model?: PayModel;
  salary_daily_hours?: number;
  salary_daily_rate?: number;
}

function normalizePayModel(v: unknown): PayModel {
  return v === 'salaried_daily' ? 'salaried_daily' : 'hourly';
}

// YYYY-MM-DD validator. Empty string / null is allowed (clears the field).
function normalizeBonusDate(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

// GET: List all active crew leads
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get query params
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('include_inactive') === 'true';

    // Fetch crew leads
    let query = 'SELECT * FROM crew_leads';
    if (!includeInactive) {
      query += ' WHERE active = 1';
    }
    query += ' ORDER BY name ASC';

    const result = await db.prepare(query).all();

    return new Response(JSON.stringify({
      success: true,
      crew_leads: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching crew leads:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch crew leads'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Create new crew lead
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: CrewLeadCreateRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.phone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Name and phone are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert new crew lead
    const result = await db.prepare(`
      INSERT INTO crew_leads (name, email, phone, hourly_rate, bonus_start_date, is_driver, pay_model, salary_daily_hours, salary_daily_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.name.trim(),
      body.email ? body.email.toLowerCase().trim() : '',
      body.phone.trim(),
      body.hourly_rate || 0,
      normalizeBonusDate(body.bonus_start_date),
      body.is_driver ? 1 : 0,
      normalizePayModel(body.pay_model),
      Number(body.salary_daily_hours) || 8,
      Number(body.salary_daily_rate) || 0
    ).run();

    // Fetch the created crew lead
    const created = await db.prepare(
      'SELECT * FROM crew_leads WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    console.log(`[CrewLead] Created crew lead: ${body.name} (${body.email})`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Crew lead created successfully',
      crew_lead: created
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating crew lead:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create crew lead'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH: Update crew lead
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: CrewLeadUpdateRequest = await request.json();

    if (!body.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Crew lead ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify crew lead exists
    const existing = await db.prepare(
      'SELECT * FROM crew_leads WHERE id = ?'
    ).bind(body.id).first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Crew lead not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      params.push(body.name.trim());
    }
    if ('email' in body) {
      // Allow clearing email by sending empty string or null
      const emailVal = body.email ? body.email.toLowerCase().trim() : '';
      // Only check for duplicates if a non-empty email is being set
      if (emailVal) {
        const duplicate = await db.prepare(
          'SELECT id FROM crew_leads WHERE email = ? AND id != ? AND active = 1'
        ).bind(emailVal, body.id).first();
        if (duplicate) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Another crew lead with this email already exists'
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
      }
      updates.push('email = ?');
      params.push(emailVal);
    }
    if (body.phone !== undefined) {
      updates.push('phone = ?');
      params.push(body.phone.trim());
    }
    if (body.hourly_rate !== undefined) {
      updates.push('hourly_rate = ?');
      params.push(body.hourly_rate || 0);
    }
    if (body.active !== undefined) {
      updates.push('active = ?');
      params.push(body.active ? 1 : 0);
    }
    if ('bonus_start_date' in body) {
      updates.push('bonus_start_date = ?');
      params.push(normalizeBonusDate(body.bonus_start_date));
    }
    if ('is_driver' in body) {
      updates.push('is_driver = ?');
      params.push(body.is_driver ? 1 : 0);
    }
    if ('pay_model' in body) {
      updates.push('pay_model = ?');
      params.push(normalizePayModel(body.pay_model));
    }
    if ('salary_daily_hours' in body) {
      updates.push('salary_daily_hours = ?');
      params.push(Number(body.salary_daily_hours) || 8);
    }
    if ('salary_daily_rate' in body) {
      updates.push('salary_daily_rate = ?');
      params.push(Number(body.salary_daily_rate) || 0);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No fields to update'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(body.id);

    await db.prepare(
      `UPDATE crew_leads SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    // Fetch updated crew lead
    const updated = await db.prepare(
      'SELECT * FROM crew_leads WHERE id = ?'
    ).bind(body.id).first();

    console.log(`[CrewLead] Updated crew lead ${body.id}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Crew lead updated successfully',
      crew_lead: updated
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating crew lead:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update crew lead'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Soft delete crew lead
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Crew lead ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify crew lead exists
    const existing = await db.prepare(
      'SELECT * FROM crew_leads WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Crew lead not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Clear every reference first or the final delete trips a foreign-key
    // constraint (this was the 500). Projects get UNASSIGNED (back to needs-crew)
    // rather than deleted; the per-crew child tables are removed.
    await db.prepare('UPDATE projects SET crew_lead_id = NULL WHERE crew_lead_id = ?').bind(id).run();
    await db.prepare('DELETE FROM time_logs WHERE crew_lead_id = ?').bind(id).run();
    await db.prepare('DELETE FROM crew_sessions WHERE crew_lead_id = ?').bind(id).run();
    await db.prepare('DELETE FROM crew_expenses WHERE crew_lead_id = ?').bind(id).run();
    await db.prepare('DELETE FROM crew_materials WHERE crew_lead_id = ?').bind(id).run();

    // Hard delete the crew member
    await db.prepare(
      'DELETE FROM crew_leads WHERE id = ?'
    ).bind(id).run();

    console.log(`[CrewLead] Deleted crew lead ${id}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Crew lead removed successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting crew lead:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete crew lead'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
