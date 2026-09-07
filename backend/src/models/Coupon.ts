import { Schema, model, type Document, type Types } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed';

export interface CouponAttrs {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minBookingAmount: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type CouponDocument = Document<unknown, object, CouponAttrs> & CouponAttrs;

const couponSchema = new Schema<CouponDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: { type: String, required: true, enum: ['percentage', 'fixed'] },
    discountValue: { type: Number, required: true, min: 0 },
    minBookingAmount: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    maxUses: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const Coupon = model<CouponDocument>('Coupon', couponSchema);
