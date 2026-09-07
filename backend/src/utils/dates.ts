
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Normalize any date/ISO string to UTC midnight (00:00:00.000Z). Returns null if invalid. */
export function toUtcMidnight(input: string | Date): Date | null {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Today at UTC midnight. */
export function startOfTodayUtc(): Date {
  return toUtcMidnight(new Date())!;
}

/** Whole nights between two UTC-midnight dates. Assumes checkOut > checkIn. */
export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
}

/** Add N days to a date, returning a new UTC-midnight date. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export interface DateRange {
  checkIn: Date;
  checkOut: Date;
}

/**
 * Validate and normalize a requested stay. Returns normalized UTC dates + nights,
 * or an error string describing the first problem found.
 */
export function normalizeStay(
  checkInRaw: string | Date,
  checkOutRaw: string | Date,
  opts: { allowPast?: boolean } = {},
): { ok: true; checkIn: Date; checkOut: Date; nights: number } | { ok: false; error: string } {
  const checkIn = toUtcMidnight(checkInRaw);
  const checkOut = toUtcMidnight(checkOutRaw);

  if (!checkIn || !checkOut) return { ok: false, error: 'Invalid check-in or check-out date.' };
  if (checkOut.getTime() <= checkIn.getTime())
    return { ok: false, error: 'Check-out must be after check-in.' };
  if (!opts.allowPast && checkIn.getTime() < startOfTodayUtc().getTime())
    return { ok: false, error: 'Check-in date cannot be in the past.' };

  return { ok: true, checkIn, checkOut, nights: nightsBetween(checkIn, checkOut) };
}
