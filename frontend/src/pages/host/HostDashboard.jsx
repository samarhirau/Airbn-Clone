import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Home as HomeIcon,
  CalendarCheck,
  TrendingUp,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  Users,
  Activity,
  Layers,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';

export default function HostDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, analyticsRes] = await Promise.allSettled([
        api.get('/owner/dashboard'),
        api.get('/owner/analytics?months=6'),
      ]);

      if (dashRes.status === 'fulfilled') {
        setMetrics(dashRes.value?.data || dashRes.value || null);
      } else {
        throw new Error(getErrorMessage(dashRes.reason));
      }

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value?.data || analyticsRes.value || null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded-xl w-1/3 mb-4" />
        <div className="h-4 bg-neutral-200 rounded w-1/4 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-3xl" />
          ))}
        </div>
        <div className="h-80 bg-neutral-200 rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200">
          <p className="text-base font-bold text-rose-700 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2.5 bg-charcoal text-white rounded-full text-xs font-semibold hover:bg-neutral-800 transition-all cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const monthlyData = analytics?.monthly || [];
  const maxRevenueInMonthly = Math.max(...monthlyData.map((m) => m.revenue || 0), 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
            Host Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-meta">
            Live metrics, revenue aggregates, and reservation health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/host/properties/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-airbnb hover:bg-airbnb-dark active:scale-[0.99] text-white rounded-full font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Listing</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Metric 1: Total Revenue */}
        <div className="p-6 rounded-3xl border border-surface-border bg-white shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-meta">Total Earnings</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 stroke-[2.4]" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-charcoal tracking-tight">
            {formatPrice(metrics?.totalRevenue || 0)}
          </p>
          <p className="text-xs text-meta mt-1">From confirmed and completed stays</p>
        </div>

        {/* Metric 2: Total Listings */}
        <div className="p-6 rounded-3xl border border-surface-border bg-white shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-meta">My Properties</span>
            <div className="w-10 h-10 rounded-2xl bg-airbnb/10 text-airbnb flex items-center justify-center">
              <HomeIcon className="w-5 h-5 stroke-[2.4]" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-charcoal tracking-tight">
            {metrics?.totalProperties || 0}
          </p>
          <p className="text-xs text-meta mt-1">
            <span className="text-emerald-600 font-semibold">{metrics?.activeProperties || 0} active</span> ·{' '}
            {metrics?.inactiveProperties || 0} paused
          </p>
        </div>

        {/* Metric 3: Live Occupancy */}
        <div className="p-6 rounded-3xl border border-surface-border bg-white shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-meta">Occupied Now</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-5 h-5 stroke-[2.4]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-charcoal tracking-tight">
              {metrics?.occupiedNow || 0}
            </p>
            <span className="text-xs font-semibold text-meta">of {metrics?.totalProperties || 0} listings</span>
          </div>
          <p className="text-xs text-meta mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live check-in status</span>
          </p>
        </div>

        {/* Metric 4: Total Bookings */}
        <div className="p-6 rounded-3xl border border-surface-border bg-white shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-meta">Total Bookings</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 stroke-[2.4]" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-charcoal tracking-tight">
            {metrics?.totalBookings || 0}
          </p>
          <p className="text-xs text-meta mt-1">
            <span className="text-charcoal font-semibold">{metrics?.upcomingBookings || 0} upcoming</span> stays
          </p>
        </div>
      </div>

      {/* 3. Monthly Revenue Trend Bar Chart */}
      <div className="bg-white border border-surface-border rounded-3xl p-6 sm:p-8 mb-10 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-charcoal">Revenue & Performance Trend</h2>
            <p className="text-xs text-meta">Past 6 months continuous revenue distribution</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-charcoal">
              <span className="w-3 h-3 rounded-full bg-airbnb" />
              Monthly Revenue
            </span>
          </div>
        </div>

        {monthlyData.length > 0 ? (
          <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end h-56 pt-8 pb-2 border-b border-surface-border">
            {monthlyData.map((item, idx) => {
              const heightPercent = Math.max(8, Math.round(((item.revenue || 0) / maxRevenueInMonthly) * 100));
              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-bold text-charcoal opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatPrice(item.revenue || 0)}
                  </span>
                  <div
                    className="w-full max-w-[48px] bg-airbnb group-hover:bg-airbnb-dark rounded-t-xl transition-all relative cursor-pointer"
                    style={{ height: `${heightPercent}%` }}
                    title={`${item.label}: ${formatPrice(item.revenue || 0)} (${item.bookingsCount || 0} stays)`}
                  />
                  <span className="text-xs text-meta font-medium truncate w-full text-center">
                    {item.label?.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-44 flex items-center justify-center text-meta text-sm">
            No historical booking records yet.
          </div>
        )}
      </div>

      {/* 4. Operations Grid: Status Breakdown & Property Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Distribution */}
        <div className="bg-white border border-surface-border rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
            <Layers className="w-4 h-4 text-meta" />
            <span>Booking Status Breakdown</span>
          </h3>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-900">Confirmed</span>
              </div>
              <span className="font-extrabold text-sm text-emerald-800">
                {metrics?.bookingsByStatus?.confirmed || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-900">Completed</span>
              </div>
              <span className="font-extrabold text-sm text-indigo-800">
                {metrics?.bookingsByStatus?.completed || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-900">Pending</span>
              </div>
              <span className="font-extrabold text-sm text-amber-800">
                {metrics?.bookingsByStatus?.pending || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100">
              <div className="flex items-center gap-2.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-semibold text-rose-900">Cancelled</span>
              </div>
              <span className="font-extrabold text-sm text-rose-800">
                {metrics?.bookingsByStatus?.cancelled || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-card/40 border border-surface-border rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-charcoal">Manage Your Portfolio</h3>
              <p className="text-sm text-meta mt-1">
                Edit prices, update amenities, upload pictures, and toggle instant availability.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/host/properties"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-charcoal hover:bg-neutral-800 text-white rounded-full font-semibold text-xs sm:text-sm transition-all"
              >
                <span>View All Listings</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/host/bookings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-neutral-50 border border-surface-border text-charcoal rounded-full font-semibold text-xs sm:text-sm transition-all"
              >
                <span>View Guest Reservations</span>
                <ExternalLink className="w-3.5 h-3.5 text-meta" />
              </Link>
            </div>
          </div>

          {/* Property Breakdown Table / List */}
          {analytics?.propertyBreakdown && analytics.propertyBreakdown.length > 0 && (
            <div className="bg-white border border-surface-border rounded-3xl p-6 shadow-xs">
              <h4 className="text-sm font-bold uppercase tracking-wider text-meta mb-3">
                Top Performing Listings
              </h4>
              <div className="divide-y divide-surface-border">
                {analytics.propertyBreakdown.slice(0, 3).map((item, i) => (
                  <div key={i} className="py-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-charcoal truncate max-w-xs">{item.title}</span>
                    <div className="text-right">
                      <span className="font-bold text-charcoal">{formatPrice(item.revenue || 0)}</span>
                      <p className="text-xs text-meta">{item.bookingsCount || 0} stays</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
