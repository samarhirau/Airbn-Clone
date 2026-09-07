import { Booking } from '../models/Booking';
import { startOfTodayUtc } from '../utils/dates';
import { invalidateBookingDashboards } from '../cache/invalidation';
import { logger } from '../config/logger';

export async function markCompletedBookings(asOf: Date = startOfTodayUtc()): Promise<number> {
  const filter = { status: 'confirmed' as const, checkOut: { $lte: asOf } };

  // Capture affected owners before the update so their dashboards can be invalidated
  const owners = await Booking.distinct('owner', filter);
  const result = await Booking.updateMany(filter, { $set: { status: 'completed' } });

  if (result.modifiedCount > 0) {
    // Clear the admin dashboard once, then each affected owner's dashboard
    await invalidateBookingDashboards();
    await Promise.all(owners.map((ownerId) => invalidateBookingDashboards(String(ownerId))));
    logger.info({ completed: result.modifiedCount }, 'Booking completion job: marked stays completed');
  }
  return result.modifiedCount;
}
