import { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Home as HomeIcon,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';

export default function BookingReceiptModal({ booking, onClose, onPay }) {

  if (!booking) return null;

  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(true);

  const property = booking.property || {};
  const bookingId = booking.id || booking._id || '';
  const confirmationCode = `STAY-${bookingId.slice(-6).toUpperCase()}`;

  const checkInDate = booking.checkIn
    ? new Date(booking.checkIn).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  const checkOutDate = booking.checkOut
    ? new Date(booking.checkOut).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  const bookedOn = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';
  // Fetch payment record if available
  useEffect(() => {
    let isMounted = true;
    const fetchPayment = async () => {
      setLoadingPayment(true);
      try {
        const res = await api.get(`/payments/booking/${bookingId}`);
        const p = res?.data?.payment || res?.payment;
        if (isMounted && p) {
          setPaymentInfo(p);
        }
      } catch (err) {
        // Payment record might not exist yet if pending
      } finally {
        if (isMounted) setLoadingPayment(false);
      }
    };

    fetchPayment();
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  const nights = booking.numberOfNights || 1;
  const pricePerNight =
    booking.pricePerNight ||
    (booking.totalPrice ? Math.round(booking.totalPrice / nights) : 0);
  const baseTotal = nights * pricePerNight;
  const cleaningFee = Math.round(pricePerNight * 0.2);
  const serviceFee = Math.round(baseTotal * 0.14);

  const isPaid =
    paymentInfo?.status === 'completed' ||
    booking.status === 'confirmed' ||
    booking.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-surface-border print:m-0 print:max-w-none print:shadow-none">

        {/* Modal Header */}
        <div className="p-6 border-b border-surface-border flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-airbnb">
            <HomeIcon className="w-6 h-6 stroke-[2.4]" />
            <span className="font-extrabold text-lg tracking-tight text-charcoal">
              StayHub Official Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2.5 rounded-full hover:bg-surface-card text-charcoal transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-surface-card text-charcoal transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-charcoal">
          {/* Top Receipt Details */}
          <div className="flex items-start justify-between border-b border-surface-border pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-meta">
                Confirmation Code
              </p>
              <p className="text-2xl font-extrabold text-charcoal tracking-tight font-mono mt-0.5">
                {confirmationCode}
              </p>
              <p className="text-xs text-meta mt-1">Booked on {bookedOn}</p>
            </div>
            <div className="text-right">
              {isPaid ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Paid in Full
              </span>
                    ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  Payment Due
                </span>
              )}
            </div>
          </div>

          {/* Property Overview */}
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-charcoal">{property.title || 'Vacation Stay'}</h3>
            <p className="text-sm text-meta flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0 text-meta" />
              <span>
                 {[property.location?.city, property.location?.country].filter(Boolean).join(', ') ||
                  'Scenic Destination'}
              </span>
            </p>
          </div>

          {/* Stay Dates & Guests Cards */}
          <div className="grid grid-cols-2 gap-3 bg-surface-card/60 p-4 rounded-2xl border border-surface-border">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-meta flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Check-in
              </p>
              <p className="text-sm font-bold text-charcoal mt-1">{checkInDate}</p>
              <p className="text-xs text-meta">After 3:00 PM</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-meta flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Checkout
              </p>
              <p className="text-sm font-bold text-charcoal mt-1">{checkOutDate}</p>
              <p className="text-xs text-meta">Before 11:00 AM</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-meta">
            <Users className="w-4 h-4 text-meta" />
            <span>
              {booking.guests} guest{booking.guests > 1 ? 's' : ''} · {nights} night
              {nights > 1 ? 's' : ''}
            </span>
          </div>

 {/* Payment Transaction Details Card */}
          {paymentInfo && (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-surface-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-meta font-medium">Gateway Reference:</span>
                <span className="font-mono font-bold text-charcoal">
                  {paymentInfo.transactionId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-meta font-medium">Payment Channel:</span>
                <span className="capitalize font-bold text-charcoal flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-airbnb" />
                  {paymentInfo.paymentMethod}
                </span>
              </div>
              {paymentInfo.paidAt && (
                <div className="flex items-center justify-between">
                  <span className="text-meta font-medium">Timestamp:</span>
                  <span className="text-charcoal font-medium">
                    {new Date(paymentInfo.paidAt).toLocaleString('en-US')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Itemized Price Breakdown */}
          <div className="pt-4 border-t border-surface-border space-y-3 text-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-meta mb-2">
              Payment Summary
            </h4>

            <div className="flex justify-between">
              <span className="text-meta">
                {formatPrice(pricePerNight)} x {nights} nights
              </span>
              <span className="font-semibold text-charcoal">{formatPrice(baseTotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-meta">Cleaning fee</span>
              <span className="font-semibold text-charcoal">{formatPrice(cleaningFee)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-meta">StayHub service fee</span>
              <span className="font-semibold text-charcoal">{formatPrice(serviceFee)}</span>
            </div>

            {booking.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon discount</span>
                <span>-{formatPrice(booking.discountAmount)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-surface-border flex justify-between font-extrabold text-lg text-charcoal">
             <span>{isPaid ? 'Total Paid (USD)' : 'Total Due (USD)'}</span>
              <span className={isPaid ? 'text-emerald-600' : 'text-airbnb'}>
                {formatPrice(booking.totalPrice)}
              </span>
            </div>
          </div>

          {/* QR Verification Pass */}
          <div className="pt-4 border-t border-surface-border flex items-center gap-4 bg-surface-card/40 p-4 rounded-2xl border">
            <div className="w-16 h-16 bg-white p-1.5 rounded-xl border border-surface-border shadow-xs shrink-0 flex items-center justify-center">
              <QrCode className="w-full h-full text-charcoal" />
            </div>
            <div>
              <p className="text-xs font-bold text-charcoal flex items-center gap-1">
                <span>Digital Check-in Pass</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </p>
              <p className="text-[11px] text-meta mt-0.5 leading-relaxed">
                Present this QR code or confirmation code {confirmationCode} at check-in for instant keyless entry.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
         <div className="p-4 bg-surface-card border-t border-surface-border flex items-center justify-between print:hidden">
          {!isPaid && onPay ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onPay(booking);
              }}
              className="px-5 py-2.5 bg-airbnb hover:bg-airbnb-dark text-white font-bold text-xs rounded-full shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Now ({formatPrice(booking.totalPrice)})</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Verified Transaction
            </span>
          )}
          
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-surface-border hover:bg-neutral-100 text-charcoal font-semibold text-xs rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Itinerary</span>
            </button>


          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-charcoal hover:bg-neutral-800 text-white font-semibold text-xs rounded-full transition-all cursor-pointer shadow-xs"
            

          >
            Close
          </button>
           </div>
        </div>
      </div>
    </div>
  );
}
