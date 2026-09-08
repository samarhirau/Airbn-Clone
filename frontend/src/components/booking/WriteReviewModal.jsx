import { useState } from 'react';
import { X, Star, Loader2, Sparkles } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

export default function WriteReviewModal({ booking, onClose, onSuccess }) {
  if (!booking) return null;

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bookingId = booking.id || booking._id;
  const propertyTitle = booking.property?.title || 'your stay';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 10) {
      setError('Please write at least 10 characters sharing your experience.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/reviews', {
        bookingId,
        rating: Number(rating),
        comment: comment.trim(),
      });

      toast.success('Thank you! Your review has been published.', { className: 'airbnb-toast' });
      if (onSuccess) onSuccess();
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
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-surface-border">
        {/* Header */}
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-airbnb">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-extrabold text-lg text-charcoal tracking-tight">
              Review Your Stay
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div>
            <h4 className="text-base font-bold text-charcoal mb-1">
              How was your time at {propertyTitle}?
            </h4>
            <p className="text-xs text-meta">
              Your feedback helps future guests and supports the host.
            </p>
          </div>

          {/* Star Rating Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-2">
              Overall Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-115 active:scale-95 cursor-pointer"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-neutral-200 text-neutral-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-sm font-bold text-charcoal ml-2">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-2">
              Write your review
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError('');
              }}
              placeholder="What did you love about the place? Was the check-in easy? How was the host's communication?"
              rows={4}
              required
              className="w-full p-4 rounded-2xl border border-surface-border text-sm font-medium text-charcoal outline-none focus:border-charcoal resize-none bg-surface-card/30"
            />
            <div className="flex justify-between text-[11px] text-meta mt-1">
              <span>Minimum 10 characters</span>
              <span>{comment.length} characters</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600">
              {error}
            </div>
          )}

          {/* Submit CTA */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-surface-border text-charcoal font-semibold text-sm hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-airbnb hover:bg-airbnb-dark text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
