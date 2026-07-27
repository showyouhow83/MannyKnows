// Crew Timeclock API
// GET: Get today's logs + current state for authenticated crew member
// POST: Clock in or clock out
import type { APIRoute } from 'astro';
import { computeBonus } from '../../../lib/crewBonus';
import {
  computeDriverBonus,
  netMinutesPerShift,
  roundToPayBlock,
  PAID_BREAK_MINUTES,
  LUNCH_BREAK_MINUTES,
  SALARIED_DAYS_PER_WEEK,
} from '../../../lib/crewPay';

async function getCrewFromSession(request: Request, db: any): Promise<{ id: number; name: string } | null> {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/crew_session=([^;]+)/);
  if (!match) return null;

  const session = await db.prepare(`
    SELECT cs.crew_lead_id, cl.name
    FROM crew_sessions cs
    JOIN crew_leads cl ON cs.crew_lead_id = cl.id
    WHERE cs.session_token = ? AND cs.expires_at > CURRENT_TIMESTAMP AND cl.active = 1
  `).bind(match[1]).first() as any;

  if (!session) return null;
  return { id: session.crew_lead_id, name: session.name };
}

function getNowET(): { date: string; datetime: string } {
  // Eastern Time: UTC-5 (EST) or UTC-4 (EDT)
  // EDT: second Sunday in March to first Sunday in November
  const now = new Date();
  const year = now.getUTCFullYear();
  const marchSecondSunday = new Date(Date.UTC(year, 2, 8)); // March 8 minimum
  marchSecondSunday.setUTCDate(8 + (7 - marchSecondSunday.getUTCDay()) % 7);
  const novFirstSunday = new Date(Date.UTC(year, 10, 1)); // November 1 minimum
  novFirstSunday.setUTCDate(1 + (7 - novFirstSunday.getUTCDay()) % 7);
  const isDST = now >= marchSecondSunday && now < novFirstSunday;
  const offsetHours = isDST ? -4 : -5;

  const et = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
  const dateISO = et.toISOString().slice(0, 10);
  const datetime = et.toISOString().slice(0, 19); // "2026-04-05T14:30:00"
  return { date: dateISO, datetime };
}

function getTodayET(): string {
  return getNowET().date;
}

// Auto lunch deduction — shared policy math from src/lib/crewPay.ts so the
// crew portal, admin timesheet, and this endpoint always agree.
const netMinutes = netMinutesPerShift;

// Cap applied when auto-closing a forgotten/abandoned shift. The same-day
// guard already prevents firing on active workdays, so this only matters for
// shifts that crossed midnight. Crews start ~7am at the earliest, so 17h lands
// the cap around midnight ET — past any realistic 11–12h workday.
const MAX_SHIFT_HOURS = 17;

// Parse a stored ET wall-time string ("YYYY-MM-DDTHH:MM:SS") into real UTC ms.
// Workers run in UTC, so new Date() of an offset-less string treats it as UTC
// and yields a value 4–5h off from real time. Apply the proper ET DST offset.
function etDatetimeToUtcMs(s: string): number {
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return new Date(s).getTime();
  const y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5], se = +m[6];
  const naiveUtc = Date.UTC(y, mo - 1, d, h, mi, se);
  // ET DST: 2nd Sunday of March through 1st Sunday of November
  const marchSecondSun = new Date(Date.UTC(y, 2, 8));
  marchSecondSun.setUTCDate(8 + (7 - marchSecondSun.getUTCDay()) % 7);
  const novFirstSun = new Date(Date.UTC(y, 10, 1));
  novFirstSun.setUTCDate(1 + (7 - novFirstSun.getUTCDay()) % 7);
  const isDST = naiveUtc >= marchSecondSun.getTime() && naiveUtc < novFirstSun.getTime();
  const offsetHours = isDST ? 4 : 5;
  return naiveUtc + offsetHours * 3600000;
}

// Auto-close shifts that are clearly abandoned. To avoid clobbering a worker
// who's still on the clock, only fire when the shift began on a *prior*
// calendar day in ET — i.e. they never clocked out before going home — AND
// the shift is older than the cap. Same-day shifts are never auto-closed.
async function autoCloseStaleShift(db: any, openLog: any): Promise<any> {
  if (!openLog) return null;
  const todayEt = getTodayET();
  const startedToday = String(openLog.work_date || '').slice(0, 10) === todayEt;
  if (startedToday) return openLog;

  const startMs = etDatetimeToUtcMs(openLog.clock_in);
  const ageHours = (Date.now() - startMs) / 3600000;
  if (ageHours <= MAX_SHIFT_HOURS) return openLog;

  // Cap at clock_in + MAX_SHIFT_HOURS in ET wall time. Operate on the naive
  // (offset-less) parse so the resulting string stays in the stored format.
  const m = String(openLog.clock_in).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  let cappedStr: string;
  if (m) {
    const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    cappedStr = new Date(naive + MAX_SHIFT_HOURS * 3600000).toISOString().slice(0, 19);
  } else {
    cappedStr = new Date(startMs + MAX_SHIFT_HOURS * 3600000).toISOString().slice(0, 19);
  }
  await db.prepare(`
    UPDATE time_logs
       SET clock_out = ?, status = 'idle', break_ends_at = NULL,
           notes = COALESCE(notes, '') || ' [auto-closed: shift exceeded ' || ? || 'h]',
           updated_at = CURRENT_TIMESTAMP
     WHERE id = ?
  `).bind(cappedStr, MAX_SHIFT_HOURS, openLog.id).run();
  console.warn(`[Timeclock] Auto-closed shift ${openLog.id} (clock_in ${openLog.clock_in}) after exceeding ${MAX_SHIFT_HOURS}h`);
  return null;
}

// GET: Today's logs + state
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const crew = await getCrewFromSession(request, db);
    if (!crew) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    // Look up pay model up front — salaried users skip the entire shifts pipeline.
    const profile = await db.prepare(
      'SELECT pay_model FROM crew_leads WHERE id = ?'
    ).bind(crew.id).first() as any;
    const payModel: 'hourly' | 'salaried_daily' = profile?.pay_model === 'salaried_daily' ? 'salaried_daily' : 'hourly';

    const today = getTodayET();

    // Get all logs for today
    const logsResult = await db.prepare(`
      SELECT * FROM time_logs
      WHERE crew_lead_id = ? AND work_date = ?
      ORDER BY clock_in ASC
    `).bind(crew.id, today).all();

    const logs = logsResult.results || [];

    // Also check for any open log from any date (handles leave+return)
    let openLog = await db.prepare(`
      SELECT * FROM time_logs WHERE crew_lead_id = ? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1
    `).bind(crew.id).first() as any;

    // Auto-close shifts left running past the daily cap
    openLog = await autoCloseStaleShift(db, openLog);

    // Re-fetch today's logs in case a stale shift just got closed
    if (openLog === null) {
      const refreshed = await db.prepare(`
        SELECT * FROM time_logs WHERE crew_lead_id = ? AND work_date = ? ORDER BY clock_in ASC
      `).bind(crew.id, today).all();
      logs.length = 0;
      logs.push(...(refreshed.results || []));
    }

    // If open log has a break that should have auto-ended, end it now
    if (openLog && (openLog.status === 'on_break' || openLog.status === 'on_lunch') && openLog.break_ends_at) {
      const breakEnd = new Date(openLog.break_ends_at);
      const nowET = new Date(getNowET().datetime);
      if (nowET >= breakEnd) {
        // Auto-end the break/lunch
        const isLunch = openLog.status === 'on_lunch';
        const scheduledDuration = isLunch ? LUNCH_BREAK_MINUTES : PAID_BREAK_MINUTES;
        if (isLunch) {
          await db.prepare(`UPDATE time_logs SET status = 'working', lunch_minutes = lunch_minutes + ?, break_ends_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .bind(scheduledDuration, openLog.id).run();
        } else {
          await db.prepare(`UPDATE time_logs SET status = 'working', break_minutes = break_minutes + ?, break_ends_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .bind(scheduledDuration, openLog.id).run();
        }
        openLog.status = 'working';
        openLog.break_ends_at = null;
        if (isLunch) openLog.lunch_minutes = (openLog.lunch_minutes || 0) + scheduledDuration;
        else openLog.break_minutes = (openLog.break_minutes || 0) + scheduledDuration;
      }
    }

    // Determine state. ANY open log means clocked in — the status column has
    // historically drifted to 'idle' on stale rows, so don't trust it as the
    // sole indicator of clocked-in-ness.
    const isClockedIn = !!openLog;
    const validStatuses = ['working', 'on_break', 'on_lunch'];
    const rawStatus = openLog?.status as string | undefined;
    const state = isClockedIn
      ? (validStatuses.includes(rawStatus || '') ? rawStatus : 'working')
      : 'idle';

    // Total NET minutes for CLOSED shifts only.
    let closedMinutesToday = 0;
    for (const log of logs as any[]) {
      if (log.clock_out) {
        const start = new Date(log.clock_in);
        const end = new Date(log.clock_out);
        const rawMins = Math.floor((end.getTime() - start.getTime()) / 60000);
        closedMinutesToday += netMinutes(rawMins);
      }
    }

    // Work minutes accumulated on the open shift up to this moment, minus
    // breaks/lunch already taken. Frozen during break/lunch (anchored at the
    // break-start time so it doesn't tick).
    let openShiftMinutesNow = 0;
    if (isClockedIn && openLog) {
      const start = new Date(openLog.clock_in);
      const onBreak = state === 'on_break' || state === 'on_lunch';
      const breakDur = onBreak ? (state === 'on_lunch' ? LUNCH_BREAK_MINUTES : PAID_BREAK_MINUTES) : 0;
      const breakStart = onBreak && openLog.break_ends_at
        ? new Date(new Date(openLog.break_ends_at).getTime() - breakDur * 60000)
        : null;
      const anchor = onBreak && breakStart ? breakStart : new Date(getNowET().datetime);
      const rawMins = Math.max(0, Math.floor((anchor.getTime() - start.getTime()) / 60000));
      const grossWork = rawMins - (openLog.break_minutes || 0) - (openLog.lunch_minutes || 0);
      // Apply the same 30-min auto lunch deduction as closed shifts
      openShiftMinutesNow = Math.max(0, netMinutes(Math.max(0, grossWork)));
    }
    const workMinutesNow = closedMinutesToday + openShiftMinutesNow;

    // Week summary (if ?week=true)
    const url = new URL(request.url);
    let weekData: any = {};
    if (url.searchParams.get('week') === 'true') {
      const weekStart = url.searchParams.get('week_start') || today;
      const weekEndDate = new Date(weekStart + 'T12:00:00Z');
      weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
      const weekEnd = weekEndDate.toISOString().slice(0, 10);

      const weekLogsResult = await db.prepare(`
        SELECT * FROM time_logs WHERE crew_lead_id = ? AND work_date >= ? AND work_date <= ? ORDER BY work_date ASC, clock_in ASC
      `).bind(crew.id, weekStart, weekEnd).all();

      const weekLogs = weekLogsResult.results || [];
      let weekMinutes = 0;
      for (const log of weekLogs as any[]) {
        if (log.clock_out) {
          const s = new Date(log.clock_in), e = new Date(log.clock_out);
          weekMinutes += netMinutes(Math.floor((e.getTime() - s.getTime()) / 60000));
        }
      }

      // Get the full pay-relevant profile in one shot
      const crewInfo = await db.prepare(
        'SELECT hourly_rate, bonus_start_date, is_driver, pay_model, salary_daily_hours, salary_daily_rate FROM crew_leads WHERE id = ?'
      ).bind(crew.id).first() as any;
      const bonus = computeBonus(crewInfo?.bonus_start_date);
      const isSalaried = crewInfo?.pay_model === 'salaried_daily';

      if (isSalaried) {
        // Fixed pay: SALARIED_DAYS_PER_WEEK × daily_hours × daily_rate. No
        // shift aggregation, no driver bonus, no pay-block rounding.
        const dailyHours = Number(crewInfo?.salary_daily_hours) || 0;
        const dailyRate = Number(crewInfo?.salary_daily_rate) || 0;
        const minsWeek = SALARIED_DAYS_PER_WEEK * dailyHours * 60;
        weekData = {
          pay_model: 'salaried_daily',
          salary_daily_hours: dailyHours,
          salary_daily_rate: dailyRate,
          salary_days_per_week: SALARIED_DAYS_PER_WEEK,
          total_minutes_week: minsWeek,
          payable_minutes_week: minsWeek,
          hourly_rate: dailyRate, // used by the portal for "× rate" math
          driver_bonus_minutes: 0,
          driver_bonus_days: 0,
          driver_bonus_dates: [],
          is_driver: 0,
          bonus,
          week_logs: [],
        };
      } else {
        // Hourly: net minutes + driver bonus → pay blocks → pay
        const driverBonus = computeDriverBonus(weekLogs as any[], !!crewInfo?.is_driver);
        const adjustedMinutes = weekMinutes + driverBonus.bonusMinutes;
        const payableMinutesWeek = roundToPayBlock(adjustedMinutes);

        weekData = {
          pay_model: 'hourly',
          total_minutes_week: weekMinutes, // pure worked time, before driver bonus
          driver_bonus_minutes: driverBonus.bonusMinutes,
          driver_bonus_days: driverBonus.bonusDays,
          // Dates serialized as a plain array so the JSON survives the wire.
          driver_bonus_dates: Array.from(driverBonus.bonusDateSet),
          is_driver: crewInfo?.is_driver ? 1 : 0,
          payable_minutes_week: payableMinutesWeek,
          hourly_rate: crewInfo?.hourly_rate || 0,
          bonus,
          week_logs: weekLogs,
        };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      crew,
      today,
      pay_model: payModel,
      state,
      current_log_id: isClockedIn ? openLog.id : null,
      clock_in_time: isClockedIn ? openLog.clock_in : null,
      break_ends_at: openLog?.break_ends_at || null,
      break_minutes: openLog?.break_minutes || 0,
      lunch_minutes: openLog?.lunch_minutes || 0,
      logs,
      // Total work minutes accurate at the moment of this response. Frontend
      // adds (Date.now() - apiAnchor) only while state='working' to tick live —
      // avoids any timezone parsing of server datetimes on the client.
      work_minutes_now: workMinutesNow,
      closed_minutes_today: closedMinutesToday,
      total_minutes_today: workMinutesNow,
      max_shift_hours: MAX_SHIFT_HOURS,
      ...weekData,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Timeclock GET error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load time data' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST: Clock in or clock out
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

    const crew = await getCrewFromSession(request, db);
    if (!crew) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    // Salaried crew don't clock in/out — their pay is fixed daily. The portal
    // shouldn't show the controls at all, but defend the endpoint anyway.
    const profile = await db.prepare('SELECT pay_model FROM crew_leads WHERE id = ?').bind(crew.id).first() as any;
    if (profile?.pay_model === 'salaried_daily') {
      return new Response(JSON.stringify({ error: 'Salaried crew do not clock in or out' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const action = body.action; // 'clock_in' | 'clock_out' | 'start_break' | 'start_lunch' | 'end_break'
    const et = getNowET();

    // Find any open log for today (not just today — check all recent to handle leave+return)
    const openLog = await db.prepare(`
      SELECT id, clock_in, status, break_minutes, lunch_minutes, break_ends_at, work_date FROM time_logs
      WHERE crew_lead_id = ? AND clock_out IS NULL
      ORDER BY clock_in DESC LIMIT 1
    `).bind(crew.id).first() as any;

    if (action === 'clock_in') {
      if (openLog) {
        return new Response(JSON.stringify({ error: 'You are already clocked in' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const result = await db.prepare(`
        INSERT INTO time_logs (crew_lead_id, clock_in, work_date, status, created_at, updated_at)
        VALUES (?, ?, ?, 'working', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(crew.id, et.datetime, et.date).run();

      console.log(`[Timeclock] ${crew.name} clocked IN at ${et.datetime}`);
      return new Response(JSON.stringify({ success: true, action: 'clocked_in', log_id: result.meta.last_row_id }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else if (action === 'clock_out') {
      if (!openLog) {
        return new Response(JSON.stringify({ error: 'You are not clocked in' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // If on break/lunch, end it first and add the time
      let extraBreakMins = 0;
      let extraLunchMins = 0;
      if (openLog.status === 'on_break' && openLog.break_ends_at) {
        const breakStart = new Date(openLog.break_ends_at);
        breakStart.setMinutes(breakStart.getMinutes() - PAID_BREAK_MINUTES); // break started PAID_BREAK_MINUTES before end
        extraBreakMins = Math.floor((new Date(et.datetime).getTime() - breakStart.getTime()) / 60000);
      } else if (openLog.status === 'on_lunch' && openLog.break_ends_at) {
        const lunchStart = new Date(openLog.break_ends_at);
        lunchStart.setMinutes(lunchStart.getMinutes() - LUNCH_BREAK_MINUTES);
        extraLunchMins = Math.floor((new Date(et.datetime).getTime() - lunchStart.getTime()) / 60000);
      }

      await db.prepare(`
        UPDATE time_logs SET clock_out = ?, status = 'idle',
          break_minutes = break_minutes + ?, lunch_minutes = lunch_minutes + ?,
          break_ends_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(et.datetime, extraBreakMins, extraLunchMins, openLog.id).run();

      const start = new Date(openLog.clock_in);
      const end = new Date(et.datetime);
      const totalMins = Math.floor((end.getTime() - start.getTime()) / 60000);
      const breakMins = (openLog.break_minutes || 0) + extraBreakMins;
      const lunchMins = (openLog.lunch_minutes || 0) + extraLunchMins;
      const workMins = totalMins - breakMins - lunchMins;

      console.log(`[Timeclock] ${crew.name} clocked OUT (${workMins} work min, ${breakMins} break, ${lunchMins} lunch)`);
      return new Response(JSON.stringify({ success: true, action: 'clocked_out', minutes: workMins }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else if (action === 'start_break') {
      if (!openLog || openLog.status !== 'working') {
        return new Response(JSON.stringify({ error: 'You must be working to take a break' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const breakEndsAt = new Date(new Date(et.datetime).getTime() + PAID_BREAK_MINUTES * 60 * 1000);
      const breakEndsStr = breakEndsAt.toISOString().slice(0, 19);

      await db.prepare(`
        UPDATE time_logs SET status = 'on_break', break_ends_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(breakEndsStr, openLog.id).run();

      console.log(`[Timeclock] ${crew.name} started BREAK (ends ${breakEndsStr})`);
      return new Response(JSON.stringify({ success: true, action: 'break_started', break_ends_at: breakEndsStr }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else if (action === 'start_lunch') {
      if (!openLog || openLog.status !== 'working') {
        return new Response(JSON.stringify({ error: 'You must be working to take lunch' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const lunchEndsAt = new Date(new Date(et.datetime).getTime() + LUNCH_BREAK_MINUTES * 60 * 1000);
      const lunchEndsStr = lunchEndsAt.toISOString().slice(0, 19);

      await db.prepare(`
        UPDATE time_logs SET status = 'on_lunch', break_ends_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(lunchEndsStr, openLog.id).run();

      console.log(`[Timeclock] ${crew.name} started LUNCH (ends ${lunchEndsStr})`);
      return new Response(JSON.stringify({ success: true, action: 'lunch_started', break_ends_at: lunchEndsStr }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else if (action === 'end_break') {
      if (!openLog || (openLog.status !== 'on_break' && openLog.status !== 'on_lunch')) {
        return new Response(JSON.stringify({ error: 'You are not on a break' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Calculate actual break/lunch duration
      const isLunch = openLog.status === 'on_lunch';
      const scheduledEnd = new Date(openLog.break_ends_at);
      const scheduledDuration = isLunch ? LUNCH_BREAK_MINUTES : PAID_BREAK_MINUTES;
      const scheduledStart = new Date(scheduledEnd.getTime() - scheduledDuration * 60 * 1000);
      const actualEnd = new Date(et.datetime);
      const actualMins = Math.max(0, Math.floor((actualEnd.getTime() - scheduledStart.getTime()) / 60000));

      if (isLunch) {
        await db.prepare(`UPDATE time_logs SET status = 'working', lunch_minutes = lunch_minutes + ?, break_ends_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .bind(actualMins, openLog.id).run();
      } else {
        await db.prepare(`UPDATE time_logs SET status = 'working', break_minutes = break_minutes + ?, break_ends_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .bind(actualMins, openLog.id).run();
      }

      console.log(`[Timeclock] ${crew.name} ended ${isLunch ? 'LUNCH' : 'BREAK'} (${actualMins} min)`);
      return new Response(JSON.stringify({ success: true, action: 'break_ended' }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('Timeclock POST error:', error);
    return new Response(JSON.stringify({ error: 'Timeclock action failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
