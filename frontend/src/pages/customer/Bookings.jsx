import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Compass,
  Calendar,
  MapPin,
  FileText,
  XCircle,
  Sparkles,
  Loader2,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';
import BookingStatusBadge from '../../components/booking/BookingStatusBadge';
import BookingReceiptModal from '../../components/booking/BookingReceiptModal';
import CancelBookingModal from '../../components/booking/CancelBookingModal';
import WriteReviewModal from '../../components/booking/WriteReviewModal';

export default function Bookings() {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'upcoming' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');

  // Active Modals State
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [reviewingBooking, setReviewingBooking] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/bookings');
      const items = response?.data?.bookings || response?.bookings || [];
      setBookings(items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Handle local state update when a booking is cancelled
  const handleBookingCancelled = (updatedBooking) => {
    setBookings((prev) =>
      prev.map((b) => ((b.id || b._id) === (updatedBooking.id || updatedBooking._id) ? updatedBooking : b))
    );
  };

  // Filter bookings based on active status tab and search query
  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter((booking) => {
      const status = booking.status?.toLowerCase();
      const checkOutDate = booking.checkOut ? new Date(booking.checkOut) : null;

      // 1. Tab matching
      if (activeTab === 'upcoming') {
        if (status === 'cancelled' || status === 'completed') return false;
        if (checkOutDate && checkOutDate < now) return false;
      } else if (activeTab === 'completed') {
        const isPast = checkOutDate && checkOutDate < now;
        if (status !== 'completed' && !isPast) return false;
        if (status === 'cancelled') return false;
      } else if (activeTab === 'cancelled') {
        if (status !== 'cancelled') return false;
      }

      // 2. Search query matching
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const title = booking.property?.title?.toLowerCase() || '';
        const city = booking.property?.location?.city?.toLowerCase() || '';
        if (!title.includes(query) && !city.includes(query)) return false;
      }

      return true;
    });
  }, [bookings, activeTab, searchQuery]);

  // Unauthenticated Guard
  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-airbnb/10 text-airbnb flex items-center justify-center mb-4">
          <Briefcase className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight mb-2">
          Sign in to view your trips
        </h2>
        <p className="text-sm text-meta max-w-sm mb-6">
          You can view reservations, check receipts, and manage upcoming getaways once you log in.
        </p>
        <Link
          to="/login?redirect=/bookings"
          className="px-8 py-3.5 bg-airbnb hover:bg-airbnb-dark text-white rounded-full font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          Log in to StayHub
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
            Trips & Reservations
          </h1>
          <p className="mt-1 text-sm text-meta">
            Keep track of your adventures, view invoices, and manage stays.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-meta absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city or property..."
            className="w-full pl-10 pr-4 py-2 text-sm font-medium border border-surface-border rounded-full outline-none focus:border-charcoal bg-surface-card/40 transition-colors"
          />
        </div>
      </div>

      {/* 2. Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-4 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Trips' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-charcoal text-white shadow-xs'
                : 'bg-surface-card hover:bg-neutral-200/70 text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Bookings Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-48 bg-neutral-200 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center max-w-lg mx-auto">
          <p className="text-sm font-semibold text-rose-600 mb-4">{error}</p>
          <button
            onClick={fetchBookings}
            className="px-6 py-2.5 bg-charcoal text-white rounded-full text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        /* Empty State */
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-8 bg-surface-card/30 border border-surface-border rounded-3xl max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-airbnb/10 text-airbnb flex items-center justify-center mb-4">
            <Compass className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h3 className="text-xl font-bold text-charcoal mb-1">
            {searchQuery ? 'No matching trips found' : 'No trips booked... yet!'}
          </h3>
          <p className="text-xs sm:text-sm text-meta max-w-sm mb-6 leading-relaxed">
            {searchQuery
              ? 'Try changing your search terms or view all trips.'
              : 'Time to dust off your bags and start planning your next great adventure around the world.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm rounded-full transition-all shadow-sm"
          >
            <span>Start exploring stays</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      ) : (
        /* Trips List / Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBookings.map((booking) => {
            const property = booking.property || {};
            const propertyId = property.id || property._id;
            const thumbnail =
              property.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80';

            const checkInFormatted = booking.checkIn
              ? new Date(booking.checkIn).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'TBD';

            const checkOutFormatted = booking.checkOut
              ? new Date(booking.checkOut).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'TBD';

            const isCancellable =
              booking.status !== 'cancelled' &&
              booking.status !== 'completed' &&
              new Date(booking.checkIn) > new Date();

            const isCompleted =
              booking.status === 'completed' ||
              (booking.status !== 'cancelled' && new Date(booking.checkOut) < new Date());

            return (
              <div
                key={booking.id || booking._id}
                className="bg-white border border-surface-border rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-5"
              >
                {/* Property Thumbnail */}
                <Link
                  to={`/properties/${propertyId}`}
                  className="sm:w-44 h-40 rounded-2xl overflow-hidden bg-surface-card shrink-0 relative group block"
                >
                  <img
                    src={thumbnail}
                    alt={property.title || 'Property'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <BookingStatusBadge status={booking.status} />
                  </div>
                </Link>

                {/* Trip Details */}
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-meta flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{property.location?.city || 'Worldwide'}</span>
                      </p>
                      <span className="font-extrabold text-base text-charcoal">
                        {formatPrice(booking.totalPrice)}
                      </span>
                    </div>

                    <Link
                      to={`/properties/${propertyId}`}
                      className="text-base font-bold text-charcoal hover:text-airbnb transition-colors line-clamp-1 mt-1 block"
                    >
                      {property.title || 'Reserved Stay'}
                    </Link>

                    <p className="text-xs text-meta mt-1.5 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {checkInFormatted} – {checkOutFormatted} · {booking.numberOfNights || 1} nights
                      </span>
                    </p>
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="pt-3 border-t border-surface-border flex flex-wrap items-center gap-2">
                    {/* View Receipt */}
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(booking)}
                      className="px-3.5 py-1.5 rounded-full border border-surface-border hover:border-charcoal text-xs font-semibold text-charcoal transition-colors flex items-center gap-1.5 cursor-pointer bg-white"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>

                    {/* Leave Review for completed stays */}
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => setReviewingBooking(booking)}
                        className="px-3.5 py-1.5 rounded-full bg-airbnb-light text-airbnb hover:bg-airbnb/20 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Leave Review</span>
                      </button>
                    )}

                    {/* Cancel Reservation */}
                    {isCancellable && (
                      <button
                        type="button"
                        onClick={() => setCancellingBooking(booking)}
                        className="px-3.5 py-1.5 rounded-full hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Sub-Modals */}
      {selectedReceipt && (
        <BookingReceiptModal
          booking={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {cancellingBooking && (
        <CancelBookingModal
          booking={cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          onSuccess={handleBookingCancelled}
        />
      )}

      {reviewingBooking && (
        <WriteReviewModal
          booking={reviewingBooking}
          onClose={() => setReviewingBooking(null)}
          onSuccess={fetchBookings}
        />
      )}
    </div>
  );
}
