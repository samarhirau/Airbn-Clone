import { z } from 'zod';
import { objectId } from './common';

export const createReviewBody = z.object({
  bookingId: objectId,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(2000),
});
export type CreateReviewInput = z.infer<typeof createReviewBody>;

export const propertyIdParams = z.object({ propertyId: objectId });
export type PropertyIdParams = z.infer<typeof propertyIdParams>;

export const bookingIdParams = z.object({ bookingId: objectId });
export type BookingIdParams = z.infer<typeof bookingIdParams>;
