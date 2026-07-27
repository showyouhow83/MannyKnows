// Admin Timelogs API
// GET: Get time logs for a date range (week view)
// PATCH: Manual override of a log entry
// DELETE: Remove a log entry
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import {
  computeDriverBonus,
  netMinutesPerShift,
  roundToPayBlock,
  SALARIED_DAYS_PER_WEEK,
} from '../../../../lib/crewPay';

export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const weekStart = url.searchParams.get('week_start'); // YYYY-MM-DD (Monday)
    const crewId = url.searchParams.get('crew_id');

    // Default to current pay week (Sunday → Saturday)
    let start: string;
    if (weekStart) {
      start = weekStart;
    } else {
      const now = new Date();
      const day = now.getUTCDay(); // 0=Sun, 1=Mon...
      const sunday = new Date(now);
      sunday.setUTCDate(now.getUTCDate() - day);
      start = sunday.toISOString().slice(0, 10);
    }

    // Week end = Saturday (start + 6 days)
    const startDate = new Date(start + 'T00:00:00Z');
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 6);
    const end = endDate.toISOString().slice(0, 10);

    let query = `
      SELECT tl.*, cl.name as crew_name, cl.hourly_rate
      FROM time_logs tl
      JOIN crew_leads cl ON tl.crew_lead_id = cl.id
      WHERE tl.work_date >= ? AND tl.work_date <= ?
    `;
    const params: any[] = [start, end];

    if (crewId) {
      query += ' AND tl.crew_lead_id = ?';
      params.push(crewId);
    }

    query += ' ORDER BY tl.crew_lead_id, tl.work_date ASC, tl.clock_in ASC';

    const logsResult = await db.prepare(query).bind(...params).all();
    const logs = (logsResult.results || []) as any[];

    // Also get all crew members for the summary table.
    // pay_model decides whether shifts drive their pay or a fixed daily rate does.
    const crewResult = await db.prepare(
      'SELECT id, name, hourly_rate, is_driver, pay_model, salary_daily_hours, salary_daily_rate FROM crew_leads WHERE active = 1 ORDER BY name ASC'
    ).all();
    const crew = crewResult.results || [];

    // Auto lunch deduction — shared policy math from src/lib/crewPay.ts so
    // this summary always matches the crew portal.
    const netMinutes = netMinutesPerShift;

    // Build per-crew summary.
    // Pay policy (constants live in src/lib/crewPay.ts — pending Manny's review):
    //   net_minutes        = sum of NET shift minutes (after lunch deduction)
    //   driver_bonus_minutes = +DRIVER_BONUS_MINUTES_PER_DAY per qualifying driver day
    //   adjusted_minutes   = net_minutes + driver_bonus_minutes
    //   payable_minutes    = roundToPayBlock(adjusted_minutes) (only full blocks are paid)
    //   extra_minutes      = sub-block leftover
    interface SummaryRow {
      name: string;
      hourly_rate: number;
      is_driver: number;
      pay_model: 'hourly' | 'salaried_daily';
      salary_daily_hours: number;
      salary_daily_rate: number;
      raw_minutes: number;
      total_minutes: number; // net of lunch, EXCLUDING driver bonus (so admin can see the breakdown)
      driver_bonus_minutes: number;
      driver_bonus_days: number;
      payable_minutes: number;
      extra_minutes: number;
      total_pay: number;
    }
    // Pay week for salaried crew: SALARIED_DAYS_PER_WEEK (src/lib/crewPay.ts).
    const summary: Record<number, SummaryRow> = {};
    const logsByCrew = new Map<number, any[]>();
    for (const c of crew as any[]) {
      summary[c.id] = {
        name: c.name,
        hourly_rate: c.hourly_rate || 0,
        is_driver: c.is_driver ? 1 : 0,
        pay_model: c.pay_model === 'salaried_daily' ? 'salaried_daily' : 'hourly',
        salary_daily_hours: Number(c.salary_daily_hours) || 0,
        salary_daily_rate: Number(c.salary_daily_rate) || 0,
        raw_minutes: 0,
        total_minutes: 0,
        driver_bonus_minutes: 0,
        driver_bonus_days: 0,
        payable_minutes: 0,
        extra_minutes: 0,
        total_pay: 0,
      };
      logsByCrew.set(c.id, []);
    }

    // Aggregate shifts (hourly crew use these; salaried crew shouldn't have any
    // but if they do we silently ignore them).
    for (const log of logs) {
      if (!log.clock_out) continue;
      const start = new Date(log.clock_in);
      const end = new Date(log.clock_out);
      const rawMins = Math.floor((end.getTime() - start.getTime()) / 60000);
      if (summary[log.crew_lead_id]) {
        summary[log.crew_lead_id].raw_minutes += rawMins;
        summary[log.crew_lead_id].total_minutes += netMinutes(rawMins);
        logsByCrew.get(log.crew_lead_id)?.push(log);
      }
    }

    // Compute pay per crew. Hourly = (net + driver) → pay blocks → × rate.
    // Salaried = SALARIED_DAYS_PER_WEEK × daily_hours × daily_rate, with no
    // driver bonus and no pay-block rounding (it's a fixed amount).
    for (const id in summary) {
      const s = summary[Number(id)];
      if (s.pay_model === 'salaried_daily') {
        const minsPerDay = s.salary_daily_hours * 60;
        s.payable_minutes = SALARIED_DAYS_PER_WEEK * minsPerDay;
        s.total_minutes = s.payable_minutes;
        s.raw_minutes = s.payable_minutes;
        s.extra_minutes = 0;
        s.total_pay = parseFloat((SALARIED_DAYS_PER_WEEK * s.salary_daily_hours * s.salary_daily_rate).toFixed(2));
      } else {
        const bonus = computeDriverBonus(logsByCrew.get(Number(id)) || [], !!s.is_driver);
        s.driver_bonus_minutes = bonus.bonusMinutes;
        s.driver_bonus_days = bonus.bonusDays;
        const adjusted = s.total_minutes + s.driver_bonus_minutes;
        s.payable_minutes = roundToPayBlock(adjusted);
        s.extra_minutes = adjusted - s.payable_minutes;
        s.total_pay = parseFloat(((s.payable_minutes / 60) * s.hourly_rate).toFixed(2));
      }
    }

    return new Response(JSON.stringify({
      success: true,
      week_start: start,
      week_end: end,
      logs,
      summary: Object.entries(summary).map(([id, s]) => ({ crew_lead_id: Number(id), ...s }))
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Admin timelogs GET error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load timelogs' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST: Manually add a shift (admin)
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const body = await request.json() as any;
    if (!body.crew_lead_id || !body.clock_in || !body.work_date) {
      return new Response(JSON.stringify({ error: 'crew_lead_id, clock_in, and work_date are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // If override=true, delete existing logs for this crew member on this date first
    if (body.override) {
      await db.prepare('DELETE FROM time_logs WHERE crew_lead_id = ? AND work_date = ?')
        .bind(body.crew_lead_id, body.work_date).run();
    }

    const result = await db.prepare(`
      INSERT INTO time_logs (crew_lead_id, clock_in, clock_out, work_date, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(body.crew_lead_id, body.clock_in, body.clock_out || null, body.work_date, body.notes || null).run();

    return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to add shift' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// PATCH: Edit a time log entry (manual override)
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const body = await request.json() as any;
    if (!body.id) return new Response(JSON.stringify({ error: 'Log ID required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const updates: string[] = [];
    const params: any[] = [];

    if (body.clock_in !== undefined) { updates.push('clock_in = ?'); params.push(body.clock_in); }
    if (body.clock_out !== undefined) { updates.push('clock_out = ?'); params.push(body.clock_out || null); }
    if (body.work_date !== undefined) { updates.push('work_date = ?'); params.push(body.work_date); }
    if (body.notes !== undefined) { updates.push('notes = ?'); params.push(body.notes); }

    if (updates.length === 0) return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(body.id);

    await db.prepare(`UPDATE time_logs SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    const updated = await db.prepare('SELECT * FROM time_logs WHERE id = ?').bind(body.id).first();

    return new Response(JSON.stringify({ success: true, log: updated }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Admin timelogs PATCH error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update log' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// DELETE: Remove a log entry
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const reqUrl = new URL(request.url);
    const id = reqUrl.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'Log ID required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    await db.prepare('DELETE FROM time_logs WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete log' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
