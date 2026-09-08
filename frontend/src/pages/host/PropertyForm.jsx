import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Loader2,
  Check,
  Building,
  MapPin,
  DollarSign,
  Users,
  Bed,
  Bath,
  Sparkles,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment' },
  { id: 'house', label: 'House' },
  { id: 'villa', label: 'Villa' },
  { id: 'condo', label: 'Condo' },
  { id: 'cabin', label: 'Cabin' },
  { id: 'studio', label: 'Studio' },
  { id: 'cottage', label: 'Cottage' },
  { id: 'loft', label: 'Loft' },
  { id: 'other', label: 'Other' },
];

const POPULAR_AMENITIES = [
  'wifi',
  'pool',
  'kitchen',
  'parking',
  'air conditioning',
  'tv',
  'gym',
  'pets allowed',
  'washer',
  'dedicated workspace',
  'fireplace',
  'hot tub',
];

const SAMPLE_PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
];

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'apartment',
    pricePerNight: 120,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    location: {
      address: '',
      area: '',
      city: '',
      country: 'USA',
    },
    amenities: ['wifi', 'kitchen'],
    images: [{ url: SAMPLE_PHOTO_PRESETS[0] }],
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingExisting, setFetchingExisting] = useState(isEditing);
  const [error, setError] = useState('');

  // Load existing property data if editing
  useEffect(() => {
    if (!isEditing) return;

    const fetchProperty = async () => {
      setFetchingExisting(true);
      try {
        const res = await api.get(`/properties/${id}`);
        const p = res?.data?.property || res?.property;
        if (p) {
          setFormData({
            title: p.title || '',
            description: p.description || '',
            propertyType: p.propertyType || 'apartment',
            pricePerNight: p.pricePerNight || 100,
            maxGuests: p.maxGuests || 2,
            bedrooms: p.bedrooms || 1,
            bathrooms: p.bathrooms || 1,
            location: {
              address: p.location?.address || '',
              area: p.location?.area || '',
              city: p.location?.city || '',
              country: p.location?.country || '',
            },
            amenities: p.amenities || [],
            images: p.images && p.images.length > 0 ? p.images : [{ url: SAMPLE_PHOTO_PRESETS[0] }],
          });
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setFetchingExisting(false);
      }
    };

    fetchProperty();
  }, [id, isEditing]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  };

  const toggleAmenity = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleAddImage = (urlToAdd) => {
    const url = (urlToAdd || newImageUrl).trim();
    if (!url) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, { url }],
    }));
    setNewImageUrl('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indexToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Please provide a listing title.');
      return;
    }

    if (!formData.location.city.trim()) {
      setError('City is required for search and maps.');
      return;
    }

    if (formData.images.length === 0) {
      setError('Please add at least one photo for your property.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        pricePerNight: Number(formData.pricePerNight),
        maxGuests: Number(formData.maxGuests),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
      };

      if (isEditing) {
        await api.patch(`/properties/${id}`, payload);
        toast.success('Listing updated successfully!', { className: 'airbnb-toast' });
      } else {
        await api.post('/properties', payload);
        toast.success('Listing published! It is now live on StayHub.', {
          className: 'airbnb-toast',
        });
      }

      navigate('/host/properties');
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg, { className: 'airbnb-toast' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingExisting) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-1/3 mx-auto mb-4" />
        <div className="h-64 bg-neutral-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Breadcrumb */}
      <div className="mb-6">
        <Link
          to="/host/properties"
          className="inline-flex items-center gap-2 text-sm font-semibold text-meta hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight mt-2">
          {isEditing ? 'Edit Property Listing' : 'Create a New Stay Listing'}
        </h1>
        <p className="text-sm text-meta mt-1">
          {isEditing
            ? 'Make changes to your listing details, photos, or pricing.'
            : 'Fill in the information below to introduce your space to travelers worldwide.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white border border-surface-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
            <Building className="w-5 h-5 text-airbnb" />
            <span>Listing Basics</span>
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
              Listing Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. Modern Sunset Villa with Infinity Pool"
              required
              maxLength={160}
              className="w-full p-3.5 rounded-xl border border-surface-border text-sm font-medium text-charcoal focus:border-charcoal outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what makes your space special, the neighborhood, amenities, and sleeping arrangements..."
              rows={4}
              required
              maxLength={5000}
              className="w-full p-3.5 rounded-xl border border-surface-border text-sm font-medium text-charcoal focus:border-charcoal outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-2">
              Property Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleChange('propertyType', type.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    formData.propertyType === type.id
                      ? 'border-airbnb bg-airbnb-light text-airbnb shadow-2xs font-bold'
                      : 'border-surface-border bg-white text-charcoal hover:border-charcoal/30'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Location */}
        <div className="bg-white border border-surface-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
            <MapPin className="w-5 h-5 text-airbnb" />
            <span>Location</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
                City <span className="text-airbnb">*</span>
              </label>
              <input
                type="text"
                value={formData.location.city}
                onChange={(e) => handleLocationChange('city', e.target.value)}
                placeholder="e.g. San Francisco"
                required
                className="w-full p-3.5 rounded-xl border border-surface-border text-sm font-medium text-charcoal focus:border-charcoal outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
                Area / Neighborhood
              </label>
              <input
                type="text"
                value={formData.location.area}
                onChange={(e) => handleLocationChange('area', e.target.value)}
                placeholder="e.g. Mission District"
                className="w-full p-3.5 rounded-xl border border-surface-border text-sm font-medium text-charcoal focus:border-charcoal outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
                Street Address <span className="text-meta font-normal">(Shared only after booking)</span>
              </label>
              <input
                type="text"
                value={formData.location.address}
                onChange={(e) => handleLocationChange('address', e.target.value)}
                placeholder="e.g. 120 Market Street, Apt 4B"
                className="w-full p-3.5 rounded-xl border border-surface-border text-sm font-medium text-charcoal focus:border-charcoal outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Capacity & Pricing */}
        <div className="bg-white border border-surface-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-airbnb" />
            <span>Capacity & Pricing</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                Price / Night ($)
              </label>
              <input
                type="number"
                min={1}
                value={formData.pricePerNight}
                onChange={(e) => handleChange('pricePerNight', e.target.value)}
                required
                className="w-full p-3 rounded-xl border border-surface-border text-sm font-bold text-charcoal focus:border-charcoal outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Max Guests
              </label>
              <input
                type="number"
                min={1}
                value={formData.maxGuests}
                onChange={(e) => handleChange('maxGuests', e.target.value)}
                required
                className="w-full p-3 rounded-xl border border-surface-border text-sm font-bold text-charcoal focus:border-charcoal outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5 flex items-center gap-1">
                <Bed className="w-3.5 h-3.5" />
                Bedrooms
              </label>
              <input
                type="number"
                min={0}
                value={formData.bedrooms}
                onChange={(e) => handleChange('bedrooms', e.target.value)}
                required
                className="w-full p-3 rounded-xl border border-surface-border text-sm font-bold text-charcoal focus:border-charcoal outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5 flex items-center gap-1">
                <Bath className="w-3.5 h-3.5" />
                Bathrooms
              </label>
              <input
                type="number"
                min={0}
                value={formData.bathrooms}
                onChange={(e) => handleChange('bathrooms', e.target.value)}
                required
                className="w-full p-3 rounded-xl border border-surface-border text-sm font-bold text-charcoal focus:border-charcoal outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Amenities */}
        <div className="bg-white border border-surface-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-airbnb" />
            <span>Offered Amenities</span>
          </h2>
          <p className="text-xs text-meta">Select all amenities available at your stay:</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {POPULAR_AMENITIES.map((amenity) => {
              const checked = formData.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    checked
                      ? 'border-charcoal bg-charcoal text-white'
                      : 'border-surface-border bg-surface-card hover:bg-neutral-200/60 text-charcoal'
                  }`}
                >
                  <span className="capitalize">{amenity}</span>
                  {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 5: Photos */}
        <div className="bg-white border border-surface-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
              <Upload className="w-5 h-5 text-airbnb" />
              <span>Property Photos ({formData.images.length})</span>
            </h2>
            <span className="text-xs font-semibold text-meta">Minimum 1 required</span>
          </div>

          {/* Add custom image URL */}
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Paste photo image URL (e.g. Unsplash, Cloudinary, etc.)"
              className="flex-1 p-3 rounded-xl border border-surface-border text-xs sm:text-sm font-medium text-charcoal outline-none focus:border-charcoal"
            />
            <button
              type="button"
              onClick={() => handleAddImage()}
              className="px-5 py-3 bg-charcoal hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add URL</span>
            </button>
          </div>

          {/* Preset Photos Bar */}
          <div>
            <p className="text-xs font-bold text-meta mb-2">Or add high-res architectural presets:</p>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {SAMPLE_PHOTO_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddImage(preset)}
                  className="w-16 h-12 rounded-xl overflow-hidden border border-surface-border shrink-0 hover:border-airbnb transition-all relative group"
                >
                  <img src={preset} alt="preset" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent flex items-center justify-center text-white">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Photos Grid Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {formData.images.map((img, index) => (
              <div
                key={index}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-surface-border bg-surface-card group"
              >
                <img src={img.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                {index === 0 && (
                  <span className="absolute top-2 left-2 bg-charcoal text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    Cover Photo
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            to="/host/properties"
            className="px-6 py-3 rounded-full border border-surface-border text-charcoal font-semibold text-sm hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-full bg-airbnb hover:bg-airbnb-dark text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Listing...</span>
              </>
            ) : (
              <span>{isEditing ? 'Save Changes' : 'Publish Listing'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
