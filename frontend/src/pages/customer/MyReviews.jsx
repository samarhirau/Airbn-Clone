import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  Sparkles,
  Calendar,
  Home as HomeIcon,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchMyReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews/me', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });

      const items = res?.data || res?.items || [];
      setReviews(Array.isArray(items) ? items : []);

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
    fetchMyReviews();
  }, [pagination.page]);

  // Compute stats
  const totalReviews = pagination.total || reviews.length;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[75vh]">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-meta mb-1">
            <Link to="/profile" className="hover:underline hover:text-charcoal">Account</Link>
            <span>/</span>
            <span className="text-charcoal">Reviews</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            Reviews by You
          </h1>
          <p className="text-sm text-meta mt-1">
            Verified ratings and feedback you've shared with hosts and the StayHub community.
          </p>
        </div>

        <Link
          to="/bookings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-charcoal hover:bg-neutral-800 text-white font-bold text-xs transition-all shadow-xs"
        >
          <span>View Past Trips</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-meta">Avg Rating Given</p>
            <h3 className="text-2xl font-black text-charcoal mt-0.5">{avgRating} / 5.0</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-meta">Reviews Written</p>
            <h3 className="text-2xl font-black text-charcoal mt-0.5">{totalReviews}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-meta">Stay Verification</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-0.5">100% Verified</h3>
          </div>
        </div>
      </div>

      {/* Reviews Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-airbnb animate-spin mb-3" />
          <p className="text-xs font-semibold text-meta">Loading your reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-surface-card/40 rounded-3xl border border-surface-border p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-white shadow-xs border border-surface-border flex items-center justify-center mx-auto mb-4 text-airbnb">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-charcoal mb-2">No reviews written yet</h2>
          <p className="text-sm text-meta mb-6 leading-relaxed">
            Reviews are submitted after completing a stay. Once you checkout from your trip, you can review the host and share your experience.
          </p>
          <Link
            to="/bookings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-airbnb hover:bg-airbnb-dark text-white rounded-full font-bold text-xs shadow-md transition-all"
          >
            <span>Check Completed Stays</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const propertyTitle = review.property?.title || 'Verified Property Stay';
            const propertyId = review.property?.id || review.property?._id;
            const reviewDate = review.createdAt
              ? new Date(review.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : 'Recent Stay';

            return (
              <div
                key={review.id || review._id}
                className="bg-white rounded-3xl p-6 border border-surface-border shadow-xs hover:border-neutral-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-border/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified Stay
                      </span>
                      <span className="text-xs text-meta">·</span>
                      <span className="text-xs text-meta font-medium">{reviewDate}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-charcoal mt-1.5 flex items-center gap-2">
                      <span>{propertyTitle}</span>
                      {propertyId && (
                        <Link
                          to={`/properties/${propertyId}`}
                          className="text-meta hover:text-airbnb transition-colors"
                          title="View property listing"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </h3>
                  </div>

                  {/* Star Rating Display */}
                  <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-2xl border border-surface-border self-start sm:self-auto">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= (review.rating || 5)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-neutral-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-black text-charcoal ml-1">
                      {review.rating || 5}.0
                    </span>
                  </div>
                </div>

                {/* Review Comment Quote */}
                <div className="pt-4">
                  <p className="text-sm text-charcoal/80 leading-relaxed italic bg-surface-card/40 p-4 rounded-2xl border border-surface-border/50">
                    "{review.comment}"
                  </p>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-surface-border mt-8">
              <span className="text-xs font-medium text-meta">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total reviews)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-xl border border-surface-border text-charcoal hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded-xl border border-surface-border text-charcoal hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
