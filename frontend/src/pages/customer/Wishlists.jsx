import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, MapPin, Trash2, ArrowRight, Loader2, Sparkles, Compass } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';
import { useAuth } from '../../hooks/useAuth';
import { useWishlist } from '../../hooks/useWishlist';
import toast from 'react-hot-toast';

export default function Wishlists() {
  const { isAuthenticated, isCustomer } = useAuth();
  const { wishlistCount, refreshWishlist } = useWishlist();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const fetchWishlist = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/wishlist');
      setWishlistItems(res?.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated]);

  const handleRemove = async (e, propertyId) => {
    e.preventDefault();
    e.stopPropagation();

    setRemovingId(propertyId);
    try {
      await api.delete(`/wishlist/${propertyId}`);
      setWishlistItems((prev) => prev.filter((item) => item.property?._id !== propertyId));
      refreshWishlist();
      toast('Removed from wishlist', {
        icon: '💔',
        className: 'airbnb-toast',
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  };

  // Not logged in state
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-3xl border border-surface-border shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-airbnb flex items-center justify-center mx-auto mb-5">
            <Heart className="w-8 h-8 fill-airbnb/20 stroke-airbnb stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-black text-charcoal mb-2">Log in to view your wishlists</h2>
          <p className="text-sm text-meta mb-6 leading-relaxed">
            Save your favorite stays, compare dream destinations, and access them anytime across all your devices.
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full py-3.5 px-4 rounded-xl bg-airbnb hover:bg-airbnb-dark text-white font-bold text-sm shadow-md transition-all"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="block w-full py-3 px-4 rounded-xl text-charcoal hover:bg-neutral-100 font-semibold text-sm transition-all"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Top Header */}
        <div className="pb-8 border-b border-surface-border flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-charcoal tracking-tight">Wishlists</h1>
            <p className="text-sm text-meta mt-1">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'saved property' : 'saved properties'}
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-bold text-airbnb hover:underline"
          >
            <span>Explore more homes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[20/19] bg-neutral-200 rounded-2xl w-full" />
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
                <div className="h-4 bg-neutral-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-rose-50 text-airbnb flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 fill-airbnb/20 stroke-airbnb stroke-[2]" />
            </div>
            <h2 className="text-2xl font-black text-charcoal mb-2">Create your first wishlist</h2>
            <p className="text-sm text-meta mb-8 leading-relaxed">
              As you search, tap the heart icon on any property to save your favorite vacation homes, villas, and condos.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 py-3.5 px-6 rounded-full bg-charcoal hover:bg-neutral-800 text-white font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>Start exploring</span>
            </Link>
          </div>
        ) : (
          /* Wishlisted Listings Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {wishlistItems.map((item) => {
              const property = item.property;
              if (!property) return null;

              const imageUrl =
                property.images?.[0]?.url ||
                property.images?.[0] ||
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80';

              const isRemoving = removingId === property._id;
              const hasRating = property.ratingAvg && property.ratingAvg > 0;

              return (
                <Link
                  key={item._id || property._id}
                  to={`/properties/${property._id}`}
                  className="group flex flex-col space-y-2.5 relative select-none"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[20/19] w-full overflow-hidden rounded-2xl bg-surface-card border border-surface-border/40">
                    <img
                      src={imageUrl}
                      alt={property.title}
                      className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
                    />

                    {/* Quick Remove Button */}
                    <button
                      onClick={(e) => handleRemove(e, property._id)}
                      disabled={isRemoving}
                      aria-label="Remove from wishlist"
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-airbnb hover:scale-110 active:scale-90 shadow-md transition-all z-10 cursor-pointer"
                      title="Remove from wishlist"
                    >
                      {isRemoving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-charcoal" />
                      ) : (
                        <Heart className="w-5 h-5 fill-airbnb stroke-airbnb" />
                      )}
                    </button>
                  </div>

                  {/* Property Details */}
                  <div className="space-y-0.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-charcoal truncate">
                        {property.location?.city ? `${property.location.city}, ${property.location.country || ''}` : property.title}
                      </h3>
                      <div className="flex items-center gap-1 font-semibold text-charcoal shrink-0">
                        <Star className="w-3.5 h-3.5 fill-charcoal text-charcoal" />
                        <span>{hasRating ? property.ratingAvg.toFixed(2) : 'New'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-meta truncate">{property.title}</p>

                    <div className="pt-1 flex items-baseline gap-1">
                      <span className="font-extrabold text-charcoal text-[15px]">
                        {formatPrice(property.pricePerNight)}
                      </span>
                      <span className="text-charcoal font-normal text-sm">night</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
