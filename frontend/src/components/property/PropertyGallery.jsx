import { useState } from 'react';
import { Grid, X, ChevronLeft, ChevronRight } from 'lucide-react';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
];

export default function PropertyGallery({ images = [], title = 'Property Image' }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Normalize image array to at least 5 photos for authentic Airbnb mosaic
  const galleryImages = images && images.length > 0
    ? images.map((img) => (typeof img === 'string' ? img : img.url))
    : [];

  const displayImages = [...galleryImages];
  while (displayImages.length < 5) {
    displayImages.push(FALLBACK_IMAGES[displayImages.length % FALLBACK_IMAGES.length]);
  }

  const openLightbox = (index) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <div className="relative">
      {/* Airbnb 5-Image Mosaic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden md:h-[440px]">
        {/* Large Primary Image (Spans 2 cols, 2 rows) */}
        <div
          onClick={() => openLightbox(0)}
          className="md:col-span-2 md:row-span-2 relative h-72 md:h-full cursor-pointer group overflow-hidden bg-surface-card"
        >
          <img
            src={displayImages[0]}
            alt={`${title} - Primary`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
        </div>

        {/* 4 Quadrant Supporting Images */}
        {displayImages.slice(1, 5).map((imgUrl, index) => (
          <div
            key={index + 1}
            onClick={() => openLightbox(index + 1)}
            className="hidden md:block relative h-full cursor-pointer group overflow-hidden bg-surface-card"
          >
            <img
              src={imgUrl}
              alt={`${title} - view ${index + 2}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
          </div>
        ))}
      </div>

      {/* Show All Photos Floating Trigger */}
      <button
        onClick={() => openLightbox(0)}
        className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-charcoal border border-surface-border text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-md flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
      >
        <Grid className="w-4 h-4 text-charcoal" />
        <span>Show all {displayImages.length} photos</span>
      </button>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white max-w-7xl mx-auto w-full">
            <span className="text-sm font-semibold tracking-wide text-neutral-300">
              {activeImageIndex + 1} / {displayImages.length}
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close photo viewer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Photo Display */}
          <div className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full my-4">
            <img
              src={displayImages[activeImageIndex]}
              alt={`${title} - Lightbox ${activeImageIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
            />

            {/* Previous Button */}
            <button
              onClick={prevImage}
              className="absolute left-2 sm:-left-12 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={nextImage}
              className="absolute right-2 sm:-right-12 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Footer Captions */}
          <div className="text-center text-neutral-400 text-xs sm:text-sm">
            {title}
          </div>
        </div>
      )}
    </div>
  );
}
