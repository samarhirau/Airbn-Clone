import { useState } from 'react';
import { Star, MessageSquare, User, Sparkles } from 'lucide-react';

export default function PropertyReviews({ reviews = [], ratingAvg = 0, ratingCount = 0 }) {
  const [visibleCount, setVisibleCount] = useState(6);

  const hasReviews = reviews && reviews.length > 0;
  const displayRating = Number(ratingAvg || 0).toFixed(2);
  const totalCount = ratingCount || reviews.length;

  // Authentic Airbnb rating categories simulation based on overall score
  const baseScore = ratingAvg > 0 ? Number(ratingAvg) : 4.9;
  const categories = [
    { label: 'Cleanliness', score: (baseScore * 0.99).toFixed(1) },
    { label: 'Accuracy', score: (baseScore * 1.0).toFixed(1) },
    { label: 'Communication', score: (baseScore * 1.01 > 5 ? '5.0' : (baseScore * 1.01).toFixed(1)) },
    { label: 'Location', score: (baseScore * 0.98).toFixed(1) },
    { label: 'Check-in', score: (baseScore * 1.0 > 5 ? '5.0' : (baseScore * 1.0).toFixed(1)) },
    { label: 'Value', score: (baseScore * 0.97).toFixed(1) },
  ];

  return (
    <div className="py-8 border-b border-surface-border">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Star className="w-6 h-6 fill-charcoal text-charcoal" />
        <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal tracking-tight">
          {hasReviews ? `${displayRating} · ${totalCount} review${totalCount > 1 ? 's' : ''}` : 'No reviews yet'}
        </h2>
      </div>

      {/* Category Ratings Bar Grid */}
      {hasReviews && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-3 mb-8">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm text-charcoal">
              <span className="font-normal">{cat.label}</span>
              <div className="flex items-center gap-3 w-40">
                <div className="flex-1 bg-surface-card h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-charcoal h-full rounded-full"
                    style={{ width: `${(Number(cat.score) / 5) * 100}%` }}
                  />
                </div>
                <span className="font-bold text-xs w-6 text-right">{cat.score}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews List */}
      {hasReviews ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.slice(0, visibleCount).map((rev, index) => {
            const reviewerName = rev.user?.name || rev.author?.name || 'Verified Guest';
            const reviewerAvatar = rev.user?.avatar || rev.author?.avatar;
            const reviewDate = rev.createdAt
              ? new Date(rev.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : 'Recent Stay';

            return (
              <div key={rev.id || rev._id || index} className="space-y-3">
                {/* Reviewer Meta */}
                <div className="flex items-center gap-3">
                  {reviewerAvatar ? (
                    <img
                      src={reviewerAvatar}
                      alt={reviewerName}
                      className="w-10 h-10 rounded-full object-cover border border-surface-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-card text-charcoal font-bold flex items-center justify-center text-sm border border-surface-border">
                      {reviewerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-charcoal leading-none mb-1">
                      {reviewerName}
                    </h4>
                    <p className="text-xs text-meta leading-none">{reviewDate}</p>
                  </div>
                </div>

                {/* Rating stars & comment */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < (rev.rating || 5)
                          ? 'fill-charcoal text-charcoal'
                          : 'fill-neutral-200 text-neutral-200'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-sm text-charcoal leading-relaxed font-normal">
                  {rev.comment}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-surface-card/40 border border-surface-border text-center">
          <MessageSquare className="w-8 h-8 text-meta mx-auto mb-2" />
          <p className="font-semibold text-charcoal text-sm">Be the first to leave a review!</p>
          <p className="text-meta text-xs mt-1">
            Reviews from real guests will appear here after their stay.
          </p>
        </div>
      )}

      {/* Show more button if reviews exist and exceed visible count */}
      {hasReviews && reviews.length > visibleCount && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-6 py-3 border border-charcoal rounded-xl text-sm font-semibold text-charcoal hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Show all {reviews.length} reviews
          </button>
        </div>
      )}
    </div>
  );
}
