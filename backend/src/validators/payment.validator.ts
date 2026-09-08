import { z } from 'zod';
import { objectId } from './common';

export const createPaymentIntentBody = z.object({
  bookingId: objectId,
  paymentMethod: z
    .enum(['card', 'upi', 'wallet', 'mock', 'razorpay', 'netbanking'])
    .default('razorpay'),
  currency: z.string().trim().max(5).optional(),
});
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentBody>;

export const verifyPaymentBody = z.object({
  transactionId: z.string().trim().optional(),
  status: z.enum(['completed', 'failed']).default('completed'),
  razorpay_order_id: z.string().trim().optional(),
  razorpay_payment_id: z.string().trim().optional(),
  razorpay_signature: z.string().trim().optional(),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentBody>;
