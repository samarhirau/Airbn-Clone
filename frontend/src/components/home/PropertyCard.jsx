import { useState } from 'react';
import { Star, Heart } from 'lucide-react';
import { formatPrice } from '../../utils/formatCurrency';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../hooks/useWishlist';

export default function PropertyCard({ property }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isWishlisted, toggleWishlist } = useWishlist();

  const propertyId = property?._id || property?.id;
  const isLiked = isWishlisted(propertyId);

  const fallbackImage = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80';
  const imageUrl = property?.images?.[0]?.url || fallbackImage;

  const ratingScore = property?.ratingAvg || property?.rating;
  const hasRating = ratingScore && ratingScore > 0;
  const isGuestFavorite = hasRating && ratingScore >= 4.9;

  const dateRange = property?.dateRange || 'Oct 12 – 17';
  const subtitle = property?.location?.area 
    ? `${property.location.area}, ${property.location.country || ''}`
    : property?.description?.slice(0, 32) || 'Scenic view';

  const handleHeartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
       await toggleWishlist(propertyId);
  };

  return (
    <Link to={`/properties/${propertyId}`} className="group cursor-pointer flex flex-col space-y-2.5 select-none block">

      {/* 1. Rounded-2xl image container with subtle hover zoom */}
      <div className="relative aspect-[20/19] w-full overflow-hidden rounded-2xl bg-surface-card border border-surface-border/40">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}

        <img
          src={imageUrl}
          alt={property?.title || 'Property listing'}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src = fallbackImage;
            setImageLoaded(true);
          }}
          className={`h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Floating Wishlist Heart Icon */}
        <button
          onClick={handleHeartClick}
          aria-label="Save to Wishlist"
          className="absolute top-3 right-3 p-2 rounded-full transition-transform active:scale-90 hover:scale-110 focus:outline-none z-10"
        >
          <Heart
            className={`w-6 h-6 transition-colors duration-200 stroke-[1.8] ${
              isLiked
                ? 'fill-airbnb stroke-airbnb'
                : 'stroke-white fill-black/25 hover:stroke-white hover:fill-black/35'
            }`}
          />
        </button>

        {/* Guest Favorite Badge */}
        {isGuestFavorite && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[11px] font-bold text-charcoal shadow-sm tracking-tight z-10">
            Guest favorite
          </div>
        )}
      </div>

      {/* 2. Metadata */}
      <div className="space-y-0.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-charcoal truncate">
            {property?.location?.city ? `${property.location.city}, ${property.location.country || ''}` : property?.title}
          </h3>
          <div className="flex items-center gap-1 font-semibold text-charcoal shrink-0">
            <Star className="w-3.5 h-3.5 fill-charcoal text-charcoal" />
            <span>{hasRating ? ratingScore.toFixed(2) : 'New'}</span>
          </div>
        </div>

        <p className="text-xs text-meta truncate">{subtitle}</p>
        <p className="text-xs text-meta">{dateRange}</p>

        {/* Price per night in US Dollars ($) */}
        <div className="pt-1 flex items-baseline gap-1">
          <span className="font-extrabold text-charcoal text-[15px]">
            {formatPrice(property?.pricePerNight || 120)}
          </span>
          <span className="text-charcoal font-normal text-sm">night</span>
        </div>
      </div>
      </Link>
  );
}
