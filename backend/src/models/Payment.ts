import { Schema, model, type Document, type Types } from 'mongoose';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'upi' | 'wallet' | 'mock' | 'razorpay' | 'netbanking';

export interface PaymentAttrs {
  booking: Types.ObjectId;
  customer: Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId: string;
  gateway: string;
  orderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paidAt?: Date;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = Document<unknown, object, PaymentAttrs> & PaymentAttrs;

const paymentSchema = new Schema<PaymentDocument>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['card', 'upi', 'wallet', 'mock', 'razorpay', 'netbanking'],
      default: 'card',
    },
    transactionId: { type: String, required: true, unique: true, index: true },
    gateway: { type: String, default: 'mock' },
    orderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String },
    paidAt: { type: Date },
    receiptUrl: { type: String },
  },
  { timestamps: true },
);

export const Payment = model<PaymentDocument>('Payment', paymentSchema);
