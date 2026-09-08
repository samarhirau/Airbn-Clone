import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

const REASON_OPTIONS = [
  'Change of travel dates or destination',
  'Personal emergency or illness',
  'Booked by mistake',
  'Found alternative accommodation',
  'Host requested cancellation',
  'Other',
];

export default function CancelBookingModal({ booking, onClose, onSuccess }) {
  if (!booking) return null;

  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bookingId = booking.id || booking._id;
  const propertyTitle = booking.property?.title || 'this stay';

  const handleConfirmCancel = async () => {
    setLoading(true);
    setError('');

    const finalReason = reason === 'Other' && customReason.trim() ? customReason.trim() : reason;

    try {
      const response = await api.patch(`/bookings/${bookingId}/cancel`, {
        reason: finalReason,
      });

      const updatedBooking = response?.data?.booking || response?.booking;
      toast.success('Reservation cancelled successfully.', { className: 'airbnb-toast' });

      if (onSuccess) {
        onSuccess(updatedBooking || { ...booking, status: 'cancelled' });
      }
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg, { className: 'airbnb-toast' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-surface-border">
        {/* Header */}
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-600">
            <AlertTriangle className="w-5 h-5 stroke-[2.4]" />
            <h3 className="font-extrabold text-lg text-charcoal tracking-tight">
              Cancel Reservation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-card text-charcoal transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-charcoal">
          <p className="text-sm leading-relaxed text-charcoal">
            Are you sure you want to cancel your reservation for{' '}
            <span className="font-bold">{propertyTitle}</span>?
          </p>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">Cancellation Policy:</span> A full refund will be processed back to your original payment method within 3–5 business days.
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600">
              {error}
            </div>
          )}

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
              Reason for cancellation
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-surface-border text-sm font-medium text-charcoal outline-none bg-white focus:border-charcoal cursor-pointer"
            >
              {REASON_OPTIONS.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please tell us more..."
                rows={3}
                className="w-full p-3 rounded-xl border border-surface-border text-sm font-medium text-charcoal outline-none focus:border-charcoal resize-none"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-surface-card border-t border-surface-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full border border-surface-border text-charcoal font-semibold text-sm hover:bg-white transition-colors cursor-pointer"
          >
            Keep Reservation
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <span>Confirm Cancellation</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
