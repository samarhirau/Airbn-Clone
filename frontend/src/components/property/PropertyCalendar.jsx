import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import api from '../../services/api';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function PropertyCalendar({
  propertyId,
  checkIn,
  checkOut,
  onSelectRange,
}) {
  const today = useMemo(() => new Date(), []);
  const [currentMonthDate, setCurrentMonthDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [calendarDays, setCalendarDays] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoverDate, setHoverDate] = useState(null);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth() + 1; // 1-indexed

  // Fetch calendar days & occupancy for the active month
  useEffect(() => {
    let isMounted = true;
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        const [calRes, occRes] = await Promise.allSettled([
          api.get(`/properties/${propertyId}/calendar?year=${year}&month=${month}`),
          api.get(`/properties/${propertyId}/availability`),
        ]);

        if (isMounted) {
          if (calRes.status === 'fulfilled') {
            const days = calRes.value?.data?.days || calRes.value?.days || [];
            setCalendarDays(days);
          }
          if (occRes.status === 'fulfilled') {
            const occ = occRes.value?.data || occRes.value || null;
            setOccupancy(occ);
          }
        }
      } catch (err) {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (propertyId) {
      fetchCalendarData();
    }

    return () => {
      isMounted = false;
    };
  }, [propertyId, year, month]);

  const handlePrevMonth = () => {
    // Can't navigate to past months
    if (
      currentMonthDate.getFullYear() === today.getFullYear() &&
      currentMonthDate.getMonth() <= today.getMonth()
    ) {
      return;
    }
    setCurrentMonthDate(new Date(year, currentMonthDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, currentMonthDate.getMonth() + 1, 1));
  };

  // Month header text: e.g. "September 2026"
  const monthName = currentMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const isPrevDisabled =
    currentMonthDate.getFullYear() === today.getFullYear() &&
    currentMonthDate.getMonth() <= today.getMonth();

  // First day of week padding (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = calendarDays[0]?.dayOfWeek ?? 0;

  // Handle day click for range selection
  const handleDayClick = (day) => {
    if (day.status === 'occupied' || day.isPast) return;

    const clickedDateStr = day.date; // "YYYY-MM-DD"

    if (!checkIn || (checkIn && checkOut)) {
      // Step 1: Start new range selection
      onSelectRange(clickedDateStr, '');
    } else if (checkIn && !checkOut) {
      // Step 2: Set checkout
      if (clickedDateStr <= checkIn) {
        // If clicked on or before checkIn, reset checkIn
        onSelectRange(clickedDateStr, '');
      } else {
        // Complete range
        onSelectRange(checkIn, clickedDateStr);
      }
    }
  };

  // Compute nights count for selected range
  const nightsCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const diff = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  return (
    <div className="py-8 border-t border-surface-border">
      {/* Header & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight">
            {checkIn && checkOut
              ? `${nightsCount} night${nightsCount > 1 ? 's' : ''} in this stay`
              : checkIn
              ? 'Select check-out date'
              : 'Select check-in date'}
          </h3>
          <p className="text-sm text-meta mt-1">
            {checkIn && checkOut
              ? `${new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : 'Minimum stay: 1 night · Free cancellation up to 48 hours'}
          </p>
        </div>

        {/* Live Occupancy Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          {occupancy?.occupied ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Occupied until{' '}
                {occupancy.occupiedUntil
                  ? new Date(occupancy.occupiedUntil).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'soon'}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Available today</span>
            </span>
          )}

          {(checkIn || checkOut) && (
            <button
              type="button"
              onClick={() => onSelectRange('', '')}
              className="p-1.5 rounded-full hover:bg-neutral-100 text-meta hover:text-charcoal transition-colors cursor-pointer"
              title="Reset dates"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Calendar Month Container */}
      <div className="max-w-md bg-white border border-surface-border rounded-3xl p-5 sm:p-6 shadow-xs">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-extrabold text-charcoal">
            {monthName}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isPrevDisabled}
              onClick={handlePrevMonth}
              className="p-2 rounded-full hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-charcoal" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 text-charcoal" />
            </button>
          </div>
        </div>

        {/* Weekday Names Header */}
        <div className="grid grid-cols-7 text-center mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-[11px] font-bold uppercase tracking-wider text-meta py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {/* Leading Empty Cells for week offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {/* Real Calendar Days */}
          {calendarDays.map((day) => {
            const dateStr = day.date;
            const isStartDate = checkIn === dateStr;
            const isEndDate = checkOut === dateStr;
            const isInRange =
              checkIn &&
              checkOut &&
              dateStr > checkIn &&
              dateStr < checkOut;
            const isHovered =
              checkIn &&
              !checkOut &&
              hoverDate &&
              dateStr > checkIn &&
              dateStr <= hoverDate;

            const isOccupied = day.status === 'occupied';
            const isPast = day.isPast;
            const isDisabled = isOccupied || isPast;

            // Day button classes
            let cellStyle =
              'h-10 w-full flex items-center justify-center font-semibold transition-all relative select-none ';

            if (isStartDate) {
              cellStyle += 'bg-charcoal text-white rounded-l-full font-bold z-10 shadow-xs ';
              if (!checkOut) cellStyle += 'rounded-r-full ';
            } else if (isEndDate) {
              cellStyle += 'bg-charcoal text-white rounded-r-full font-bold z-10 shadow-xs ';
            } else if (isInRange) {
              cellStyle += 'bg-neutral-100 text-charcoal font-bold ';
            } else if (isHovered && !isDisabled) {
              cellStyle += 'bg-rose-50 text-airbnb ';
            } else if (isDisabled) {
              cellStyle += isOccupied
                ? 'text-neutral-300 line-through cursor-not-allowed bg-neutral-50/50 '
                : 'text-neutral-300 cursor-not-allowed ';
            } else {
              cellStyle +=
                'text-charcoal hover:bg-neutral-100 rounded-full cursor-pointer ';
            }

            return (
              <button
                key={day.date}
                type="button"
                disabled={isDisabled}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => !isDisabled && setHoverDate(dateStr)}
                onMouseLeave={() => setHoverDate(null)}
                className={cellStyle}
                title={
                  isOccupied
                    ? 'Reserved'
                    : isPast
                    ? 'Past date'
                    : `${day.dayOfMonth} ${monthName}`
                }
              >
                <span>{day.dayOfMonth}</span>
              </button>
            );
          })}
        </div>

        {/* Legend Footer */}
        <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between text-[11px] text-meta">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-charcoal inline-block" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 line-through inline-block" />
            <span>Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
