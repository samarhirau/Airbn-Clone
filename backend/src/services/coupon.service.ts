import { Types, type ClientSession } from 'mongoose';
import { Coupon, type CouponDocument } from '../models/Coupon';
import { AppError, ErrorCodes } from '../utils/errors';
import { getSkip } from '../utils/pagination';
import type { CreateCouponInput, ListCouponsQuery } from '../validators/coupon.validator';

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
  couponId: Types.ObjectId;
}

// Validate coupon against booking amount
export async function validateCoupon(
  code: string,
  bookingAmount: number,
): Promise<CouponValidationResult> {
  const normalizedCode = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: normalizedCode });
  if (!coupon || !coupon.isActive) {
    throw AppError.badRequest('Invalid or inactive coupon code.', ErrorCodes.VALIDATION_ERROR);
  }

  const now = new Date();
  if (now < coupon.validFrom) {
    throw AppError.badRequest('This coupon is not active yet.', ErrorCodes.VALIDATION_ERROR);
  }
  if (now > coupon.validUntil) {
    throw AppError.badRequest('This coupon has expired.', ErrorCodes.VALIDATION_ERROR);
  }

  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    throw AppError.badRequest('This coupon has reached its maximum usage limit.', ErrorCodes.VALIDATION_ERROR);
  }

  if (bookingAmount < coupon.minBookingAmount) {
    throw AppError.badRequest(
      `Booking amount must be at least $${coupon.minBookingAmount} to use this coupon.`,
      ErrorCodes.VALIDATION_ERROR,
    );
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((bookingAmount * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  discountAmount = Math.min(discountAmount, bookingAmount);
  const finalAmount = Math.max(0, bookingAmount - discountAmount);

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    finalAmount,
    couponId: coupon._id as Types.ObjectId,
  };
}

// Increment usage count atomically
export async function recordCouponUsage(couponId: Types.ObjectId, session?: ClientSession): Promise<void> {
  await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } }, { session });
}

// Create new coupon
export async function createCoupon(actorId: string, input: CreateCouponInput): Promise<CouponDocument> {
  const exists = await Coupon.findOne({ code: input.code });
  if (exists) {
    throw AppError.conflict('A coupon with this code already exists.');
  }

  return Coupon.create({
    ...input,
    createdBy: new Types.ObjectId(actorId),
  });
}

// List coupons
export async function listCoupons(opts: ListCouponsQuery): Promise<{ items: CouponDocument[]; total: number }> {
  const filter: Record<string, unknown> = {};
  if (opts.isActive !== undefined) filter.isActive = opts.isActive;

  const [items, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(getSkip(opts.page, opts.limit)).limit(opts.limit),
    Coupon.countDocuments(filter),
  ]);

  return { items, total };
}

// Toggle coupon active flag
export async function toggleCouponActive(couponId: string): Promise<CouponDocument> {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw AppError.notFound('Coupon not found.');
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  return coupon;
}
