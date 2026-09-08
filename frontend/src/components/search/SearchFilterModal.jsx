import { useState } from 'react';
import { X, Search, Plus, Minus, MapPin, DollarSign, Users } from 'lucide-react';

export default function SearchFilterModal({ isOpen, onClose, onApplyFilters, initialFilters = {} }) {
  const [city, setCity] = useState(initialFilters.city || '');
  const [guests, setGuests] = useState(initialFilters.guests || 1);
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || '');

  if (!isOpen) return null;

  const quickCities = ['Lisbon', 'Madrid', 'Barcelona', 'Paris', 'Rome', 'Porto'];

  const handleClear = () => {
    setCity('');
    setGuests(1);
    setMinPrice('');
    setMaxPrice('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onApplyFilters({
      city: city.trim() || undefined,
      guests: guests > 1 ? guests : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-surface-border max-w-2xl w-full p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <h2 className="text-xl font-bold text-charcoal">Filter stays</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-card text-charcoal transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          {/* 1. Destination / City */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-charcoal flex items-center gap-2">
              <MapPin className="w-4 h-4 text-airbnb" />
              <span>Where</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search destinations (e.g., Lisbon, Madrid)"
              className="w-full px-4 py-3 rounded-2xl border border-surface-border text-sm font-medium focus:border-charcoal focus:ring-1 focus:ring-charcoal outline-none transition-all placeholder:text-meta/70"
            />

            <div className="flex flex-wrap gap-2 pt-1">
              {quickCities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    city.toLowerCase() === c.toLowerCase()
                      ? 'bg-charcoal text-white border-charcoal'
                      : 'bg-surface-card hover:bg-gray-200 text-charcoal border-surface-border'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-surface-border">
            {/* 2. Guests Counter */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-charcoal flex items-center gap-2">
                <Users className="w-4 h-4 text-airbnb" />
                <span>Who</span>
              </label>
              <div className="flex items-center justify-between p-3 rounded-2xl border border-surface-border bg-surface-card/40">
                <div>
                  <span className="text-sm font-bold text-charcoal block">Guests</span>
                  <span className="text-xs text-meta">Ages 13 or above</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={guests <= 1}
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-8 h-8 rounded-full border border-surface-border flex items-center justify-center text-charcoal disabled:opacity-30 hover:border-charcoal transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-charcoal w-5 text-center">{guests}</span>
                  <button
                    type="button"
                    onClick={() => setGuests(guests + 1)}
                    className="w-8 h-8 rounded-full border border-surface-border flex items-center justify-center text-charcoal hover:border-charcoal transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Price Range ($ / USD) */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-charcoal flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-airbnb" />
                <span>Price Range (per night)</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-xs text-meta font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-surface-border text-sm font-medium focus:border-charcoal outline-none"
                  />
                </div>
                <span className="text-meta font-bold">–</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-xs text-meta font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-surface-border text-sm font-medium focus:border-charcoal outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={handleClear}
              className="text-sm font-bold text-charcoal underline hover:opacity-80 transition-opacity"
            >
              Clear all
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-airbnb hover:bg-airbnb-hover text-white font-bold text-sm shadow-sm hover:shadow-airbnb transition-all"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Show stays</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
