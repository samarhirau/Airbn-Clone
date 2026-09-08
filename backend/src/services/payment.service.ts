import { Types } from 'mongoose';
import { Payment, type PaymentDocument, type PaymentMethod } from '../models/Payment';
import { Booking } from '../models/Booking';
import { AppError } from '../utils/errors';
import {
  getRazorpayClient,
  getRazorpayKeyId,
  verifyRazorpaySignature,
  isRazorpayTestMode,
} from '../config/razorpay';
import { logger } from '../config/logger';

export interface PaymentIntentResult {
  paymentId: string;
  transactionId: string;
  orderId?: string;
  amount: number;
  displayAmount?: number;
  baseAmount?: number;
  currency: string;
  keyId?: string;
  isTestMode?: boolean;
  gateway: string;
  status: string;
}

export interface VerifyPaymentParams {
  transactionId?: string;
  status?: 'completed' | 'failed';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

const INR_EXCHANGE_RATE = 83.5;

// Create a payment intent / order for a booking
export async function createPaymentIntent(
  customerId: string,
  bookingId: string,
  paymentMethod: PaymentMethod = 'razorpay',
  preferredCurrency = 'INR',
): Promise<PaymentIntentResult> {
  const currency = preferredCurrency.toUpperCase() === 'USD' ? 'USD' : 'INR';
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

  const razorpay = getRazorpayClient();

  // If Razorpay is configured, create an official Razorpay order
  if (razorpay) {
    try {
      const isUsd = currency === 'USD';
      const chargeAmount = isUsd
        ? booking.totalPrice
        : Math.max(1, Math.round(booking.totalPrice * INR_EXCHANGE_RATE));
      const amountInSubunits = Math.round(chargeAmount * 100);

      const order = await razorpay.orders.create({
        amount: amountInSubunits,
        currency,
        receipt: `rcpt_${String(booking._id).slice(-10)}`,
        notes: {
          bookingId: String(booking._id),
          customerId: String(customerId),
        },
      });

      const payment = await Payment.create({
        booking: booking._id,
        customer: new Types.ObjectId(customerId),
        amount: chargeAmount,
        currency,
        status: 'pending',
        paymentMethod: paymentMethod || 'razorpay',
        transactionId: order.id,
        orderId: order.id,
        gateway: 'razorpay',
      });

      return {
        paymentId: String(payment._id),
        transactionId: order.id,
        orderId: order.id,
        amount: Number(order.amount),
        displayAmount: chargeAmount,
        baseAmount: booking.totalPrice,
        currency,
        keyId: getRazorpayKeyId(),
        isTestMode: isRazorpayTestMode,
        gateway: 'razorpay',
        status: payment.status,
      };
    } catch (err: any) {
      logger.error({ err }, 'Razorpay order creation failed');
      const errorDesc =
        err?.error?.description ||
        err?.message ||
        'Razorpay order creation failed';
      throw AppError.badRequest(`Razorpay Error: ${errorDesc}. Please check your Key ID and Secret.`);
    }
  }

  // Graceful fallback to simulated transaction (if Razorpay keys are not yet provided)
  const transactionId = 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const payment = await Payment.create({
    booking: booking._id,
    customer: new Types.ObjectId(customerId),
    amount: booking.totalPrice,
    currency: 'USD',
    status: 'pending',
    paymentMethod: paymentMethod || 'mock',
    transactionId,
    gateway: 'mock',
  });

  return {
    paymentId: String(payment._id),
    transactionId: payment.transactionId,
    amount: payment.amount,
    baseAmount: booking.totalPrice,
    currency: payment.currency,
    keyId: getRazorpayKeyId(),
    isTestMode: isRazorpayTestMode,
    gateway: 'mock',
    status: payment.status,
  };
}

// Verify payment completion
export async function verifyPayment(
  customerId: string,
  params: VerifyPaymentParams,
): Promise<PaymentDocument> {
  const {
    transactionId,
    status = 'completed',
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = params;

  // 1. Razorpay signature verification flow
  if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    if (!isValid) {
      // Record failure if payment exists
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: 'failed' },
      );
      throw AppError.badRequest('Razorpay payment signature verification failed.');
    }

    const payment = await Payment.findOne({
      $or: [{ orderId: razorpay_order_id }, { transactionId: razorpay_order_id }],
    });

    if (!payment) {
      throw AppError.notFound('Associated payment record not found.');
    }

    if (String(payment.customer) !== customerId) {
      throw AppError.forbidden('You are not authorized to verify this payment.');
    }

    payment.status = 'completed';
    payment.paidAt = new Date();
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    await Booking.findByIdAndUpdate(payment.booking, { status: 'confirmed' });
    return payment;
  }

  // 2. Direct / Mock verification flow
  const lookupId = transactionId || razorpay_order_id;
  if (!lookupId) {
    throw AppError.badRequest('Transaction identifier is required for verification.');
  }

  const payment = await Payment.findOne({
    $or: [{ transactionId: lookupId }, { orderId: lookupId }],
  });
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
