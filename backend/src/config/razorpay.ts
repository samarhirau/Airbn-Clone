import Razorpay from 'razorpay';
import crypto from 'crypto';
import { logger } from './logger';

const keyId = process.env.RAZORPAY_KEY_ID?.trim();
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

export const isRazorpayConfigured = Boolean(keyId && keySecret);
export const isRazorpayTestMode = Boolean(keyId && keyId.startsWith('rzp_test_'));

let razorpayClient: Razorpay | null = null;

if (isRazorpayConfigured) {
  try {
    razorpayClient = new Razorpay({
      key_id: keyId!,
      key_secret: keySecret!,
    });
    logger.info(
      `Razorpay payment gateway initialized in ${isRazorpayTestMode ? 'TEST' : 'LIVE'} mode`
    );
  } catch (err) {
    logger.error({ err }, 'Failed to initialize Razorpay instance');
  }
} else {
  logger.warn('Razorpay credentials not provided. Using fallback mock payment simulation.');
}

export function getRazorpayClient(): Razorpay | null {
  return razorpayClient;
}

export function getRazorpayKeyId(): string | undefined {
  return keyId;
}

/**
 * Verify Razorpay payment signature using HMAC SHA256
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!keySecret) return false;

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Verify Razorpay webhook signature using webhook secret
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}
