import { Types } from 'mongoose';
import { Payment, type PaymentDocument, type PaymentMethod } from '../models/Payment';
import { Booking } from '../models/Booking';
import { AppError } from '../utils/errors';

export interface PaymentIntentResult {
  paymentId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
}

// Create a payment intent / order for a booking
export async function createPaymentIntent(
  customerId: string,
  bookingId: string,
  paymentMethod: PaymentMethod = 'card',
): Promise<PaymentIntentResult> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found.');

  if (String(booking.customer) !== customerId) {
    throw AppError.forbidden('You can only pay for your own bookings.');
  }

  if (booking.status === 'cancelled') {
    throw AppError.badRequest('Cannot pay for a cancelled booking.');
  }

  const existingPayment = await Payment.findOne({
    booking: booking._id,
    status: 'completed',
  });
  if (existingPayment) {
    throw AppError.conflict('This booking has already been paid for.');
  }

  const transactionId = 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

  const payment = await Payment.create({
    booking: booking._id,
    customer: new Types.ObjectId(customerId),
    amount: booking.totalPrice,
    currency: 'USD',
    status: 'pending',
    paymentMethod,
    transactionId,
    gateway: 'mock',
  });

  return {
    paymentId: String(payment._id),
    transactionId: payment.transactionId,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
  };
}

// Verify payment completion
export async function verifyPayment(
  customerId: string,
  transactionId: string,
  status: 'completed' | 'failed' = 'completed',
): Promise<PaymentDocument> {
  const payment = await Payment.findOne({ transactionId });
  if (!payment) throw AppError.notFound('Payment record not found.');

  if (String(payment.customer) !== customerId) {
    throw AppError.forbidden('You are not authorized to verify this payment.');
  }

  payment.status = status;
  if (status === 'completed') {
    payment.paidAt = new Date();
  }
  await payment.save();

  if (status === 'completed') {
    await Booking.findByIdAndUpdate(payment.booking, { status: 'confirmed' });
  }

  return payment;
}

// Get payment info for a booking
export async function getPaymentByBookingId(
  bookingId: string,
  actorId: string,
  role: string,
): Promise<PaymentDocument | null> {
  const payment = await Payment.findOne({ booking: bookingId }).lean<PaymentDocument | null>();
  if (!payment) return null;

  if (role !== 'admin' && String(payment.customer) !== actorId) {
    throw AppError.forbidden('Access denied to payment record.');
  }

  return payment;
}
