import mongoose, { Schema, Types, type InferSchemaType, type Model } from 'mongoose';

export const BookingStatuses = ['pending', 'confirmed', 'cancelled', 'completed'] as const;
export type BookingStatus = (typeof BookingStatuses)[number];

/** Statuses that occupy the calendar and therefore block overlapping bookings. */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['pending', 'confirmed'];

const bookingSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    // Denormalized owner id so owner dashboards can query bookings without a join.
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Normalized to UTC midnight. Stay covers nights [checkIn, checkOut).
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },

    guests: { type: Number, required: true, min: 1 },
    numberOfNights: { type: Number, required: true, min: 1 },
    // Price snapshot at booking time (owner may change the listing price later).
    pricePerNight: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    status: { type: String, enum: BookingStatuses, default: 'confirmed', required: true },

    cancellation: {
      cancelledAt: { type: Date, default: null },
      cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      reason: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────────
// Overlap detection: find active bookings for a property intersecting a range.
bookingSchema.index({ property: 1, status: 1, checkIn: 1, checkOut: 1 });
// "My bookings" listing.
bookingSchema.index({ customer: 1, createdAt: -1 });
// Owner dashboards / property bookings.
bookingSchema.index({ owner: 1, status: 1 });
// Completion job: find active stays whose checkout has passed.
bookingSchema.index({ status: 1, checkOut: 1 });

export type BookingAttrs = InferSchemaType<typeof bookingSchema> & { _id: Types.ObjectId };
export const Booking: Model<BookingAttrs> =
  (mongoose.models.Booking as Model<BookingAttrs>) || mongoose.model<BookingAttrs>('Booking', bookingSchema);
