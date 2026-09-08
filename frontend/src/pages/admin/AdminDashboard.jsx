import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  MapPin,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  UserCheck,
  Home,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';
import { useAuth } from '../../hooks/useAuth';
import AdminSubNav from '../../components/admin/AdminSubNav';

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [periodMonths, setPeriodMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [hoveredMonth, setHoveredMonth] = useState(null);

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const [dashRes, analyticsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get(`/admin/analytics?months=${periodMonths}`),
      ]);

      setMetrics(dashRes?.data || dashRes);
      setAnalytics(analyticsRes?.data || analyticsRes);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [periodMonths]);

  // Unauthorized Gate for non-admins
  if (role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-surface-border shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-charcoal mb-2">Restricted Access</h2>
          <p className="text-sm text-meta mb-6">
            The platform admin console requires elevated privileges. Please sign in with an administrative account.
          </p>
          <div className="space-y-2">
            <Link
              to="/login"
              className="block w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all"
            >
              Log in as Admin
            </Link>
            <Link
              to="/"
              className="block w-full py-2.5 px-4 rounded-xl text-charcoal hover:bg-neutral-100 font-semibold text-sm transition-all"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate max values for SVG bar chart scaling
  const maxRevenue = analytics?.monthlyRevenue
    ? Math.max(...analytics.monthlyRevenue.map((m) => m.revenue), 100)
    : 100;

  const maxUserGrowth = analytics?.monthlyUserGrowth
    ? Math.max(...analytics.monthlyUserGrowth.map((m) => m.total), 5)
    : 5;

  const totalStatusBookings = analytics?.bookingStatusDistribution
    ? (analytics.bookingStatusDistribution.confirmed || 0) +
      (analytics.bookingStatusDistribution.completed || 0) +
      (analytics.bookingStatusDistribution.pending || 0) +
      (analytics.bookingStatusDistribution.cancelled || 0)
    : metrics?.bookings?.total || 1;

  return (
    <div className="min-h-screen bg-surface-card/40 pb-16">
      {/* Sub-navigation bar */}
      <AdminSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 gap-4 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
                Platform Intelligence
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="text-sm text-meta">
              Platform-wide aggregation, real-time MongoDB metrics, and moderation controls.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Period selector */}
            <div className="flex items-center bg-white border border-surface-border rounded-xl p-1 shadow-xs text-xs font-bold text-charcoal">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setPeriodMonths(m)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    periodMonths === m ? 'bg-charcoal text-white shadow-xs' : 'hover:bg-neutral-100 text-meta'
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-surface-border hover:bg-neutral-50 text-xs font-bold text-charcoal shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-meta ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Sync Data'}</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchDashboardData()}
              className="underline font-bold hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State Skeletons */}
        {loading ? (
          <div className="space-y-8 mt-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 bg-neutral-200/70 rounded-3xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-neutral-200/70 rounded-3xl" />
              <div className="h-96 bg-neutral-200/70 rounded-3xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-8 mt-8">
            {/* 1. Four Core Platform KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Gross Revenue Card */}
              <div className="bg-white p-6 rounded-3xl border border-surface-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-meta">
                    Gross Platform Revenue
                  </span>
                  <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 group-hover:scale-105 transition-transform">
                    <DollarSign className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
                <div className="text-3xl font-black text-charcoal tracking-tight mb-1">
                  {formatPrice(metrics?.revenue || 0)}
                </div>
                <p className="text-xs text-meta flex items-center gap-1.5">
                  <span className="font-bold text-emerald-600">
                    {(metrics?.bookings?.confirmed || 0) + (metrics?.bookings?.completed || 0)}
                  </span>{' '}
                  confirmed & completed bookings
                </p>
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-meta">
                  <span>Committed funds</span>
                  <span className="font-bold text-charcoal">USD Standard</span>
                </div>
              </div>

              {/* Platform Users Card */}
              <div className="bg-white p-6 rounded-3xl border border-surface-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-meta">
                    Platform Users
                  </span>
                  <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
                <div className="text-3xl font-black text-charcoal tracking-tight mb-1">
                  {metrics?.users?.total || 0}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs font-semibold mt-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px]">
                    {metrics?.users?.customers || 0} Guests
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-airbnb text-[11px]">
                    {metrics?.users?.owners || 0} Hosts
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px]">
                    {metrics?.users?.admins || 0} Admins
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-meta">
                  <span>Active Accounts</span>
                  <span className="font-bold text-emerald-600">
                    {metrics?.users?.active || 0} of {metrics?.users?.total || 0}
                  </span>
                </div>
              </div>

              {/* Total Properties Inventory */}
              <div className="bg-white p-6 rounded-3xl border border-surface-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-meta">
                    Listing Inventory
                  </span>
                  <div className="p-2.5 rounded-2xl bg-rose-50 text-airbnb border border-airbnb/20 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
                <div className="text-3xl font-black text-charcoal tracking-tight mb-1">
                  {metrics?.properties?.total || 0}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold mt-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px]">
                    {metrics?.properties?.active || 0} Active
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-meta text-[11px]">
                    {metrics?.properties?.inactive || 0} Inactive
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-meta">
                  <span>Live Occupancy Today</span>
                  <span className="font-bold text-charcoal">
                    {metrics?.properties?.occupiedNow || 0} Occupied / {metrics?.properties?.availableNow || 0} Free
                  </span>
                </div>
              </div>

              {/* Bookings Performance */}
              <div className="bg-white p-6 rounded-3xl border border-surface-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-meta">
                    Global Bookings
                  </span>
                  <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
                <div className="text-3xl font-black text-charcoal tracking-tight mb-1">
                  {metrics?.bookings?.total || 0}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold mt-2">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px]">
                    {metrics?.bookings?.confirmed || 0} Confirmed
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px]">
                    {metrics?.bookings?.completed || 0} Completed
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-meta">
                  <span>Cancellation Rate</span>
                  <span className="font-bold text-rose-600">
                    {metrics?.bookings?.total
                      ? Math.round(((metrics.bookings.cancelled || 0) / metrics.bookings.total) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Main Analytics Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Revenue & Bookings Bar Chart */}
              <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-surface-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-lg font-black text-charcoal tracking-tight">
                        Platform Revenue & Volume Trajectory
                      </h2>
                      <p className="text-xs text-meta">
                        Past {periodMonths} months monthly gross revenue and reservation volume
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-1.5 text-charcoal">
                        <span className="w-3 h-3 rounded-md bg-indigo-600" />
                        <span>Gross Revenue</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-charcoal">
                        <span className="w-3 h-3 rounded-md bg-emerald-400" />
                        <span>Completed Bookings</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Interactive SVG / CSS Chart */}
                  <div className="mt-8 relative pt-6 pb-2">
                    <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 border-b border-neutral-200 px-2">
                      {analytics?.monthlyRevenue?.map((slot, index) => {
                        const revenueHeight = maxRevenue > 0 ? (slot.revenue / maxRevenue) * 100 : 0;
                        const isHovered = hoveredMonth === slot.month;

                        return (
                          <div
                            key={slot.month || index}
                            className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                            onMouseEnter={() => setHoveredMonth(slot.month)}
                            onMouseLeave={() => setHoveredMonth(null)}
                          >
                            {/* Hover Tooltip Card */}
                            {isHovered && (
                              <div className="absolute -top-20 z-20 bg-charcoal text-white p-2.5 rounded-xl shadow-xl text-xs whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                                <p className="font-bold border-b border-white/20 pb-1 mb-1">{slot.label}</p>
                                <p className="text-emerald-400 font-extrabold">{formatPrice(slot.revenue)}</p>
                                <p className="text-[10px] text-neutral-300">
                                  {slot.bookingsCount} bookings ({slot.completedBookings} completed)
                                </p>
                              </div>
                            )}

                            {/* Dual Bar Columns */}
                            <div className="w-full max-w-[40px] flex items-end justify-center gap-1 h-full">
                              {/* Revenue Bar */}
                              <div
                                style={{ height: `${Math.max(revenueHeight, 4)}%` }}
                                className={`w-full rounded-t-lg transition-all duration-300 ${
                                  isHovered
                                    ? 'bg-indigo-500 scale-y-105'
                                    : slot.revenue > 0
                                    ? 'bg-indigo-600'
                                    : 'bg-neutral-200'
                                }`}
                              />
                            </div>

                            {/* Month Label */}
                            <span className="text-[11px] font-bold text-meta group-hover:text-charcoal mt-3 truncate max-w-full">
                              {slot.label.split(' ')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer summary stats */}
                <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <span className="text-[11px] text-meta uppercase font-bold tracking-wider">
                      Period Total Revenue
                    </span>
                    <p className="text-base sm:text-lg font-black text-indigo-600">
                      {formatPrice(analytics?.totalPlatformRevenue || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-meta uppercase font-bold tracking-wider">
                      Period Bookings
                    </span>
                    <p className="text-base sm:text-lg font-black text-charcoal">
                      {analytics?.totalPlatformBookings || 0}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-meta uppercase font-bold tracking-wider">
                      Avg Booking Value
                    </span>
                    <p className="text-base sm:text-lg font-black text-emerald-600">
                      {analytics?.totalPlatformBookings
                        ? formatPrice(
                            Math.round(
                              (analytics.totalPlatformRevenue || 0) /
                                analytics.totalPlatformBookings
                            )
                          )
                        : '$0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Status Distribution Meter */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-surface-border shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-black text-charcoal tracking-tight mb-1">
                    Booking Status Pipeline
                  </h2>
                  <p className="text-xs text-meta mb-6">
                    Distribution of all reservations across booking life-cycle
                  </p>

                  <div className="space-y-4">
                    {/* Confirmed */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <div className="flex items-center gap-1.5 text-indigo-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Confirmed</span>
                        </div>
                        <span className="text-charcoal">
                          {analytics?.bookingStatusDistribution?.confirmed || 0} (
                          {Math.round(
                            ((analytics?.bookingStatusDistribution?.confirmed || 0) /
                              totalStatusBookings) *
                              100
                          )}
                          %)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          style={{
                            width: `${
                              ((analytics?.bookingStatusDistribution?.confirmed || 0) /
                                totalStatusBookings) *
                              100
                            }%`,
                          }}
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    {/* Completed */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Completed</span>
                        </div>
                        <span className="text-charcoal">
                          {analytics?.bookingStatusDistribution?.completed || 0} (
                          {Math.round(
                            ((analytics?.bookingStatusDistribution?.completed || 0) /
                              totalStatusBookings) *
                              100
                          )}
                          %)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          style={{
                            width: `${
                              ((analytics?.bookingStatusDistribution?.completed || 0) /
                                totalStatusBookings) *
                              100
                            }%`,
                          }}
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    {/* Pending */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending</span>
                        </div>
                        <span className="text-charcoal">
                          {analytics?.bookingStatusDistribution?.pending || 0} (
                          {Math.round(
                            ((analytics?.bookingStatusDistribution?.pending || 0) /
                              totalStatusBookings) *
                              100
                          )}
                          %)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          style={{
                            width: `${
                              ((analytics?.bookingStatusDistribution?.pending || 0) /
                                totalStatusBookings) *
                              100
                            }%`,
                          }}
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    {/* Cancelled */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <div className="flex items-center gap-1.5 text-rose-700">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Cancelled</span>
                        </div>
                        <span className="text-charcoal">
                          {analytics?.bookingStatusDistribution?.cancelled || 0} (
                          {Math.round(
                            ((analytics?.bookingStatusDistribution?.cancelled || 0) /
                              totalStatusBookings) *
                              100
                          )}
                          %)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          style={{
                            width: `${
                              ((analytics?.bookingStatusDistribution?.cancelled || 0) /
                                totalStatusBookings) *
                              100
                            }%`,
                          }}
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100">
                  <Link
                    to="/admin/bookings"
                    className="flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>Inspect Global Bookings</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* 3. Bottom Rankings: Top Cities & Highest Earning Properties */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Cities by Inventory */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-surface-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-black text-charcoal tracking-tight">
                      Top Destination Markets
                    </h2>
                    <p className="text-xs text-meta">
                      Leading cities by active property density and listings count
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-neutral-100 text-charcoal">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  {metrics?.topCities?.length ? (
                    metrics.topCities.map((cityItem, index) => {
                      const totalProps = metrics?.properties?.total || 1;
                      const percent = Math.round((cityItem.count / totalProps) * 100);

                      return (
                        <div
                          key={cityItem.city || index}
                          className="p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-white border border-surface-border flex items-center justify-center font-extrabold text-xs text-charcoal shadow-xs">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-extrabold text-sm text-charcoal">{cityItem.city}</p>
                              <span className="text-[11px] text-meta">
                                {percent}% of entire catalog
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-sm text-charcoal">
                              {cityItem.count}
                            </span>
                            <span className="text-xs text-meta block">
                              {cityItem.count === 1 ? 'listing' : 'listings'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-meta text-xs">
                      No top cities aggregated yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Top 5 Revenue Properties Leaderboard */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-surface-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-black text-charcoal tracking-tight">
                      Top Earning Properties
                    </h2>
                    <p className="text-xs text-meta">
                      Highest grossing listings across the platform
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  {analytics?.topRevenueProperties?.length ? (
                    analytics.topRevenueProperties.map((prop, idx) => (
                      <div
                        key={prop.propertyId || idx}
                        className="p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-white border border-surface-border flex items-center justify-center font-extrabold text-xs text-charcoal shadow-xs shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <Link
                              to={`/properties/${prop.propertyId}`}
                              target="_blank"
                              className="font-extrabold text-sm text-charcoal hover:text-indigo-600 transition-colors truncate block"
                            >
                              {prop.title}
                            </Link>
                            <span className="text-[11px] text-meta block truncate">
                              {prop.city} • Host: {prop.ownerName}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-sm text-emerald-600">
                            {formatPrice(prop.revenue)}
                          </span>
                          <span className="text-[11px] text-meta block">
                            {prop.bookingsCount} {prop.bookingsCount === 1 ? 'booking' : 'bookings'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-meta text-xs">
                      No property revenue records available for this period.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Admin Navigation Banners */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <Link
                to="/admin/users"
                className="p-5 rounded-3xl bg-white border border-surface-border hover:border-indigo-400 hover:shadow-md transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 w-fit mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-charcoal text-sm group-hover:text-indigo-600 transition-colors">
                    User Moderation
                  </h3>
                  <p className="text-xs text-meta mt-0.5">Manage accounts & assign system roles</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-meta group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                to="/admin/properties"
                className="p-5 rounded-3xl bg-white border border-surface-border hover:border-rose-400 hover:shadow-md transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="p-2 rounded-xl bg-rose-50 text-airbnb w-fit mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-charcoal text-sm group-hover:text-airbnb transition-colors">
                    Property Moderation
                  </h3>
                  <p className="text-xs text-meta mt-0.5">Toggle active listings & delist properties</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-meta group-hover:text-airbnb transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                to="/admin/bookings"
                className="p-5 rounded-3xl bg-white border border-surface-border hover:border-amber-400 hover:shadow-md transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 w-fit mb-3">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-charcoal text-sm group-hover:text-amber-600 transition-colors">
                    Global Bookings
                  </h3>
                  <p className="text-xs text-meta mt-0.5">Inspect all guest reservations & audit stays</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-meta group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
