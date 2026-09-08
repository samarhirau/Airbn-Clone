import mongoose, { Types, type ClientSession } from 'mongoose';
import { Booking, type BookingAttrs, type BookingStatus } from '../models/Booking';
import { Property } from '../models/Property';
import { hasConflictingBooking } from './availability.service';
import { supportsTransactions } from '../config/db';
import { normalizeStay, startOfTodayUtc } from '../utils/dates';
import { AppError, ErrorCodes } from '../utils/errors';
import { getSkip } from '../utils/pagination';
import { invalidateBookingDashboards } from '../cache/invalidation';
import { validateCoupon, recordCouponUsage, type CouponValidationResult } from './coupon.service';
import type { CreateBookingInput } from '../validators/booking.validator';

const PENDING: BookingStatus = 'pending';

interface BookingComputation {
  propertyId: Types.ObjectId;
  ownerId: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  numberOfNights: number;
  pricePerNight: number;
  originalPrice: number;
  discount: number;
  coupon?: Types.ObjectId;
  couponCode?: string;
  totalPrice: number;
}

function isTransientError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { hasErrorLabel?: (l: string) => boolean; code?: number; codeName?: string };
  if (typeof e.hasErrorLabel === 'function' && e.hasErrorLabel('TransientTransactionError')) return true;
  return e.code === 112 || e.codeName === 'WriteConflict';
}

// Validate input, calculate nights, price, and coupon discount
async function prepareBooking(customerId: string, input: CreateBookingInput): Promise<BookingComputation> {
  const stay = normalizeStay(input.checkIn, input.checkOut, { allowPast: false });
  if (!stay.ok) {
    throw AppError.badRequest(stay.error, ErrorCodes.BOOKING_INVALID);
  }

  const property = await Property.findById(input.propertyId).lean();
  if (!property) throw AppError.notFound('Property not found.');
  if (!property.isActive) {
    throw AppError.conflict('This property is not available for booking.', ErrorCodes.BOOKING_INVALID);
  }
  if (String(property.owner) === customerId) {
    throw AppError.badRequest('You cannot book your own property.', ErrorCodes.BOOKING_INVALID);
  }
  if (input.guests > property.maxGuests) {
    throw AppError.badRequest(
      `This property accommodates at most ${property.maxGuests} guests.`,
      ErrorCodes.BOOKING_INVALID,
    );
  }

  const pricePerNight = property.pricePerNight;
  const originalPrice = pricePerNight * stay.nights;

  let discount = 0;
  let couponId: Types.ObjectId | undefined;
  let couponCode: string | undefined;

  if (input.couponCode) {
    const couponResult: CouponValidationResult = await validateCoupon(input.couponCode, originalPrice);
    discount = couponResult.discountAmount;
    couponId = couponResult.couponId;
    couponCode = couponResult.code;
  }

  const totalPrice = Math.max(0, originalPrice - discount);

  return {
    propertyId: property._id,
    ownerId: property.owner as Types.ObjectId,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    guests: input.guests,
    numberOfNights: stay.nights,
    pricePerNight,
    originalPrice,
    discount,
    coupon: couponId,
    couponCode,
    totalPrice,
  };
}

function bookingDoc(customerId: string, c: BookingComputation): Partial<BookingAttrs> {
  return {
    customer: new Types.ObjectId(customerId),
    property: c.propertyId,
    owner: c.ownerId,
    checkIn: c.checkIn,
    checkOut: c.checkOut,
    guests: c.guests,
    numberOfNights: c.numberOfNights,
    pricePerNight: c.pricePerNight,
    originalPrice: c.originalPrice,
    discount: c.discount,
    coupon: c.coupon,
    couponCode: c.couponCode,
    totalPrice: c.totalPrice,
    status: PENDING,
  };
}

// Transactional booking creation
async function createWithTransaction(customerId: string, c: BookingComputation): Promise<BookingAttrs> {
  const session: ClientSession = await mongoose.startSession();
  try {
    let created: BookingAttrs | undefined;
    await session.withTransaction(async () => {
      const prop = await Property.findOneAndUpdate(
        { _id: c.propertyId, isActive: true },
        { $inc: { bookingSeq: 1 } },
        { new: true, session },
      );
      if (!prop) {
        throw AppError.conflict('This property is not available for booking.', ErrorCodes.BOOKING_INVALID);
      }

      const conflict = await hasConflictingBooking(c.propertyId, c.checkIn, c.checkOut, { session });
      if (conflict) {
        throw AppError.conflict('These dates are no longer available.', ErrorCodes.BOOKING_CONFLICT);
      }

      const docs = await Booking.create([bookingDoc(customerId, c)], { session });
      created = docs[0].toObject() as BookingAttrs;

      if (c.coupon) {
        await recordCouponUsage(c.coupon, session);
      }
    });
    return created as BookingAttrs;
  } finally {
    await session.endSession();
  }
}

// Fallback booking creation without transactions
async function createWithoutTransaction(customerId: string, c: BookingComputation): Promise<BookingAttrs> {
  if (await hasConflictingBooking(c.propertyId, c.checkIn, c.checkOut)) {
    throw AppError.conflict('These dates are no longer available.', ErrorCodes.BOOKING_CONFLICT);
  }
  const booking = await Booking.create(bookingDoc(customerId, c));
  const raced = await hasConflictingBooking(c.propertyId, c.checkIn, c.checkOut, {
    excludeBookingId: booking._id,
  });
  if (raced) {
    await Booking.deleteOne({ _id: booking._id });
    throw AppError.conflict('These dates are no longer available.', ErrorCodes.BOOKING_CONFLICT);
  }

  if (c.coupon) {
    await recordCouponUsage(c.coupon);
  }

  return booking.toObject() as BookingAttrs;
}

export async function createBooking(customerId: string, input: CreateBookingInput): Promise<BookingAttrs> {
  const computation = await prepareBooking(customerId, input);

  let booking: BookingAttrs;
  try {
    booking = supportsTransactions()
      ? await createWithTransaction(customerId, computation)
      : await createWithoutTransaction(customerId, computation);
  } catch (err) {
    if (isTransientError(err)) {
      throw AppError.conflict('Could not secure these dates, please try again.', ErrorCodes.BOOKING_CONFLICT);
    }
    throw err;
  }

  await invalidateBookingDashboards(String(computation.ownerId));
  return booking;
}

export interface ListBookingsOptions {
  status?: BookingStatus;
  page: number;
  limit: number;
}

export async function listMyBookings(
  customerId: string,
  opts: ListBookingsOptions,
): Promise<{ items: unknown[]; total: number }> {
  const filter: Record<string, unknown> = { customer: new Types.ObjectId(customerId) };
  if (opts.status) filter.status = opts.status;

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(getSkip(opts.page, opts.limit))
      .limit(opts.limit)
      .populate('property', 'title location.city images pricePerNight ratingAvg')
      .lean(),
    Booking.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getBookingById(bookingId: string, actorId: string, actorRole: string): Promise<unknown> {
  const booking = await Booking.findById(bookingId)
    .populate('property', 'title location pricePerNight images owner')
    .lean();
  if (!booking) throw AppError.notFound('Booking not found.');

  const isCustomer = String(booking.customer) === actorId;
  const isOwner = String(booking.owner) === actorId;
  if (!isCustomer && !isOwner && actorRole !== 'admin') {
    throw AppError.forbidden('You do not have access to this booking.');
  }
  return booking;
}

export async function cancelBooking(
  bookingId: string,
  actorId: string,
  actorRole: string,
  reason?: string,
): Promise<BookingAttrs> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found.');

  const isCustomer = String(booking.customer) === actorId;
  if (!isCustomer && actorRole !== 'admin') {
    throw AppError.forbidden('You cannot cancel this booking.');
  }

  if (booking.status === 'cancelled') {
    throw AppError.conflict('This booking is already cancelled.', ErrorCodes.BOOKING_INVALID);
  }
  if (booking.status === 'completed') {
    throw AppError.conflict('A completed stay cannot be cancelled.', ErrorCodes.BOOKING_INVALID);
  }
  if (startOfTodayUtc().getTime() >= booking.checkIn.getTime()) {
    throw AppError.conflict('Bookings can only be cancelled before the check-in date.', ErrorCodes.BOOKING_INVALID);
  }

  booking.status = 'cancelled';
  booking.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: new Types.ObjectId(actorId),
    reason: reason ?? null,
  };
  await booking.save();

  await invalidateBookingDashboards(String(booking.owner));
  return booking.toObject() as BookingAttrs;
}
