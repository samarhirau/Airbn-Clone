import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Home as HomeIcon,
  Building2,
  DollarSign,
  Users,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  MapPin,
  X,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useCurrency } from '../../hooks/useCurrency';
import SEO from '../../components/common/SEO';
import toast from 'react-hot-toast';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HostCalendar() {
  const { formatPrice } = useCurrency();

  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [loadingProperties, setLoadingProperties] = useState(true);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12

  const [calendarData, setCalendarData] = useState(null);
  const [propertyBookings, setPropertyBookings] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Blackout dates stored locally per property
  const [blockedDates, setBlockedDates] = useState(() => {
    try {
      const saved = localStorage.getItem('stayhub_host_blocked_dates');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Selected reservation or day inspection modal
  const [inspectDay, setInspectDay] = useState(null);

  // Save blocked dates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('stayhub_host_blocked_dates', JSON.stringify(blockedDates));
    } catch (e) {
      console.error(e);
    }
  }, [blockedDates]);

  // Fetch host's properties
  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        const res = await api.get('/owner/properties');
        const items = res?.data || res?.items || [];
        setProperties(items);
        if (items.length > 0) {
          setSelectedPropertyId(items[0]._id || items[0].id);
        }
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, []);

  // Fetch calendar and bookings for the selected property & month
  const fetchCalendar = async () => {
    if (!selectedPropertyId) return;
    setLoadingCalendar(true);
    try {
      const [calRes, bookRes] = await Promise.allSettled([
        api.get(`/properties/${selectedPropertyId}/calendar`, {
          params: { year: currentYear, month: currentMonth },
        }),
        api.get(`/owner/properties/${selectedPropertyId}/bookings`),
      ]);

      if (calRes.status === 'fulfilled') {
        setCalendarData(calRes.value?.data || calRes.value || null);
      }

      if (bookRes.status === 'fulfilled') {
        const bItems = bookRes.value?.data || bookRes.value?.items || [];
        setPropertyBookings(Array.isArray(bItems) ? bItems : []);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingCalendar(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchCalendar();
    }
  }, [selectedPropertyId, currentYear, currentMonth]);

  const selectedProperty = properties.find(
    (p) => (p._id || p.id) === selectedPropertyId
  );

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  // Toggle host blackout date
  const toggleBlockDate = (dateStr) => {
    setBlockedDates((prev) => {
      const propBlocked = prev[selectedPropertyId] || [];
      const exists = propBlocked.includes(dateStr);
      const nextList = exists
        ? propBlocked.filter((d) => d !== dateStr)
        : [...propBlocked, dateStr];

      toast.success(exists ? `Date unblocked: ${dateStr}` : `Host blackout set: ${dateStr}`);
      return {
        ...prev,
        [selectedPropertyId]: nextList,
      };
    });
    setInspectDay(null);
  };

  // Build month calendar grid
  const daysInMonth = calendarData?.days || [];
  const propertyBlockedList = blockedDates[selectedPropertyId] || [];

  // Map each day with booking / blackout info
  const enrichedDays = useMemo(() => {
    return daysInMonth.map((day) => {
      const dateStr = day.date;
      const isHostBlocked = propertyBlockedList.includes(dateStr);

      // Find if there is a booking overlapping this date
      const matchedBooking = propertyBookings.find((b) => {
        if (!b.checkIn || !b.checkOut) return false;
        const inDate = b.checkIn.split('T')[0];
        const outDate = b.checkOut.split('T')[0];
        return dateStr >= inDate && dateStr < outDate && b.status !== 'cancelled';
      });

      let status = day.status;
      if (isHostBlocked) {
        status = 'blocked';
      } else if (matchedBooking) {
        status = 'booked';
      }

      return {
        ...day,
        status,
        isHostBlocked,
        booking: matchedBooking,
        price: selectedProperty?.price || 150,
      };
    });
  }, [daysInMonth, propertyBlockedList, propertyBookings, selectedProperty]);

  // Compute monthly occupancy stats
  const totalDays = enrichedDays.length || 30;
  const bookedDaysCount = enrichedDays.filter((d) => d.status === 'booked').length;
  const blockedDaysCount = enrichedDays.filter((d) => d.status === 'blocked').length;
  const availableDaysCount = enrichedDays.filter((d) => d.status === 'available').length;
  const occupancyRate = Math.round((bookedDaysCount / totalDays) * 100);
  const projectedRevenue = bookedDaysCount * (selectedProperty?.price || 150);

  // Offset cells for first day of week
  const firstDayOfWeek = enrichedDays[0]?.dayOfWeek ?? 0;
  const leadingBlanks = Array.from({ length: firstDayOfWeek });

  return (
    <div className="min-h-screen bg-surface-card/40 pb-20">
      <SEO
        title="Host Calendar & Availability Manager"
        description="Manage listing reservations, set blackout maintenance dates, and monitor live monthly occupancy."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-meta mb-1">
              <Link to="/host/dashboard" className="hover:underline hover:text-charcoal">
                Host Operations
              </Link>
              <span>/</span>
              <span className="text-charcoal">Calendar & Occupancy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
              Listing Availability & Pricing Calendar
            </h1>
            <p className="text-sm text-meta mt-1">
              View confirmed guest stays, block dates for maintenance, and monitor occupancy telemetry.
            </p>
          </div>

          {/* Property Switcher Dropdown */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-2xl border border-surface-border shadow-xs flex items-center gap-2">
              <Building2 className="w-4 h-4 text-meta ml-1" />
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                disabled={loadingProperties || properties.length === 0}
                className="bg-transparent text-xs font-bold text-charcoal focus:outline-none pr-2 cursor-pointer"
              >
                {properties.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.title} ({p.location?.city || 'Anywhere'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchCalendar}
              disabled={loadingCalendar}
              className="p-2.5 rounded-xl bg-white border border-surface-border text-charcoal hover:bg-neutral-50 shadow-xs transition-colors cursor-pointer"
              title="Refresh calendar"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCalendar ? 'animate-spin text-airbnb' : ''}`} />
            </button>
          </div>
        </div>

        {/* Monthly Performance KPI Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-3xl p-5 border border-surface-border shadow-xs flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-meta">Occupancy Rate</p>
              <h3 className="text-2xl font-black text-charcoal mt-0.5">{occupancyRate}%</h3>
              <p className="text-[11px] text-meta font-medium">{bookedDaysCount} of {totalDays} days booked</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-surface-border shadow-xs flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-airbnb/10 text-airbnb">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-meta">Projected Revenue</p>
              <h3 className="text-2xl font-black text-charcoal mt-0.5">{formatPrice(projectedRevenue)}</h3>
              <p className="text-[11px] text-meta font-medium">For {MONTH_NAMES[currentMonth - 1]}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-surface-border shadow-xs flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-meta">Available Nights</p>
              <h3 className="text-2xl font-black text-charcoal mt-0.5">{availableDaysCount}</h3>
              <p className="text-[11px] text-meta font-medium">Open for customer booking</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-surface-border shadow-xs flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-meta">Blackout Nights</p>
              <h3 className="text-2xl font-black text-charcoal mt-0.5">{blockedDaysCount}</h3>
              <p className="text-[11px] text-meta font-medium">Host blocked / private</p>
            </div>
          </div>
        </div>

        {/* Main Calendar Card */}
        <div className="bg-white rounded-3xl border border-surface-border shadow-md overflow-hidden">
          {/* Calendar Header with Month Navigation */}
          <div className="p-6 border-b border-surface-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface-card/30">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-charcoal">
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </h2>
              <button
                onClick={handleToday}
                className="px-3 py-1 bg-white border border-surface-border rounded-lg text-xs font-bold text-charcoal hover:bg-neutral-50 transition-colors shadow-2xs"
              >
                Today
              </button>
            </div>

            {/* Legend & Month Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 text-xs font-semibold text-meta">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-airbnb" />
                  Booked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                  Host Blockout
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-white border border-surface-border hover:bg-neutral-100 text-charcoal transition-colors cursor-pointer shadow-2xs"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-white border border-surface-border hover:bg-neutral-100 text-charcoal transition-colors cursor-pointer shadow-2xs"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-surface-border bg-surface-card/60 text-center py-3 text-xs font-extrabold text-meta uppercase tracking-wider">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-surface-border">
            {/* Blank leading slots */}
            {leadingBlanks.map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[100px] bg-neutral-50/50 p-2" />
            ))}

            {/* Actual day cells */}
            {enrichedDays.map((day) => {
              const isBooked = day.status === 'booked';
              const isBlocked = day.status === 'blocked';
              const isPast = day.isPast;

              return (
                <div
                  key={day.date}
                  onClick={() => setInspectDay(day)}
                  className={`min-h-[105px] p-2 sm:p-2.5 flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isBooked
                      ? 'bg-airbnb/5 hover:bg-airbnb/10'
                      : isBlocked
                      ? 'bg-neutral-100/90 text-meta hover:bg-neutral-200/70'
                      : isPast
                      ? 'bg-neutral-50/70 opacity-60'
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black ${
                        isBooked
                          ? 'text-airbnb'
                          : isBlocked
                          ? 'text-meta line-through'
                          : 'text-charcoal'
                      }`}
                    >
                      {day.dayOfMonth}
                    </span>

                    {/* Status Pill */}
                    {isBooked ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-airbnb text-white uppercase tracking-wider">
                        Booked
                      </span>
                    ) : isBlocked ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-300 text-charcoal/80 uppercase tracking-wider">
                        Blocked
                      </span>
                    ) : null}
                  </div>

                  {/* Booking or Price Details */}
                  <div className="mt-2 space-y-1">
                    {isBooked ? (
                      <div className="text-[11px] font-bold text-charcoal truncate">
                        {day.booking?.customer?.name ? `Guest: ${day.booking.customer.name}` : 'Reserved Stay'}
                      </div>
                    ) : (
                      <div className="text-[11px] font-extrabold text-meta group-hover:text-charcoal transition-colors">
                        {formatPrice(day.price)}
                      </div>
                    )}
                  </div>

                  {/* Hover prompt */}
                  <div className="text-[10px] text-meta opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between pt-1 border-t border-surface-border/40">
                    <span>{isBooked ? 'View Stay' : isBlocked ? 'Unblock' : 'Blackout'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Inspector & Blackout Modal */}
      {inspectDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white max-w-md w-full rounded-3xl p-6 border border-surface-border shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-surface-card text-charcoal">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-charcoal text-base">
                  Date Inspector · {inspectDay.date}
                </h3>
              </div>
              <button
                onClick={() => setInspectDay(null)}
                className="p-1.5 text-meta hover:text-charcoal rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inspectDay.status === 'booked' && inspectDay.booking ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-airbnb/5 border border-airbnb/20 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-airbnb">
                    Confirmed Reservation
                  </span>
                  <p className="text-sm font-bold text-charcoal">
                    Guest: {inspectDay.booking.customer?.name || 'Customer'}
                  </p>
                  <p className="text-xs text-meta">
                    Email: {inspectDay.booking.customer?.email || 'N/A'}
                  </p>
                  <p className="text-xs text-meta">
                    Total Payout: {formatPrice(inspectDay.booking.totalPrice)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/messages"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-charcoal text-white text-xs font-bold hover:bg-neutral-800 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Guest</span>
                  </Link>
                  <Link
                    to="/host/bookings"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-surface-border text-charcoal text-xs font-bold hover:bg-neutral-50 transition-colors"
                  >
                    <span>View in Reservations</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-surface-card border border-surface-border text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-meta">Date Status</span>
                    <span className="font-bold text-charcoal uppercase">
                      {inspectDay.isHostBlocked ? 'Host Blackout / Maintenance' : 'Available for Booking'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-meta">Standard Base Rate</span>
                    <span className="font-bold text-charcoal">{formatPrice(inspectDay.price)} / night</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleBlockDate(inspectDay.date)}
                    className={`w-full py-3 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      inspectDay.isHostBlocked
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {inspectDay.isHostBlocked ? 'Remove Blackout & Open Date' : 'Set Blackout (Block Date)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
