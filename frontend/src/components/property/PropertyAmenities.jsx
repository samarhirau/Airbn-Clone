import { useState } from 'react';
import {
  Wifi,
  Waves,
  Utensils,
  Car,
  Wind,
  Tv,
  Dumbbell,
  PawPrint,
  Shirt,
  Laptop,
  Flame,
  ShieldCheck,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

const AMENITY_ICONS = {
  wifi: Wifi,
  pool: Waves,
  kitchen: Utensils,
  parking: Car,
  'free parking': Car,
  ac: Wind,
  'air conditioning': Wind,
  tv: Tv,
  gym: Dumbbell,
  pets: PawPrint,
  'pets allowed': PawPrint,
  washer: Shirt,
  dryer: Shirt,
  workspace: Laptop,
  'dedicated workspace': Laptop,
  fireplace: Flame,
  'smoke alarm': ShieldCheck,
  'security cameras': ShieldCheck,
  'hot tub': Waves,
  bbq: Utensils,
};

function formatAmenityName(name) {
  if (!name) return '';
  return name
    .split(/[-_ ]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function PropertyAmenities({ amenities = [] }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!amenities || amenities.length === 0) {
    return null;
  }

  const previewList = amenities.slice(0, 10);

  const getIcon = (amenity) => {
    const key = amenity.toLowerCase().trim();
    return AMENITY_ICONS[key] || Check;
  };

  return (
    <div className="py-8 border-b border-surface-border">
      <h2 className="text-xl sm:text-2xl font-bold text-charcoal mb-6">
        What this place offers
      </h2>

      {/* 2-Column Amenity Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {previewList.map((amenity, index) => {
          const Icon = getIcon(amenity);
          return (
            <div key={index} className="flex items-center gap-4 text-charcoal">
              <Icon className="w-6 h-6 text-charcoal stroke-[1.8] shrink-0" />
              <span className="text-base font-normal">{formatAmenityName(amenity)}</span>
            </div>
          );
        })}
      </div>

      {/* Expandable modal trigger */}
      {amenities.length > 10 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 border border-charcoal rounded-xl text-sm font-semibold text-charcoal hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Show all {amenities.length} amenities
          </button>
        </div>
      )}

      {/* All Amenities Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-surface-border">
            {/* Modal Header */}
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-airbnb" />
                <span>All Amenities ({amenities.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full hover:bg-surface-card text-charcoal transition-colors cursor-pointer"
                aria-label="Close amenities modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal List */}
            <div className="p-6 overflow-y-auto space-y-4 divide-y divide-surface-border">
              {amenities.map((amenity, idx) => {
                const Icon = getIcon(amenity);
                return (
                  <div key={idx} className="flex items-center gap-4 pt-4 first:pt-0">
                    <Icon className="w-5 h-5 text-charcoal stroke-[1.8] shrink-0" />
                    <span className="text-sm font-medium text-charcoal">{formatAmenityName(amenity)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
