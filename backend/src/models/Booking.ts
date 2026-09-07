import { Schema, model, type Document, type Types } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export const BookingStatuses: [BookingStatus, ...BookingStatus[]] = [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
];

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['pending', 'confirmed'];

export interface CancellationInfo {
  cancelledAt: Date;
  cancelledBy: Types.ObjectId;
  reason?: string | null;
}

export interface BookingAttrs {
  _id: Types.ObjectId;
  customer: Types.ObjectId;
  property: Types.ObjectId;
  owner: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  numberOfNights: number;
  pricePerNight: number;
  originalPrice?: number;
  discount?: number;
  coupon?: Types.ObjectId;
  couponCode?: string;
  totalPrice: number;
  status: BookingStatus;
  cancellation?: CancellationInfo;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingDocument = Document<unknown, object, BookingAttrs> & BookingAttrs;

const cancellationSchema = new Schema<CancellationInfo>(
  {
    cancelledAt: { type: Date, required: true },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, maxlength: 500, default: null },
  },
  { _id: false },
);

const bookingSchema = new Schema<BookingDocument>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    numberOfNights: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    couponCode: { type: String, uppercase: true, trim: true },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: BookingStatuses,
      default: 'confirmed',
      index: true,
    },
    cancellation: { type: cancellationSchema, default: undefined },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

bookingSchema.index({ property: 1, status: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ customer: 1, status: 1, createdAt: -1 });
bookingSchema.index({ owner: 1, status: 1, createdAt: -1 });

export const Booking = model<BookingDocument>('Booking', bookingSchema);
