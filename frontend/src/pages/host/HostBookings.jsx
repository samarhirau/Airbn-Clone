import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  User,
  MapPin,
  Calendar,
  Search,
  ExternalLink,
  DollarSign,
  Users,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';
import BookingStatusBadge from '../../components/booking/BookingStatusBadge';

export default function HostBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHostBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/owner/bookings');
      const items = response?.data || response?.items || [];
      setBookings(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status?.toLowerCase() !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const guestName = b.customer?.name?.toLowerCase() || '';
        const propTitle = b.property?.title?.toLowerCase() || '';
        const propCity = b.property?.location?.city?.toLowerCase() || '';
        if (!guestName.includes(query) && !propTitle.includes(query) && !propCity.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
            Guest Reservations
          </h1>
          <p className="mt-1 text-sm text-meta">
            Review upcoming guest check-ins, past stays, and host payouts.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-meta absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guest or listing..."
            className="w-full pl-10 pr-4 py-2 text-sm font-medium border border-surface-border rounded-full outline-none focus:border-charcoal bg-surface-card/40 transition-colors"
          />
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-4 mb-8 overflow-x-auto">
        {[
          { id: 'all', label: `All (${bookings.length})` },
          { id: 'confirmed', label: `Confirmed (${bookings.filter((b) => b.status === 'confirmed').length})` },
          { id: 'completed', label: `Completed (${bookings.filter((b) => b.status === 'completed').length})` },
          { id: 'pending', label: `Pending (${bookings.filter((b) => b.status === 'pending').length})` },
          { id: 'cancelled', label: `Cancelled (${bookings.filter((b) => b.status === 'cancelled').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-charcoal text-white shadow-xs'
                : 'bg-surface-card hover:bg-neutral-200/70 text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Bookings List / Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-neutral-200 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center max-w-lg mx-auto">
          <p className="text-sm font-semibold text-rose-600 mb-4">{error}</p>
          <button
            onClick={fetchHostBookings}
            className="px-6 py-2.5 bg-charcoal text-white rounded-full text-xs font-semibold hover:bg-neutral-800 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-8 bg-surface-card/30 border border-surface-border rounded-3xl max-w-lg mx-auto">
          <CalendarDays className="w-12 h-12 text-meta mb-3" />
          <h3 className="text-xl font-bold text-charcoal mb-1">No reservations found</h3>
          <p className="text-sm text-meta">
            {statusFilter === 'all'
              ? 'When travelers book your stays, their reservations will appear here.'
              : `No reservations with "${statusFilter}" status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const prop = booking.property || {};
            const guest = booking.customer || {};
            const propId = prop.id || prop._id;

            const checkInFormatted = booking.checkIn
              ? new Date(booking.checkIn).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'TBD';

            const checkOutFormatted = booking.checkOut
              ? new Date(booking.checkOut).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'TBD';

            return (
              <div
                key={booking.id || booking._id}
                className="bg-white border border-surface-border rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Guest Info & Property */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-card text-charcoal font-bold flex items-center justify-center text-sm border border-surface-border">
                      {guest.name ? guest.name.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-charcoal">{guest.name || 'Verified Guest'}</h4>
                      <p className="text-xs text-meta">{guest.email || 'Email hidden for privacy'}</p>
                    </div>
                    <BookingStatusBadge status={booking.status} className="ml-2" />
                  </div>

                  <div className="pt-1">
                    <Link
                      to={`/properties/${propId}`}
                      target="_blank"
                      className="font-semibold text-sm text-charcoal hover:text-airbnb inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>{prop.title || 'Reserved Property'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-meta" />
                    </Link>
                    <p className="text-xs text-meta flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-meta" />
                      <span>{prop.location?.city || prop.city || 'Stay Location'}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Dates & Payout */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-surface-border">
                  <div className="text-left md:text-right text-xs text-charcoal space-y-1">
                    <p className="font-bold flex items-center md:justify-end gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-meta" />
                      <span>{checkInFormatted}</span>
                    </p>
                    <p className="text-meta">to {checkOutFormatted}</p>
                    <p className="text-meta flex items-center md:justify-end gap-1">
                      <Users className="w-3 h-3" />
                      <span>{booking.guests || 1} guests · {booking.numberOfNights || 1} nights</span>
                    </p>
                  </div>

                  <div className="text-right pl-4 border-l border-surface-border">
                    <p className="text-xs font-bold uppercase tracking-wider text-meta">Payout</p>
                    <p className="text-xl font-extrabold text-charcoal mt-0.5">
                      {formatPrice(booking.totalPrice || 0)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
