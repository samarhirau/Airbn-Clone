import { CheckCircle2, Clock, XCircle, Sparkles } from 'lucide-react';

export default function BookingStatusBadge({ status = 'confirmed', className = '' }) {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
          Confirmed
        </span>
      );

    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
          Pending
        </span>
      );

    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs ${className}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
          Completed
        </span>
      );

    case 'cancelled':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
          Cancelled
        </span>
      );
  }
}
