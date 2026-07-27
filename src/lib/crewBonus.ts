// Crew year-end bonus math.
//
// Each crew member accrues +$1/day from their bonus_start_date, capped at $365
// (one full year). The bonus is forfeit if they leave before completing the
// year — that policy is enforced manually by admin at payout time, not in
// code. We just keep the daily counter ticking.
//
// Both the admin crew page and the crew portal call this so the numbers
// always match, regardless of where they're rendered.

import { todayDateEt } from './dateEt';

// ─── BONUS POLICY CONSTANTS ──────────────────────────────────────────────────
// ⚠️ REVIEW REQUIRED (Manny): these values are inherited verbatim from the
// SL Painting crew system ($1/day, capped at one year = $365). They are NOT
// confirmed MannyKnows policy — Manny must review and sign off before any
// bonus is promised or paid out. See src/lib/crewPay.ts for the other pay rules.

/** Dollars accrued per day from bonus_start_date. (SLP default: $1/day) */
export const BONUS_DAILY_RATE = 1;

/** Accrual cap in days. (SLP default: 365 = one full year) */
export const BONUS_MAX_DAYS = 365;

export const BONUS_MAX_DOLLARS = BONUS_MAX_DAYS * BONUS_DAILY_RATE;

export interface BonusInfo {
  /** Start date passed in (echoed for convenience). null if not set. */
  startDate: string | null;
  /** Days elapsed since start (capped at 365, floored at 0). */
  days: number;
  /** Dollar value: days * daily_rate. */
  amount: number;
  /** ISO date when the full bonus becomes claimable (start + 365 days). */
  claimDate: string | null;
}

/**
 * Compute current bonus info given a YYYY-MM-DD start date.
 * Uses ET wall-clock for "today" so the counter rolls over at ET midnight.
 */
export function computeBonus(startDate: string | null | undefined): BonusInfo {
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return { startDate: null, days: 0, amount: 0, claimDate: null };
  }

  const start = new Date(startDate + 'T00:00:00Z');
  const today = todayDateEt();
  const msPerDay = 86_400_000;

  let days = Math.floor((today.getTime() - start.getTime()) / msPerDay);
  if (days < 0) days = 0;
  if (days > BONUS_MAX_DAYS) days = BONUS_MAX_DAYS;

  const claim = new Date(start);
  claim.setUTCDate(claim.getUTCDate() + BONUS_MAX_DAYS);
  const claimDate = claim.toISOString().slice(0, 10);

  return {
    startDate,
    days,
    amount: days * BONUS_DAILY_RATE,
    claimDate,
  };
}
