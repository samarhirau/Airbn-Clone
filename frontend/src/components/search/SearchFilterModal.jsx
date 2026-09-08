import { useState, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Minus,
  MapPin,
  DollarSign,
  Users,
  Home,
  Bed,
  Sparkles,
  Check,
  Building,
} from 'lucide-react';

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment' },
  { id: 'house', label: 'House' },
  { id: 'villa', label: 'Villa' },
  { id: 'condo', label: 'Condo' },
  { id: 'cabin', label: 'Cabin' },
  { id: 'studio', label: 'Studio' },
  { id: 'cottage', label: 'Cottage' },
  { id: 'loft', label: 'Loft' },
];

const POPULAR_AMENITIES = [
  { id: 'wifi', label: 'Wifi' },
  { id: 'pool', label: 'Pool' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'parking', label: 'Free parking' },
  { id: 'air conditioning', label: 'Air conditioning' },
  { id: 'tv', label: 'TV' },
  { id: 'gym', label: 'Gym' },
  { id: 'pets allowed', label: 'Pet friendly' },
  { id: 'dedicated workspace', label: 'Dedicated workspace' },
];

const QUICK_CITIES = [
  'Lisbon',
  'Madrid',
  'Barcelona',
  'Paris',
  'Rome',
  'London',
  'Tokyo',
  'Goa',
  'New York',
];

export default function SearchFilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters = {},
}) {
  const [city, setCity] = useState(initialFilters.city || '');
  const [guests, setGuests] = useState(initialFilters.guests || 1);
  const [bedrooms, setBedrooms] = useState(initialFilters.bedrooms || '');
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || '');
  const [propertyType, setPropertyType] = useState(initialFilters.propertyType || '');
  const [selectedAmenities, setSelectedAmenities] = useState(
    initialFilters.amenities ? initialFilters.amenities.split(',').filter(Boolean) : []
  );

  useEffect(() => {
    setCity(initialFilters.city || '');
    setGuests(initialFilters.guests || 1);
    setBedrooms(initialFilters.bedrooms || '');
    setMinPrice(initialFilters.minPrice || '');
    setMaxPrice(initialFilters.maxPrice || '');
    setPropertyType(initialFilters.propertyType || '');
    setSelectedAmenities(
      initialFilters.amenities
        ? initialFilters.amenities.split(',').filter(Boolean)
        : []
    );
  }, [initialFilters, isOpen]);

  if (!isOpen) return null;

  const toggleAmenity = (id) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleClear = () => {
    setCity('');
    setGuests(1);
    setBedrooms('');
    setMinPrice('');
    setMaxPrice('');
    setPropertyType('');
    setSelectedAmenities([]);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    onApplyFilters({
      city: city.trim() || undefined,
      guests: guests > 1 ? guests : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      propertyType: propertyType || undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities.join(',') : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 px-4 bg-black/50 backdrop-blur-xs transition-opacity overflow-y-auto pb-12">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-surface-border max-w-2xl w-full p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div>
            <h2 className="text-xl font-black text-charcoal tracking-tight">
              Filters & Preferences
            </h2>
            <p className="text-xs text-meta">Tailor your ideal stay anywhere in the world</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 text-meta hover:text-charcoal transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          {/* 1. Destination / City */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
              <MapPin className="w-4 h-4 text-airbnb" />
              <span>Where</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search destinations (e.g., Lisbon, Barcelona, Paris)"
              className="w-full px-4 py-3 rounded-xl border border-surface-border text-sm font-medium focus:border-charcoal outline-none bg-neutral-50/50"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    city.toLowerCase() === c.toLowerCase()
                      ? 'bg-charcoal text-white border-charcoal'
                      : 'bg-surface-card hover:bg-neutral-200/70 text-charcoal border-surface-border'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Price Range */}
          <div className="space-y-2.5 pt-3 border-t border-surface-border">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-airbnb" />
              <span>Price Range (USD / Night)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs text-meta font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm font-semibold focus:border-charcoal outline-none bg-neutral-50/50"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs text-meta font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm font-semibold focus:border-charcoal outline-none bg-neutral-50/50"
                />
              </div>
            </div>
          </div>

          {/* 3. Guests & Bedrooms Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-surface-border">
            {/* Guests */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
                <Users className="w-4 h-4 text-airbnb" />
                <span>Guests</span>
              </label>
              <div className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-neutral-50/50">
                <span className="text-xs font-semibold text-charcoal">Capacity</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={guests <= 1}
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-7 h-7 rounded-full border border-surface-border flex items-center justify-center text-charcoal disabled:opacity-30 hover:border-charcoal transition-colors cursor-pointer bg-white"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-charcoal w-4 text-center">
                    {guests}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuests(guests + 1)}
                    className="w-7 h-7 rounded-full border border-surface-border flex items-center justify-center text-charcoal hover:border-charcoal transition-colors cursor-pointer bg-white"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
                <Bed className="w-4 h-4 text-airbnb" />
                <span>Bedrooms</span>
              </label>
              <div className="flex items-center gap-1.5 pt-0.5">
                {['', '1', '2', '3', '4+'].map((num) => {
                  const val = num === '4+' ? '4' : num;
                  const isSelected = bedrooms === val;
                  return (
                    <button
                      key={num || 'any'}
                      type="button"
                      onClick={() => setBedrooms(isSelected ? '' : val)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-charcoal text-white border-charcoal shadow-2xs'
                          : 'bg-white border-surface-border text-charcoal hover:border-charcoal/40'
                      }`}
                    >
                      {num || 'Any'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Property Type Pills */}
          <div className="space-y-2.5 pt-3 border-t border-surface-border">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
              <Home className="w-4 h-4 text-airbnb" />
              <span>Property Type</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROPERTY_TYPES.map((type) => {
                const isSelected = propertyType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setPropertyType(isSelected ? '' : type.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-charcoal bg-charcoal text-white font-bold'
                        : 'border-surface-border bg-white text-charcoal hover:border-charcoal/40'
                    }`}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Amenities Multi-Select */}
          <div className="space-y-2.5 pt-3 border-t border-surface-border">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-airbnb" />
              <span>Verified Amenities</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_AMENITIES.map((amenity) => {
                const isChecked = selectedAmenities.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-neutral-50/50 border-surface-border text-charcoal hover:bg-neutral-100'
                    }`}
                  >
                    <span>{amenity.label}</span>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-bold text-charcoal underline hover:text-airbnb transition-colors cursor-pointer"
            >
              Clear all
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-7 py-3 rounded-full bg-airbnb hover:bg-airbnb-dark text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Show Stays</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
