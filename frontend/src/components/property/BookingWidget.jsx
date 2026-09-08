import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronDown, Loader2, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

// Helper to format Date to YYYY-MM-DD
function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function BookingWidget({ property }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Initial date defaults: tomorrow & 5 days after tomorrow
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  const defaultCheckOut = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d;
  }, []);

  const todayStr = useMemo(() => toDateInputValue(new Date()), []);
  const [checkIn, setCheckIn] = useState(toDateInputValue(tomorrow));
  const [checkOut, setCheckOut] = useState(toDateInputValue(defaultCheckOut));
  const [guests, setGuests] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [validatedCoupon, setValidatedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const propertyId = property?.id || property?._id;
  const pricePerNight = property?.pricePerNight || 0;
  const maxGuests = property?.maxGuests || 4;
  const isHostOfProperty = Boolean(user && (user.id === property?.owner || user._id === property?.owner));

  // Compute stay duration in nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const diff = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  // Pricing calculations
  const basePrice = nights * pricePerNight;
  const cleaningFee = property?.cleaningFee || Math.round(pricePerNight * 0.2);
  const serviceFee = Math.round(basePrice * 0.14);
const subtotalPrice = basePrice + cleaningFee + serviceFee;
  const discountAmount = validatedCoupon?.discountAmount || 0;
  const totalPrice = Math.max(0, subtotalPrice - discountAmount);

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponCode.trim()) return;

    if (!isAuthenticated) {
      toast('Please log in to apply discount coupons', {
        icon: '🔒',
        className: 'airbnb-toast',
      });
      return;
    }

    setValidatingCoupon(true);
    setError('');

    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode.trim().toUpperCase(),
        bookingAmount: subtotalPrice,
      });

      const couponData = res?.data || res;
      if (couponData?.valid) {
        setValidatedCoupon(couponData);
        toast.success(
          `Coupon ${couponData.code} applied! Saved ${formatPrice(couponData.discountAmount)}`,
          { className: 'airbnb-toast' }
        );
      }
    } catch (err) {
      setValidatedCoupon(null);
      const msg = getErrorMessage(err);
      toast.error(msg, { className: 'airbnb-toast' });
      setError(msg);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setValidatedCoupon(null);
    setCouponCode('');
  };

  const handleCheckInChange = (e) => {
    const newIn = e.target.value;
    setCheckIn(newIn);
    setError('');
    // Automatically advance checkOut if it's earlier than or equal to new checkIn
    if (newIn >= checkOut) {
      const nextDay = new Date(newIn);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(toDateInputValue(nextDay));
    }
  };

  const handleCheckOutChange = (e) => {
    setCheckOut(e.target.value);
    setError('');
  };

  const handleReserve = async (e) => {
    e.preventDefault();

    // 1. Auth Guard: prompt unauthenticated users to log in
    if (!isAuthenticated) {
      toast('Please log in or sign up to reserve this stay.', {
        icon: '🔑',
        className: 'airbnb-toast',
      });
      navigate(`/login?redirect=/properties/${propertyId}`, {
        state: { from: { pathname: `/properties/${propertyId}` } },
      });
      return;
    }

    // 2. Ownership Guard: hosts cannot book their own property
    if (isHostOfProperty) {
      toast.error('You cannot reserve your own property listing.', { className: 'airbnb-toast' });
      return;
    }

    if (nights <= 0) {
      setError('Check-out date must be after check-in date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        propertyId,
        checkIn: new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
        guests: Number(guests),
      };

      if (couponCode.trim()) {
        payload.couponCode = couponCode.trim().toUpperCase();
      }

      const response = await api.post('/bookings', payload);
      const booking = response?.data?.booking || response?.booking;

      toast.success('Reservation confirmed! View details in My Trips.', {
        className: 'airbnb-toast',
      });

      navigate('/bookings', { state: { payBooking: booking } });

    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg, { className: 'airbnb-toast' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sticky top-28 bg-white border border-surface-border rounded-3xl p-6 sm:p-7 shadow-xl">
      {/* Price & Rating Header */}
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <span className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            {formatPrice(pricePerNight)}
          </span>
          <span className="text-meta text-sm font-normal"> / night</span>
        </div>

        {property?.ratingCount > 0 ? (
          <div className="flex items-center gap-1 text-sm font-semibold text-charcoal">
            <Star className="w-4 h-4 fill-charcoal text-charcoal" />
            <span>{Number(property?.ratingAvg || 0).toFixed(2)}</span>
            <span className="text-meta">({property.ratingCount})</span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-meta bg-surface-card px-2.5 py-1 rounded-full">
            New Listing
          </span>
        )}
      </div>

      {/* Date & Guest Picker Box */}
      <form onSubmit={handleReserve}>
        <div className="border border-surface-border rounded-2xl overflow-hidden mb-4 divide-y divide-surface-border">
          {/* Dual Date Inputs */}
          <div className="grid grid-cols-2 divide-x divide-surface-border">
            <div className="p-3">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-charcoal">
                Check-in
              </label>
              <input
                type="date"
                min={todayStr}
                value={checkIn}
                onChange={handleCheckInChange}
                required
                className="w-full text-xs sm:text-sm font-medium text-charcoal bg-transparent outline-none cursor-pointer pt-0.5"
              />
            </div>
            <div className="p-3">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-charcoal">
                Checkout
              </label>
              <input
                type="date"
                min={checkIn || todayStr}
                value={checkOut}
                onChange={handleCheckOutChange}
                required
                className="w-full text-xs sm:text-sm font-medium text-charcoal bg-transparent outline-none cursor-pointer pt-0.5"
              />
            </div>
          </div>

          {/* Guests Selector */}
          <div className="p-3">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-charcoal">
              Guests
            </label>
            <div className="relative">
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full text-xs sm:text-sm font-medium text-charcoal bg-transparent outline-none cursor-pointer appearance-none pr-6 pt-0.5"
              >
                {Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'guest' : 'guests'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-meta absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

                {/* Coupon Code Box with Live Validation */}
        <div className="mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-meta">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={couponCode}
                disabled={Boolean(validatedCoupon)}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Coupon code (optional)"
                className="w-full pl-8 pr-3 py-2 text-xs font-semibold border border-surface-border rounded-xl focus:border-charcoal outline-none bg-surface-card/40 disabled:bg-emerald-50 disabled:text-emerald-800 disabled:border-emerald-300 transition-colors"
              />
            </div>
            {validatedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || validatingCoupon}
                className="px-3 py-2 text-xs font-bold bg-charcoal hover:bg-neutral-800 text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
              >
                {validatingCoupon ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span>Apply</span>
                )}
              </button>
            )}
          </div>
          {validatedCoupon && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {validatedCoupon.code} applied ({validatedCoupon.discountType === 'percentage' ? `${validatedCoupon.discountValue}% OFF` : `-$${validatedCoupon.discountValue}`})
              </span>
            </div>
          )}
        </div>


        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Host Warning Notice */}
        {isHostOfProperty && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>You are the host of this property listing.</span>
          </div>
        )}

        {/* Reserve CTA Button */}
        <button
          type="submit"
          disabled={loading || isHostOfProperty}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-base text-white bg-airbnb hover:bg-airbnb-dark active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Reserving...</span>
            </>
          ) : isHostOfProperty ? (
            <span>Manage Listing</span>
          ) : (
            <span>Reserve</span>
          )}
        </button>

        <p className="text-center text-xs text-meta mt-3 font-normal">
          You won't be charged yet
        </p>

        {/* Price Breakdown */}
        {nights > 0 && (
          <div className="mt-6 pt-6 border-t border-surface-border space-y-3 text-sm text-charcoal">
            <div className="flex justify-between">
              <span className="underline decoration-surface-border hover:decoration-charcoal cursor-pointer">
                {formatPrice(pricePerNight)} x {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
              <span>{formatPrice(basePrice)}</span>
            </div>

            <div className="flex justify-between">
              <span className="underline decoration-surface-border hover:decoration-charcoal cursor-pointer">
                Cleaning fee
              </span>
              <span>{formatPrice(cleaningFee)}</span>
            </div>

            <div className="flex justify-between">
              <span className="underline decoration-surface-border hover:decoration-charcoal cursor-pointer">
                StayHub service fee
              </span>
              <span>{formatPrice(serviceFee)}</span>
            </div>

               {validatedCoupon && (
              <div className="flex justify-between font-bold text-emerald-600">
                <span>Coupon discount ({validatedCoupon.code})</span>
                <span>-{formatPrice(validatedCoupon.discountAmount)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-surface-border flex justify-between font-extrabold text-base text-charcoal">
              <span>Total before taxes</span>
                <span className={validatedCoupon ? 'text-emerald-600' : ''}>
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
