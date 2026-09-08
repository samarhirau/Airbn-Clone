import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Plus, 
  Minus,
  Maximize2
} from 'lucide-react';
import { formatPrice } from '../../utils/formatCurrency';

const CITY_COORDS = {
  lisbon: { lat: 38.7223, lng: -9.1393 },
  barcelona: { lat: 41.3879, lng: 2.1699 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  paris: { lat: 48.8566, lng: 2.3522 },
  london: { lat: 51.5074, lng: -0.1278 },
  rome: { lat: 41.9028, lng: 12.4964 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  goa: { lat: 15.2993, lng: 74.124 },
  newyork: { lat: 40.7128, lng: -74.006 },
};

export default function StorefrontMap({ properties = [], onCloseMap }) {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(12);

  // Compute map center from properties coordinates or fallback
  const { centerLat, centerLng } = useMemo(() => {
    const validCoords = properties
      .map((p) => {
        if (p.location?.coordinates?.lat && p.location?.coordinates?.lng) {
          return {
            lat: Number(p.location.coordinates.lat),
            lng: Number(p.location.coordinates.lng),
          };
        }
        const cityKey = p.location?.city?.toLowerCase()?.replace(/\s+/g, '') || '';
        if (CITY_COORDS[cityKey]) return CITY_COORDS[cityKey];
        return null;
      })
      .filter(Boolean);

    if (validCoords.length > 0) {
      const sumLat = validCoords.reduce((acc, c) => acc + c.lat, 0);
      const sumLng = validCoords.reduce((acc, c) => acc + c.lng, 0);
      return {
        centerLat: sumLat / validCoords.length,
        centerLng: sumLng / validCoords.length,
      };
    }

    return { centerLat: 38.7223, centerLng: -9.1393 }; // Default Lisbon
  }, [properties]);

  const mapDelta = 0.09 / (zoomLevel / 11);
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - mapDelta * 1.4}%2C${centerLat - mapDelta * 0.9}%2C${centerLng + mapDelta * 1.4}%2C${centerLat + mapDelta * 0.9}&layer=mapnik&marker=${centerLat}%2C${centerLng}`;

  return (
    <div className="relative w-full h-[calc(100vh-190px)] min-h-[500px] rounded-3xl overflow-hidden border border-surface-border shadow-sm bg-neutral-100">
      {/* Map Iframe */}
      <iframe
        title="Storefront Interactive Map"
        src={embedUrl}
        className="w-full h-full border-0 select-none"
        loading="lazy"
      />

      {/* Floating Zoom Controls */}
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-1.5 shadow-md">
        <button
          onClick={() => setZoomLevel((z) => Math.min(z + 1, 16))}
          className="w-9 h-9 rounded-xl bg-white text-charcoal hover:bg-neutral-100 flex items-center justify-center border border-surface-border transition-colors cursor-pointer"
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(z - 1, 9))}
          className="w-9 h-9 rounded-xl bg-white text-charcoal hover:bg-neutral-100 flex items-center justify-center border border-surface-border transition-colors cursor-pointer"
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Center Radar Center Beacon */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <span className="absolute w-32 h-32 rounded-full bg-airbnb/15 animate-ping opacity-75" />
          <div className="w-4 h-4 rounded-full bg-airbnb border-2 border-white shadow-lg" />
        </div>
      </div>

      {/* Floating Property Interactive Carousel Card (Bottom Left) */}
      <div className="absolute left-4 bottom-4 z-20 max-w-sm w-[calc(100%-32px)] sm:w-88">
        {selectedProperty ? (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-surface-border shadow-2xl animate-in zoom-in-95 relative">
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-charcoal transition-colors cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <Link
              to={`/properties/${selectedProperty.id || selectedProperty._id}`}
              className="flex gap-3 group"
            >
              <img
                src={
                  selectedProperty.images?.[0]?.url ||
                  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80'
                }
                alt={selectedProperty.title}
                className="w-24 h-24 rounded-xl object-cover border border-surface-border shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="flex-1 min-w-0 pr-6 space-y-1">
                <div className="flex items-center gap-1 text-xs font-bold text-charcoal">
                  <Star className="w-3.5 h-3.5 fill-charcoal text-charcoal" />
                  <span>
                    {Number(selectedProperty.ratingAvg || 4.9).toFixed(2)}
                  </span>
                  <span className="text-meta font-normal">
                    ({selectedProperty.ratingCount || 12})
                  </span>
                </div>
                <h4 className="text-xs font-bold text-charcoal line-clamp-1 group-hover:text-airbnb transition-colors">
                  {selectedProperty.title}
                </h4>
                <p className="text-[11px] text-meta truncate">
                  {selectedProperty.location?.city}, {selectedProperty.location?.country}
                </p>
                <p className="text-xs font-extrabold text-charcoal">
                  {formatPrice(selectedProperty.pricePerNight)}{' '}
                  <span className="font-normal text-[10px] text-meta">/ night</span>
                </p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-surface-border shadow-md flex items-center justify-between text-xs font-bold text-charcoal">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-airbnb" />
              <span>Showing {properties.length} stays on map</span>
            </div>
            <span className="text-[10px] text-meta font-medium">
              Click pins to inspect
            </span>
          </div>
        )}
      </div>

      {/* Floating Property Price Pills Overlay */}
      <div className="absolute inset-x-8 inset-y-16 pointer-events-none flex flex-wrap items-center justify-around gap-6 p-6">
        {properties.slice(0, 10).map((property, idx) => {
          const isSelected =
            selectedProperty &&
            (selectedProperty.id === property.id || selectedProperty._id === property._id);

          return (
            <button
              key={property.id || property._id || idx}
              type="button"
              onClick={() => setSelectedProperty(property)}
              className={`pointer-events-auto px-3 py-1.5 rounded-full font-black text-xs shadow-lg transition-all transform hover:scale-110 active:scale-95 cursor-pointer flex items-center gap-1 border ${
                isSelected
                  ? 'bg-charcoal text-white border-charcoal ring-3 ring-airbnb/40 z-30 scale-105'
                  : 'bg-white text-charcoal border-surface-border hover:bg-neutral-50 z-10'
              }`}
            >
              <span>{formatPrice(property.pricePerNight)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
