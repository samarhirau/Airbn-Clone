import { z } from 'zod';
import { paginationQuery } from './common';

// Create coupon schema
export const createCouponBody = z
  .object({
    code: z.string().trim().min(3).max(30).toUpperCase(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.coerce.number().positive().max(1_000_000),
    minBookingAmount: z.coerce.number().min(0).default(0),
    maxDiscount: z.coerce.number().positive().optional(),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
    maxUses: z.coerce.number().int().positive().optional(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.validFrom < data.validUntil, {
    message: 'validUntil must be after validFrom.',
    path: ['validUntil'],
  })
  .refine((data) => data.discountType !== 'percentage' || data.discountValue <= 100, {
    message: 'Percentage discount cannot exceed 100%.',
    path: ['discountValue'],
  });
export type CreateCouponInput = z.infer<typeof createCouponBody>;

// Validate coupon schema
export const validateCouponBody = z.object({
  code: z.string().trim().min(1).toUpperCase(),
  bookingAmount: z.coerce.number().positive(),
});
export type ValidateCouponInput = z.infer<typeof validateCouponBody>;

// Query coupons schema
export const listCouponsQuery = paginationQuery.extend({
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});
export type ListCouponsQuery = z.infer<typeof listCouponsQuery>;
