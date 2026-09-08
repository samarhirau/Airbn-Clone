import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ExternalLink,
  MapPin,
  Tag
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';
import BookingStatusBadge from '../../components/booking/BookingStatusBadge';
import AdminSubNav from '../../components/admin/AdminSubNav';
import toast from 'react-hot-toast';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/admin/bookings', { params });
      setBookings(res?.data || []);
      if (res?.pagination) {
        setPagination((prev) => ({
          ...prev,
          page: res.pagination.page,
          limit: res.pagination.limit,
          total: res.pagination.total,
          totalPages: res.pagination.totalPages,
        }));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, statusFilter]);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-surface-card/40 pb-16">
      <AdminSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 gap-4 border-b border-surface-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
              Global Reservations Oversight
            </h1>
            <p className="text-sm text-meta">
              Audit guest reservations, monitor stay fulfillment, and view financial commitments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-surface-border rounded-xl text-xs font-bold text-charcoal shadow-xs hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 bg-white p-4 rounded-2xl border border-surface-border shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-meta uppercase tracking-wider">Status:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {['', 'pending', 'confirmed', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-charcoal text-white shadow-xs'
                      : 'bg-neutral-100 hover:bg-neutral-200/80 text-charcoal'
                  }`}
                >
                  {st === '' ? 'All Bookings' : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="mt-6 bg-white rounded-3xl border border-surface-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-surface-border text-meta uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-4 px-6">Reservation / Property</th>
                  <th className="py-4 px-6">Guest (Customer)</th>
                  <th className="py-4 px-6">Host (Owner)</th>
                  <th className="py-4 px-6">Stay Schedule</th>
                  <th className="py-4 px-6">Total Amount</th>
                  <th className="py-4 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {loading && bookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-meta">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      <span>Loading reservation records...</span>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-meta">
                      <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-bold text-charcoal text-sm">No reservations found</p>
                      <p className="text-xs text-meta mt-0.5">
                        There are currently no bookings matching the selected criteria.
                      </p>
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => {
                    const code = booking._id?.slice(-8).toUpperCase();
                    return (
                      <tr key={booking._id} className="hover:bg-neutral-50/70 transition-colors">
                        {/* Reservation & Property */}
                        <td className="py-4 px-6">
                          <div className="min-w-0 max-w-xs">
                            <span className="font-mono text-[10px] font-bold text-meta px-1.5 py-0.5 rounded bg-neutral-100 uppercase tracking-wide">
                              #{code}
                            </span>
                            <Link
                              to={`/properties/${booking.property?._id}`}
                              target="_blank"
                              className="font-extrabold text-charcoal hover:text-indigo-600 text-sm truncate block mt-1 transition-colors"
                            >
                              {booking.property?.title || 'Listing'}
                            </Link>
                            <span className="text-[11px] text-meta flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-meta shrink-0" />
                              {booking.property?.location?.city || 'Location'}
                            </span>
                          </div>
                        </td>

                        {/* Guest */}
                        <td className="py-4 px-6">
                          <div className="min-w-0">
                            <p className="font-bold text-charcoal truncate">
                              {booking.customer?.name || 'Guest'}
                            </p>
                            <p className="text-[11px] text-meta truncate">
                              {booking.customer?.email || '—'}
                            </p>
                          </div>
                        </td>

                        {/* Host */}
                        <td className="py-4 px-6">
                          <div className="min-w-0">
                            <p className="font-bold text-charcoal truncate">
                              {booking.owner?.name || 'Host'}
                            </p>
                            <p className="text-[11px] text-meta truncate">
                              {booking.owner?.email || '—'}
                            </p>
                          </div>
                        </td>

                        {/* Dates */}
                        <td className="py-4 px-6">
                          <div className="text-charcoal font-semibold">
                            <span>{formatDate(booking.checkIn)}</span>
                            <span className="text-meta mx-1">→</span>
                            <span>{formatDate(booking.checkOut)}</span>
                          </div>
                          <span className="text-[11px] text-meta block mt-0.5">
                            {booking.numberOfNights || 1} nights • {booking.guests || 1} guests
                          </span>
                        </td>

                        {/* Total Price */}
                        <td className="py-4 px-6">
                          <span className="font-black text-charcoal text-sm">
                            {formatPrice(booking.totalPrice)}
                          </span>
                          {booking.couponCode && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-0.5">
                              <Tag className="w-2.5 h-2.5" />
                              {booking.couponCode}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 text-right">
                          <BookingStatusBadge status={booking.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="py-4 px-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-meta bg-neutral-50/50">
            <span>
              Showing {bookings.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              bookings
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1 || loading}
                className="p-2 rounded-xl bg-white border border-surface-border text-charcoal hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-charcoal px-2">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>

              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="p-2 rounded-xl bg-white border border-surface-border text-charcoal hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
