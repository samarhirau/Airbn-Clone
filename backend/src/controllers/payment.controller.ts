import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as paymentService from '../services/payment.service';
import type { CreatePaymentIntentInput, VerifyPaymentInput } from '../validators/payment.validator';
import { getRazorpayKeyId, isRazorpayConfigured, isRazorpayTestMode } from '../config/razorpay';

// Get public payment configuration
export const getConfig = asyncHandler(async (_req: Request, res: Response) => {
  return sendSuccess(res, {
    keyId: getRazorpayKeyId() || null,
    isConfigured: isRazorpayConfigured,
    isTestMode: isRazorpayTestMode,
    gateway: isRazorpayConfigured ? 'razorpay' : 'mock',
  });
});

// Create payment intent / order
export const createIntent = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreatePaymentIntentInput;
  const result = await paymentService.createPaymentIntent(
    req.user!.id,
    input.bookingId,
    input.paymentMethod,
    input.currency,
  );
  return sendSuccess(res, result, 201);
});

// Verify payment completion
export const verify = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as VerifyPaymentInput;
  const payment = await paymentService.verifyPayment(req.user!.id, input);
  return sendSuccess(res, { payment });
});

// Get payment for booking
export const getByBooking = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.getPaymentByBookingId(
    req.params.bookingId.toString(),
    req.user!.id,
    req.user!.role,
  );
  return sendSuccess(res, { payment });
});
