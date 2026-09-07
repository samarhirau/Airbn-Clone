import { z } from 'zod';
import { paginationQuery } from './common';
import { BookingStatuses } from '../models/Booking';

// Query schema for owner bookings with optional status filter
export const ownerBookingsQuery = paginationQuery.extend({
  status: z.enum(BookingStatuses).optional(),
});
export type OwnerBookingsQuery = z.infer<typeof ownerBookingsQuery>;

// Query schema for owner property lists
export const ownerListQuery = paginationQuery;
export type OwnerListQuery = z.infer<typeof ownerListQuery>;

/** Query for `GET /api/owner/analytics`: months back for historical chart aggregation (1-24, default 6). */
export const ownerAnalyticsQuery = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});
export type OwnerAnalyticsQuery = z.infer<typeof ownerAnalyticsQuery>;
