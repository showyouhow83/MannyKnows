// Crew payroll math helpers shared between admin and crew portal so the
// numbers always agree.
//
// The pay calculation has three layers in this order:
//   1. Per-shift NET minutes — raw clock-out − clock-in, minus the auto lunch
//      deduction once the shift crosses the threshold.
//   2. Per-day modifier flags applied AFTER step 1 — currently only the
//      driver flag (+1h on any day where the day's total NET minutes > 30).
//      Future flags (commute, etc.) hook in here.
//   3. Pay-block rounding — only full blocks are paid; the sub-block tail
//      is unpaid.

// ─── PAY POLICY CONSTANTS ────────────────────────────────────────────────────
// ⚠️ REVIEW REQUIRED (Manny): every value below is inherited verbatim from the
// SL Painting crew system this module was ported from. They are placeholders
// for MannyKnows policy, NOT confirmed MK policy. Manny must review and
// sign off on each rule (lunch deduction, break lengths, pay-block rounding,
// driver bonus, salaried week length) before the first MK payroll run.
// See also src/lib/crewBonus.ts for the year-end bonus rate.

/** Shift length (minutes) at which the unpaid auto-lunch deduction kicks in. (SLP default: 4h) */
export const AUTO_LUNCH_THRESHOLD_MINUTES = 240;

/** Unpaid minutes auto-deducted from any shift that crosses the threshold. (SLP default: 30) */
export const AUTO_LUNCH_DEDUCTION_MINUTES = 30;

/** Scheduled paid break length in minutes. (SLP default: 15) */
export const PAID_BREAK_MINUTES = 15;

/** Scheduled lunch length in minutes. (SLP default: 30) */
export const LUNCH_BREAK_MINUTES = 30;

/** Pay rounding block: only full blocks of this many minutes are paid; the
 *  0–(block−1) minute tail is unpaid. (SLP default: 30) */
export const PAY_BLOCK_MINUTES = 30;

/** Salaried (salaried_daily) crew are paid this many days per pay week,
 *  regardless of shifts. (SLP default: all 7 days, Sun→Sat) */
export const SALARIED_DAYS_PER_WEEK = 7;

/** Auto lunch deduction once a shift crosses the threshold. */
export function netMinutesPerShift(rawMins: number): number {
  return rawMins >= AUTO_LUNCH_THRESHOLD_MINUTES
    ? rawMins - AUTO_LUNCH_DEDUCTION_MINUTES
    : rawMins;
}

/** Round adjusted minutes down to the nearest full pay block. */
export function roundToPayBlock(minutes: number): number {
  return Math.floor(minutes / PAY_BLOCK_MINUTES) * PAY_BLOCK_MINUTES;
}

/**
 * Minimum minutes a crew member must work in a single day for the driver
 * flag to grant the +1h bonus. Anything ≤ this is treated as a no-show /
 * brief admin visit and earns no driver bonus. (SLP default: 30)
 */
export const DRIVER_MIN_DAY_MINUTES = 30;

/** Driver bonus minutes earned per qualifying day. (SLP default: +1h/day) */
export const DRIVER_BONUS_MINUTES_PER_DAY = 60;

export interface DriverBonusResult {
  /** Total driver bonus minutes earned across the period. */
  bonusMinutes: number;
  /** Number of distinct days that earned the bonus. */
  bonusDays: number;
  /** Set of work_date strings (YYYY-MM-DD) that earned the bonus. */
  bonusDateSet: Set<string>;
}

interface ShiftLike {
  work_date: string;
  clock_in?: string;
  clock_out?: string | null;
}

/**
 * Compute the driver bonus from a list of shifts. Groups by work_date,
 * sums NET minutes per day, and grants +60 min for each day where the
 * total exceeds 30 min — only when isDriver is true.
 *
 * Multiple clock-ins in a single day still earn at most one bonus (the
 * intent is "they showed up and drove that day", not "per shift").
 */
export function computeDriverBonus(shifts: ShiftLike[], isDriver: boolean): DriverBonusResult {
  const empty: DriverBonusResult = { bonusMinutes: 0, bonusDays: 0, bonusDateSet: new Set() };
  if (!isDriver) return empty;

  // Sum net minutes per work_date.
  const minutesByDate = new Map<string, number>();
  for (const s of shifts) {
    if (!s.clock_in || !s.clock_out) continue;
    const start = new Date(s.clock_in).getTime();
    const end = new Date(s.clock_out).getTime();
    if (!isFinite(start) || !isFinite(end) || end <= start) continue;
    const rawMins = Math.floor((end - start) / 60000);
    const net = netMinutesPerShift(rawMins);
    minutesByDate.set(s.work_date, (minutesByDate.get(s.work_date) || 0) + net);
  }

  const bonusDateSet = new Set<string>();
  for (const [date, mins] of minutesByDate) {
    if (mins > DRIVER_MIN_DAY_MINUTES) bonusDateSet.add(date);
  }
  return {
    bonusMinutes: bonusDateSet.size * DRIVER_BONUS_MINUTES_PER_DAY,
    bonusDays: bonusDateSet.size,
    bonusDateSet,
  };
}
