import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  Share2,
  Heart,
  MapPin,
  KeyRound,
  ShieldCheck,
  CalendarCheck,
  BedDouble,
  MessageCircle,
  Award,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import PropertyGallery from '../components/property/PropertyGallery';
import PropertyAmenities from '../components/property/PropertyAmenities';
import BookingWidget from '../components/property/BookingWidget';
import PropertyReviews from '../components/property/PropertyReviews';
import PropertyMap from '../components/property/PropertyMap';
import PropertyCalendar from '../components/property/PropertyCalendar';

import toast from 'react-hot-toast';

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  
  // Synchronized booking dates state
  const [selectedCheckIn, setSelectedCheckIn] = useState('');
  const [selectedCheckOut, setSelectedCheckOut] = useState('');

  // Fetch property details and reviews from backend
  useEffect(() => {
    let isMounted = true;
    const fetchPropertyData = async () => {
      setLoading(true);
      setError('');
      try {
        const [propertyRes, reviewsRes] = await Promise.allSettled([
          api.get(`/properties/${id}`),
          api.get(`/properties/${id}/reviews`),
        ]);

        if (propertyRes.status === 'fulfilled') {
          const propData = propertyRes.value?.data?.property || propertyRes.value?.property;
          if (isMounted) setProperty(propData);
        } else {
          throw new Error(getErrorMessage(propertyRes.reason));
        }

        if (reviewsRes.status === 'fulfilled') {
          const revData = reviewsRes.value?.data?.items || reviewsRes.value?.items || [];
          if (isMounted) setReviews(revData);
        }
      } catch (err) {
        if (isMounted) setError(getErrorMessage(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPropertyData();
    window.scrollTo(0, 0);

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!', { className: 'airbnb-toast' });
  };

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    toast.success(!isSaved ? 'Saved to Wishlist' : 'Removed from Wishlist', {
      className: 'airbnb-toast',
      icon: !isSaved ? '❤️' : '💔',
    });
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded-xl w-2/3 mb-4" />
        <div className="h-4 bg-neutral-200 rounded w-1/3 mb-6" />
        <div className="h-96 bg-neutral-200 rounded-3xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-6 bg-neutral-200 rounded w-1/2" />
            <div className="h-24 bg-neutral-200 rounded-2xl" />
            <div className="h-40 bg-neutral-200 rounded-2xl" />
          </div>
          <div className="h-96 bg-neutral-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  // Error View
  if (error || !property) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-charcoal mb-2">Listing Not Found</h2>
        <p className="text-meta text-sm mb-6">
          {error || "The stay you're looking for is either unavailable or has been removed."}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal text-white rounded-full font-semibold text-sm hover:bg-neutral-800 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore other stays</span>
        </Link>
      </div>
    );
  }

  const locationText = [
    property.location?.area,
    property.location?.city,
    property.location?.country,
  ]
    .filter(Boolean)
    .join(', ');

  const hostName = property.owner?.name || property.host?.name || 'Superhost';
  const hostInitial = hostName.charAt(0).toUpperCase();
  const hostAvatar = property.owner?.avatar || property.host?.avatar;

  const descriptionParagraphs = property.description
    ? property.description.split('\n').filter(Boolean)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* 1. Property Title & Quick Actions */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
          {property.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-charcoal font-medium">
          {/* Rating, Reviews & Location */}
          <div className="flex items-center flex-wrap gap-2">
            {property.ratingCount > 0 ? (
              <div className="flex items-center gap-1 font-bold">
                <Star className="w-4 h-4 fill-charcoal text-charcoal" />
                <span>{Number(property.ratingAvg || 0).toFixed(2)}</span>
                <span className="text-meta font-normal">
                  ({property.ratingCount} reviews)
                </span>
              </div>
            ) : (
              <span className="font-semibold text-meta">★ New</span>
            )}
            <span>·</span>
            <span className="flex items-center gap-1 text-meta underline font-normal">
              <MapPin className="w-3.5 h-3.5" />
              {locationText}
            </span>
          </div>

          {/* Share & Wishlist Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-surface-card rounded-full text-xs sm:text-sm font-semibold text-charcoal transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>

            <button
              onClick={handleSaveToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-surface-card rounded-full text-xs sm:text-sm font-semibold text-charcoal transition-colors cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isSaved ? 'fill-airbnb text-airbnb' : 'text-charcoal'
                }`}
              />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Photo Gallery Mosaic */}
      <PropertyGallery images={property.images} title={property.title} />

      {/* 3. Main Content Grid (2 Cols: Left Details, Right Sticky Booking) */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
        {/* Left Column: Property Content */}
        <div className="lg:col-span-2 space-y-8 divide-y divide-surface-border">
          {/* Host Overview Header */}
          <div className="pb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-charcoal capitalize">
                Entire {property.propertyType || 'home'} hosted by {hostName}
              </h2>
              <p className="mt-1 text-sm text-meta">
                {property.maxGuests} guests · {property.bedrooms || 1} bedrooms ·{' '}
                {property.bedrooms || 1} beds · {property.bathrooms || 1} baths
              </p>
            </div>

            {/* Host Avatar */}
            {hostAvatar ? (
              <img
                src={hostAvatar}
                alt={hostName}
                className="w-14 h-14 rounded-full object-cover border border-surface-border shadow-sm shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-airbnb text-white font-bold text-lg flex items-center justify-center shadow-sm shrink-0">
                {hostInitial}
              </div>
            )}
          </div>

          {/* Key Stay Highlights */}
          <div className="py-8 space-y-6">
            <div className="flex items-start gap-4">
              <KeyRound className="w-6 h-6 text-charcoal stroke-[1.8] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base font-bold text-charcoal">Self check-in</h4>
                <p className="text-sm text-meta">
                  Check yourself in easily with the smart door keypad.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Award className="w-6 h-6 text-charcoal stroke-[1.8] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base font-bold text-charcoal">Experienced host</h4>
                <p className="text-sm text-meta">
                  {hostName} has received 5-star ratings from 95% of recent guests.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CalendarCheck className="w-6 h-6 text-charcoal stroke-[1.8] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base font-bold text-charcoal">Free cancellation</h4>
                <p className="text-sm text-meta">
                  Cancel up to 48 hours before check-in for a full refund.
                </p>
              </div>
            </div>
          </div>

          {/* Sleeping Arrangements */}
          <div className="py-8">
            <h3 className="text-xl font-bold text-charcoal mb-4">Where you'll sleep</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: property.bedrooms || 1 }).map((_, i) => (
                <div
                  key={i}
                  className="p-5 border border-surface-border rounded-2xl bg-white space-y-2 shadow-xs"
                >
                  <BedDouble className="w-6 h-6 text-charcoal stroke-[1.8]" />
                  <p className="text-base font-bold text-charcoal">Bedroom {i + 1}</p>
                  <p className="text-xs text-meta">1 queen bed, fresh linens</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="py-8">
            <h3 className="text-xl font-bold text-charcoal mb-4">About this space</h3>
            <div
              className={`text-sm sm:text-base text-charcoal leading-relaxed space-y-4 font-normal ${
                !showFullDescription ? 'line-clamp-4' : ''
              }`}
            >
              {descriptionParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {property.description?.length > 250 && (
              <button
                type="button"
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-4 flex items-center gap-1 font-bold text-sm text-charcoal underline hover:text-airbnb transition-colors cursor-pointer"
              >
                <span>{showFullDescription ? 'Show less' : 'Show more'}</span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    showFullDescription ? '-rotate-90' : 'rotate-90'
                  }`}
                />
              </button>
            )}
          </div>

          {/* Amenities Grid */}
          <PropertyAmenities amenities={property.amenities} />

          {/* Reviews Section */}
          <PropertyReviews
            reviews={reviews}
            ratingAvg={property.ratingAvg}
            ratingCount={property.ratingCount}
          />

          {/* Host Profile Card */}
          <div className="py-8">
            <div className="flex items-center gap-4 mb-4">
              {hostAvatar ? (
                <img
                  src={hostAvatar}
                  alt={hostName}
                  className="w-16 h-16 rounded-full object-cover border border-surface-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-airbnb text-white font-bold text-xl flex items-center justify-center">
                  {hostInitial}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-charcoal">Hosted by {hostName}</h3>
                <p className="text-xs text-meta">
                  Joined {new Date(property.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-meta mb-4">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-charcoal text-charcoal" />
                {Number(property.ratingAvg || 4.9).toFixed(2)} Rating
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Identity verified
              </span>
            </div>

            <p className="text-sm text-charcoal leading-relaxed mb-6 font-normal">
              Hi! I'm dedicated to providing unique, clean, and memorable stays for guests traveling from around the world. Feel free to reach out with any questions!
            </p>

            <button
              type="button"
              onClick={() => {
                toast(`Direct chat with ${hostName} will be available upon booking!`, {
                  icon: '💬',
                  className: 'airbnb-toast',
                });
              }}
              className="px-6 py-3 border border-charcoal rounded-xl text-sm font-semibold text-charcoal hover:bg-neutral-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact Host</span>
            </button>
          </div>

  {/* Date Availability Calendar */}
          <PropertyCalendar
            propertyId={property.id || property._id}
            checkIn={selectedCheckIn}
            checkOut={selectedCheckOut}
            onSelectRange={(inDate, outDate) => {
              setSelectedCheckIn(inDate);
              setSelectedCheckOut(outDate);
            }}
          />
           {/* Neighborhood & Location Map */}
          <PropertyMap property={property} />
        </div>

        {/* Right Column: Sticky Booking Widget */}
        <div className="lg:col-span-1">
                    <BookingWidget
            property={property}
            checkIn={selectedCheckIn}
            checkOut={selectedCheckOut}
            onDatesChange={(inDate, outDate) => {
              setSelectedCheckIn(inDate);
              setSelectedCheckOut(outDate);
            }}
          />
        </div>
      </div>
    </div>
  );
}
