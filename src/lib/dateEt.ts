// Eastern-time helpers — Cloudflare Workers run in UTC, so anything that
// asks "what day is it for the customer?" must be computed in ET.
//
// At 10pm Monday ET (UTC-4 in EDT), `new Date()` on a Worker is already
// 02:00 Tuesday UTC. Without an explicit shift, "today" reads as Tuesday
// for everyone in ET — off by one full day for late-evening visitors.

const ET_TIMEZONE = 'America/New_York';

/** Return the current ET wall-clock as Date components. */
export function nowInEt(): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: ET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: weekdayMap[parts.weekday as string] ?? 0,
  };
}

/** Today's date in ET as a "midnight ET" Date object suitable for date math. */
export function todayDateEt(): Date {
  const { year, month, day } = nowInEt();
  // Construct the Date as if it were UTC midnight of that ET day. This gives
  // a stable anchor for day-based arithmetic regardless of where the runtime
  // thinks it is.
  return new Date(Date.UTC(year, month - 1, day));
}

/** Today's date as YYYY-MM-DD in ET. */
export function todayStringEt(): string {
  const { year, month, day } = nowInEt();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Pretty-formatted ET date — "Monday, May 4, 2026". */
export function todayLongStringEt(): string {
  return new Date().toLocaleDateString('en-US', {
    timeZone: ET_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** True UTC ms timestamp for "ET wall-clock at hour:minute on the given Date". */
export function etDateAtHour(date: Date, hour: number, minute = 0): Date {
  // Build the wall-clock string and parse it via Intl to get the correct UTC ms.
  // Easier path: construct the Date in UTC representing the ET wall-clock,
  // then shift by the ET offset for that specific date.
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  // Naive UTC ms of "y-m-d hour:minute" (treated as UTC)
  const naiveUtcMs = Date.UTC(y, m, d, hour, minute);
  // Apply the ET offset that applies on that calendar date
  // EDT: 2nd Sunday of March → 1st Sunday of November (UTC-4)
  // EST: rest of the year (UTC-5)
  const marchSecondSun = new Date(Date.UTC(y, 2, 8));
  marchSecondSun.setUTCDate(8 + (7 - marchSecondSun.getUTCDay()) % 7);
  const novFirstSun = new Date(Date.UTC(y, 10, 1));
  novFirstSun.setUTCDate(1 + (7 - novFirstSun.getUTCDay()) % 7);
  const isDST = naiveUtcMs >= marchSecondSun.getTime() && naiveUtcMs < novFirstSun.getTime();
  const offsetHours = isDST ? 4 : 5; // hours BEHIND UTC
  return new Date(naiveUtcMs + offsetHours * 3600000);
}
