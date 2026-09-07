import { Types, type ClientSession } from 'mongoose';
import { Booking, ACTIVE_BOOKING_STATUSES } from '../models/Booking';
import { startOfTodayUtc } from '../utils/dates';

export interface OccupancyInfo {
  /** True if a guest is in residence today. */
  occupied: boolean;
  /** If occupied now, the date it frees (checkout of the current back-to-back run); else null. */
  occupiedUntil: Date | null;
  /** Earliest date a new check-in is possible (>= today). */
  nextAvailableDate: Date;
  /** The next future booking (when not currently occupied), for owner/admin visibility. */
  upcomingBooking: { checkIn: Date; checkOut: Date } | null;
}

interface BookedRange {
  checkIn: Date;
  checkOut: Date;
}

/**
 * Does the requested range conflict with any active booking for the property?
 * Accepts an optional session (used inside the booking transaction) and an
 * optional booking id to exclude (used when re-validating an existing booking).
 */
export async function hasConflictingBooking(
  propertyId: Types.ObjectId | string,
  checkIn: Date,
  checkOut: Date,
  opts: { excludeBookingId?: Types.ObjectId | string; session?: ClientSession } = {},
): Promise<boolean> {
  const query: Record<string, unknown> = {
    property: propertyId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (opts.excludeBookingId) query._id = { $ne: opts.excludeBookingId };

  const conflict = await Booking.exists(query).session(opts.session ?? null);
  return Boolean(conflict);
}

export async function isPropertyAvailable(
  propertyId: Types.ObjectId | string,
  checkIn: Date,
  checkOut: Date,
): Promise<boolean> {
  return !(await hasConflictingBooking(propertyId, checkIn, checkOut));
}

/** Pure computation of occupancy from a property's active bookings (checkOut > today). */
export function computeOccupancy(ranges: BookedRange[], today: Date): OccupancyInfo {
  const sorted = [...ranges].sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());

  // Is someone in residence today? (checkIn <= today < checkOut)
  const currentIdx = sorted.findIndex(
    (r) => r.checkIn.getTime() <= today.getTime() && today.getTime() < r.checkOut.getTime(),
  );

  if (currentIdx === -1) {
    const upcoming = sorted.find((r) => r.checkIn.getTime() > today.getTime()) ?? null;
    return {
      occupied: false,
      occupiedUntil: null,
      nextAvailableDate: today,
      upcomingBooking: upcoming ? { checkIn: upcoming.checkIn, checkOut: upcoming.checkOut } : null,
    };
  }

  // Occupied: extend across back-to-back bookings (next check-in on/before current checkout).
  let end = sorted[currentIdx].checkOut;
  for (let i = currentIdx + 1; i < sorted.length; i += 1) {
    if (sorted[i].checkIn.getTime() <= end.getTime()) {
      if (sorted[i].checkOut.getTime() > end.getTime()) end = sorted[i].checkOut;
    } else {
      break;
    }
  }

  return { occupied: true, occupiedUntil: end, nextAvailableDate: end, upcomingBooking: null };
}

/**
 * Occupancy for a set of properties in a **single** query (no N+1). Returns a map
 * keyed by property id string. Properties with no active bookings are available today.
 */
export async function getOccupancyMap(
  propertyIds: (Types.ObjectId | string)[],
  asOf?: Date,
): Promise<Record<string, OccupancyInfo>> {
  const today = asOf ?? startOfTodayUtc();
  const result: Record<string, OccupancyInfo> = {};
  for (const id of propertyIds) {
    result[String(id)] = { occupied: false, occupiedUntil: null, nextAvailableDate: today, upcomingBooking: null };
  }
  if (propertyIds.length === 0) return result;

  const bookings = await Booking.find({
    property: { $in: propertyIds },
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkOut: { $gt: today },
  })
    .select('property checkIn checkOut')
    .sort({ property: 1, checkIn: 1 })
    .lean();

  const grouped = new Map<string, BookedRange[]>();
  for (const b of bookings) {
    const key = String(b.property);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push({ checkIn: b.checkIn as Date, checkOut: b.checkOut as Date });
  }

  for (const [key, ranges] of grouped) {
    result[key] = computeOccupancy(ranges, today);
  }
  return result;
}

/**
 * Availability detail for one property, used by `GET /properties/:id/availability`.
 * If a date range is supplied, reports whether it is bookable; always returns the
 * property's current occupancy summary.
 */
export async function getPropertyAvailability(
  propertyId: Types.ObjectId | string,
  range?: { checkIn: Date; checkOut: Date },
): Promise<OccupancyInfo & { requestedRangeAvailable?: boolean }> {
  const today = startOfTodayUtc();
  const bookings = await Booking.find({
    property: propertyId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkOut: { $gt: today },
  })
    .select('checkIn checkOut')
    .sort({ checkIn: 1 })
    .lean();

  const occupancy = computeOccupancy(
    bookings.map((b) => ({ checkIn: b.checkIn as Date, checkOut: b.checkOut as Date })),
    today,
  );

  if (range) {
    const requestedRangeAvailable = !(await hasConflictingBooking(propertyId, range.checkIn, range.checkOut));
    return { ...occupancy, requestedRangeAvailable };
  }
  return occupancy;
}



export interface CalendarDayStatus {
  date: string;
  dayOfMonth: number;
  dayOfWeek: number;
  isPast: boolean;
  status: 'available' | 'occupied' | 'past';
}

export interface MonthCalendarResult {
  propertyId: string;
  year: number;
  month: number;
  days: CalendarDayStatus[];
}

export async function getMonthCalendar(
  propertyId: Types.ObjectId | string,
  year: number,
  month: number,
): Promise<MonthCalendarResult> {
  const pid = typeof propertyId === 'string' ? new Types.ObjectId(propertyId) : propertyId;
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const today = startOfTodayUtc();

  const bookings = await Booking.find({
    property: pid,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkIn: { $lt: endDate },
    checkOut: { $gt: startDate },
  }).lean();

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days: CalendarDayStatus[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const currentDayUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const nextDayUtc = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
    const isPast = currentDayUtc.getTime() < today.getTime();

    const isBooked = bookings.some(
      (b) => b.checkIn.getTime() < nextDayUtc.getTime() && b.checkOut.getTime() > currentDayUtc.getTime(),
    );

    let status: 'available' | 'occupied' | 'past' = 'available';
    if (isPast) status = 'past';
    else if (isBooked) status = 'occupied';

    const yyyy = currentDayUtc.getUTCFullYear();
    const mm = String(currentDayUtc.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(currentDayUtc.getUTCDate()).padStart(2, '0');

    days.push({
      date: `${yyyy}-${mm}-${dd}`,
      dayOfMonth: day,
      dayOfWeek: currentDayUtc.getUTCDay(),
      isPast,
      status,
    });
  }

  return { propertyId: String(pid), year, month, days };
}
