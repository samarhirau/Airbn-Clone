import { z } from 'zod';
import { objectId } from './common';

export const createPaymentIntentBody = z.object({
  bookingId: objectId,
  paymentMethod: z.enum(['card', 'upi', 'wallet', 'mock']).default('card'),
});
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentBody>;

export const verifyPaymentBody = z.object({
  transactionId: z.string().trim().min(1),
  status: z.enum(['completed', 'failed']).default('completed'),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentBody>;
