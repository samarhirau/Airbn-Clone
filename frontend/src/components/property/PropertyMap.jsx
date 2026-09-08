import { useState, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Compass, 
  Bus, 
  Coffee, 
  ShieldCheck,
  Plus,
  Minus,
  Maximize2
} from 'lucide-react';

// City center coordinate fallbacks if not populated
const CITY_COORDINATES = {
  lisbon: { lat: 38.7223, lng: -9.1393 },
  barcelona: { lat: 41.3879, lng: 2.1699 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  paris: { lat: 48.8566, lng: 2.3522 },
  london: { lat: 51.5074, lng: -0.1278 },
  rome: { lat: 41.9028, lng: 12.4964 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  goa: { lat: 15.2993, lng: 74.124 },
  guarda: { lat: 40.5373, lng: -7.2658 },
  newyork: { lat: 40.7128, lng: -74.006 },
};

export default function PropertyMap({ property }) {
  const [zoomLevel, setZoomLevel] = useState(14);

  // Extract coordinates or fallback to city center
  const { lat, lng } = useMemo(() => {
    if (property?.location?.coordinates?.lat && property?.location?.coordinates?.lng) {
      return {
        lat: Number(property.location.coordinates.lat),
        lng: Number(property.location.coordinates.lng),
      };
    }
    const cityKey = property?.location?.city?.toLowerCase()?.replace(/\s+/g, '') || '';
    if (CITY_COORDINATES[cityKey]) {
      return CITY_COORDINATES[cityKey];
    }
    return { lat: 38.7223, lng: -9.1393 }; // Default Lisbon
  }, [property]);

  const cityName = property?.location?.city || 'City Center';
  const areaName = property?.location?.area || '';
  const countryName = property?.location?.country || '';

  // OpenStreetMap embed URL with dynamic bounding box
  const mapDelta = 0.035 / (zoomLevel / 12);
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - mapDelta}%2C${lat - mapDelta * 0.7}%2C${lng + mapDelta}%2C${lat + mapDelta * 0.7}&layer=mapnik&marker=${lat}%2C${lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1, 17));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1, 11));
  };

  return (
    <div className="py-8 border-t border-surface-border">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight">
            Where you'll be
          </h3>
          <p className="text-sm text-meta mt-1">
            {areaName ? `${areaName}, ` : ''}{cityName}, {countryName}
          </p>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal hover:text-airbnb transition-colors"
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5 text-meta" />
        </a>
      </div>

      {/* Interactive Map Canvas Container */}
      <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden border border-surface-border shadow-sm group">
        {/* OpenStreetMap Iframe */}
        <iframe
          title={`Map of ${cityName}`}
          src={embedUrl}
          className="w-full h-full border-0 select-none"
          loading="lazy"
        />

        {/* Floating Custom Radar Pin Overlay (Centered) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Animated Radar Pulse Rings */}
            <span className="absolute w-24 h-24 rounded-full bg-airbnb/20 animate-ping opacity-75" />
            <span className="absolute w-36 h-36 rounded-full bg-airbnb/10 border border-airbnb/30" />

            {/* Pink Marker Pill */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-airbnb text-white flex items-center justify-center shadow-xl border-3 border-white">
              <MapPin className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Floating Zoom & Compass Controls */}
        <div className="absolute right-4 top-4 z-10 flex flex-col gap-1.5 shadow-md">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-white text-charcoal hover:bg-neutral-100 flex items-center justify-center border border-surface-border transition-colors cursor-pointer"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-white text-charcoal hover:bg-neutral-100 flex items-center justify-center border border-surface-border transition-colors cursor-pointer"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Coordinates Pill */}
        <div className="absolute left-4 bottom-4 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-surface-border shadow-md flex items-center gap-1.5 text-[11px] font-bold text-charcoal">
          <Compass className="w-3.5 h-3.5 text-airbnb" />
          <span>
            {lat.toFixed(4)}° N, {lng.toFixed(4)}° W
          </span>
        </div>
      </div>

      {/* Neighborhood Guide Highlights */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-neutral-50 border border-surface-border/60 space-y-1.5">
          <div className="flex items-center gap-2 text-charcoal font-bold text-xs">
            <Bus className="w-4 h-4 text-airbnb" />
            <span>Transit & Access</span>
          </div>
          <p className="text-[11px] text-meta leading-relaxed">
            Conveniently situated near local metro and bus lines for effortless city exploration.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-50 border border-surface-border/60 space-y-1.5">
          <div className="flex items-center gap-2 text-charcoal font-bold text-xs">
            <Coffee className="w-4 h-4 text-amber-600" />
            <span>Cafes & Dining</span>
          </div>
          <p className="text-[11px] text-meta leading-relaxed">
            Walking distance to artisanal bakeries, local markets, and traditional restaurants.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-50 border border-surface-border/60 space-y-1.5">
          <div className="flex items-center gap-2 text-charcoal font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Peace of Mind</span>
          </div>
          <p className="text-[11px] text-meta leading-relaxed">
            Exact address and check-in door codes are delivered immediately upon booking.
          </p>
        </div>
      </div>
    </div>
  );
}
