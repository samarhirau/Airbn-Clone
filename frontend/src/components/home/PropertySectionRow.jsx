import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import PropertyCard from './PropertyCard';


export default function PropertySectionRow({
  title,
  subtitle,
  properties = [],
  onViewAll,
  className = '',
}) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Monitor scroll boundaries
  const checkScrollBounds = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    // Allow small tolerance for fractional pixel rendering
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScrollBounds();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollBounds, { passive: true });
    window.addEventListener('resize', checkScrollBounds);

    return () => {
      el.removeEventListener('scroll', checkScrollBounds);
      window.removeEventListener('resize', checkScrollBounds);
    };
  }, [properties]);

  const handleScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Scroll by ~2 card widths
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!properties || properties.length === 0) return null;

  return (
    <section className={`py-6 select-none ${className}`}>
      {/* 1. Airbnb Signature Section Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Left: Bold title with right arrow */}
        <div className="flex items-baseline gap-2">
          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="group inline-flex items-center gap-1.5 text-left text-xl sm:text-2xl font-bold text-charcoal hover:text-black transition-colors cursor-pointer"
            >
              <span>{title}</span>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-charcoal group-hover:translate-x-1.5 transition-transform duration-200 inline-block stroke-[2.5]" />
            </button>
          ) : (
            <div className="group inline-flex items-center gap-1.5 text-xl sm:text-2xl font-bold text-charcoal">
              <span>{title}</span>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-charcoal stroke-[2.5]" />
            </div>
          )}

          {subtitle && (
            <span className="hidden sm:inline-block text-xs font-semibold text-meta">
              • {subtitle}
            </span>
          )}
        </div>

        {/* Right: Circular (< >) Navigation Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border border-neutral-300 bg-white flex items-center justify-center text-charcoal hover:border-charcoal hover:bg-neutral-50 active:scale-90 transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:border-neutral-300 disabled:hover:bg-white shadow-xs"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
          </button>

          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border border-neutral-300 bg-white flex items-center justify-center text-charcoal hover:border-charcoal hover:bg-neutral-50 active:scale-90 transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:border-neutral-300 disabled:hover:bg-white shadow-xs"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 2. Horizontal Carousel of Property Cards */}
      <div
        ref={scrollContainerRef}
        className="flex gap-5 overflow-x-auto scroll-smooth no-scrollbar py-1 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {properties.map((property) => {
          const id = property?._id || property?.id;
          return (
            <div
              key={id}
              className="min-w-[270px] max-w-[310px] w-[75vw] sm:w-[45vw] md:w-[32vw] lg:w-[280px] flex-shrink-0 snap-start"
            >
              <PropertyCard property={property} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
