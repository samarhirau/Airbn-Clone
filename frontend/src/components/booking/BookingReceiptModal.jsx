import { X, Printer, Home as HomeIcon, MapPin, Calendar, Users, ShieldCheck } from 'lucide-react';
import { formatPrice } from '../../utils/formatCurrency';

export default function BookingReceiptModal({ booking, onClose }) {
  if (!booking) return null;

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

  const handlePrint = () => {
    window.print();
  };

  const nights = booking.numberOfNights || 1;
  const pricePerNight = booking.pricePerNight || (booking.totalPrice ? Math.round(booking.totalPrice / nights) : 0);
  const baseTotal = nights * pricePerNight;
  const cleaningFee = Math.round(pricePerNight * 0.2);
  const serviceFee = Math.round(baseTotal * 0.14);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-surface-border print:m-0 print:max-w-none print:shadow-none">
        {/* Modal Header */}
        <div className="p-6 border-b border-surface-border flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-airbnb">
            <HomeIcon className="w-6 h-6 stroke-[2.4]" />
            <span className="font-extrabold text-lg tracking-tight text-charcoal">
              StayHub Receipt
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
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Paid in Full
              </span>
            </div>
          </div>

          {/* Property Overview */}
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-charcoal">{property.title || 'Vacation Stay'}</h3>
            <p className="text-sm text-meta flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0 text-meta" />
              <span>
                {[property.location?.city, property.location?.country].filter(Boolean).join(', ') || 'Scenic Destination'}
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
              {booking.guests} guest{booking.guests > 1 ? 's' : ''} · {nights} night{nights > 1 ? 's' : ''}
            </span>
          </div>

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
              <span>Total Paid (USD)</span>
              <span className="text-airbnb">{formatPrice(booking.totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-card border-t border-surface-border flex justify-end print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-charcoal hover:bg-neutral-800 text-white font-semibold text-sm rounded-full transition-all cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
