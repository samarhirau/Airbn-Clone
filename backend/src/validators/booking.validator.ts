import { z } from 'zod';
import { objectId, paginationQuery } from './common';

/** A parseable date string (accepts ISO datetime or date-only). Normalized later to UTC midnight. */
const dateString = z
  .string()
  .min(1, 'Date is required')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date');

export const createBookingBody = z.object({
  propertyId: objectId,
  checkIn: dateString,
  checkOut: dateString,
  guests: z.coerce.number().int().min(1, 'At least one guest is required'),
   couponCode: z.string().trim().min(3).max(30).toUpperCase().optional(),
  })
  .refine((data) => data.checkIn < data.checkOut, {
    message: 'checkOut must be strictly after checkIn.',
    path: ['checkOut'],
});


export const listBookingsQuery = paginationQuery.extend({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
});

export const cancelBookingBody = z
  .object({
    reason: z.string().trim().max(500).optional(),
  })
  .default({});

export type CreateBookingInput = z.infer<typeof createBookingBody>;
export type ListBookingsInput = z.infer<typeof listBookingsQuery>;
export type CancelBookingInput = z.infer<typeof cancelBookingBody>;
