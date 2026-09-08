import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import CategoryBar from '../components/home/CategoryBar';
import PropertyCard from '../components/home/PropertyCard';
import StorefrontMap from '../components/home/StorefrontMap';
import api from '../services/api';
import { SearchX, RefreshCw, Map as MapIcon, List } from 'lucide-react';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const outletContext = useOutletContext();
  const onOpenSearchModal = outletContext?.onOpenSearchModal;

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'

  // Active Category State
  const activePropertyType = searchParams.get('propertyType') || '';
  const [activeCategory, setActiveCategory] = useState(activePropertyType || 'all');
  const currentSort = searchParams.get('sort') || '';

  // Compute number of active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchParams.get('city')) count++;
    if (searchParams.get('guests')) count++;
    if (searchParams.get('bedrooms')) count++;
    if (searchParams.get('minPrice')) count++;
    if (searchParams.get('maxPrice')) count++;
    if (searchParams.get('propertyType')) count++;
    if (searchParams.get('amenities')) count++;
    return count;
  }, [searchParams]);

  // Fetch properties from Express backend based on URL filters
  useEffect(() => {
    let isMounted = true;
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);

      const params = {};
      const city = searchParams.get('city');
      const guests = searchParams.get('guests');
      const bedrooms = searchParams.get('bedrooms');
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      const propertyType = searchParams.get('propertyType');
      const amenities = searchParams.get('amenities');
      const sort = searchParams.get('sort');

      if (city) params.city = city;
      if (guests) params.guests = Number(guests);
      if (bedrooms) params.bedrooms = Number(bedrooms);
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
      if (propertyType) params.propertyType = propertyType;
      if (amenities) params.amenities = amenities;
      if (sort) params.sort = sort;

      try {
        const response = await api.get('/properties', { params });
        if (isMounted) {
          const list = response?.data || response || [];
          setProperties(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.userMessage || 'Failed to load properties');
          setProperties([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProperties();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleSelectCategory = (cat) => {
    setActiveCategory(cat.id);
    const nextParams = new URLSearchParams(searchParams);
    if (cat.filterType) {
      nextParams.set('propertyType', cat.filterType);
    } else {
      nextParams.delete('propertyType');
    }
    setSearchParams(nextParams);
  };

  const handleSelectSort = (sortValue) => {
    const nextParams = new URLSearchParams(searchParams);
    if (sortValue) {
      nextParams.set('sort', sortValue);
    } else {
      nextParams.delete('sort');
    }
    setSearchParams(nextParams);
  };

  const handleClearFilters = () => {
    setActiveCategory('all');
    setSearchParams(new URLSearchParams());
  };

  // Intelligent curated sections for section headers
  const curatedSections = useMemo(() => {
    if (!properties || properties.length === 0) return null;

    const searchedCity = searchParams.get('city');

    // If searched for a specific city, show custom section
    if (searchedCity) {
      return [
        {
          id: 'searched-city',
          title: `Available in ${searchedCity} this weekend`,
          subtitle: `${properties.length} spaces ready for check-in`,
          items: properties,
          onViewAll: null,
        },
      ];
    }

    // Curated storefront carousels matching Airbnb exact style
    const goaListings = properties.filter(
      (p) =>
        p.location?.city?.toLowerCase() === 'goa' ||
        p.title?.toLowerCase().includes('goa') ||
        p.propertyType === 'villa'
    );

    const metroListings = properties.filter(
      (p) =>
        ['mumbai', 'barcelona', 'madrid'].includes(p.location?.city?.toLowerCase()) ||
        ['condo', 'apartment', 'loft'].includes(p.propertyType)
    );

    const scenicListings = properties.filter(
      (p) =>
        ['pune', 'guarda', 'cascais', 'lisbon'].includes(p.location?.city?.toLowerCase()) ||
        ['cabin', 'cottage', 'villa'].includes(p.propertyType)
    );

    const sections = [];

    if (goaListings.length > 0) {
      sections.push({
        id: 'goa',
        title: 'Popular homes in Goa',
        subtitle: 'Coastal villas & beachside stays',
        items: goaListings,
        onViewAll: () => {
          const next = new URLSearchParams(searchParams);
          next.set('city', 'Goa');
          setSearchParams(next);
        },
      });
    }

    if (metroListings.length > 0) {
      sections.push({
        id: 'mumbai-metro',
        title: 'Available in Mumbai & top cities this weekend',
        subtitle: 'High-speed WiFi & skyline balconies',
        items: metroListings,
        onViewAll: () => {
          const next = new URLSearchParams(searchParams);
          next.set('propertyType', 'condo');
          setSearchParams(next);
        },
      });
    }

    if (scenicListings.length > 0) {
      sections.push({
        id: 'pune-scenic',
        title: 'Homes in Pune & scenic getaways',
        subtitle: 'Nature retreats, cabins & valley views',
        items: scenicListings,
        onViewAll: () => {
          const next = new URLSearchParams(searchParams);
          next.set('propertyType', 'cabin');
          setSearchParams(next);
        },
      });
    }

    return sections;
  }, [properties, searchParams]);

  return (
    <div className="min-h-screen bg-white pb-24 relative">
      {/* 1. Horizontal Categories Bar */}
      <CategoryBar
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onOpenFilterModal={onOpenSearchModal}
        activeFiltersCount={activeFiltersCount}
        currentSort={currentSort}
        onSelectSort={handleSelectSort}
      />

      {/* 2. Main Content (Grid View vs Map View) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3 animate-pulse">
                <div className="aspect-[20/19] w-full rounded-2xl bg-neutral-200" />
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-neutral-200 rounded w-2/3" />
                    <div className="h-4 bg-neutral-200 rounded w-10" />
                  </div>
                  <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  <div className="h-3 bg-neutral-100 rounded w-1/3" />
                  <div className="h-4 bg-neutral-200 rounded w-1/4 pt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <p className="text-charcoal font-semibold text-lg">{error}</p>
            <button
              onClick={() => setSearchParams(new URLSearchParams(searchParams))}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-charcoal text-white text-xs font-bold hover:bg-black transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && properties.length === 0 && (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-surface-card border border-surface-border flex items-center justify-center mx-auto text-charcoal">
              <SearchX className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-charcoal">No exact matches</h3>
              <p className="text-meta text-sm">
                Try expanding your price range, adjusting bedroom count, or searching a different destination.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleClearFilters}
                className="px-6 py-2.5 rounded-full border border-charcoal text-charcoal font-bold text-xs hover:bg-surface-card transition-colors shadow-sm cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

    {/* Render Grid View with Curated Section Rows */}
        {!loading && !error && properties.length > 0 && viewMode === 'grid' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* 1. Curated Section Rows with Bold Headers & (< >) Nav Buttons */}
            {curatedSections && curatedSections.length > 0 && (
              <div className="space-y-6">
                {curatedSections.map((sec) => (
                  <PropertySectionRow
                    key={sec.id}
                    title={sec.title}
                    subtitle={sec.subtitle}
                    properties={sec.items}
                    onViewAll={sec.onViewAll}
                  />
                ))}
              </div>
            )}

            {/* 2. Global Comprehensive Grid */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl sm:text-2xl font-bold text-charcoal flex items-center gap-2">
                  <span>Explore all verified stays</span>
                  <span className="text-xs font-semibold text-meta">
                    • {properties.length} {properties.length === 1 ? 'home' : 'homes'} available
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {properties.map((property) => (
              <PropertyCard
                key={property.id || property._id}
                property={property}
              />
            ))}
              </div>
            </div>
          </div>
        )}

        {/* Render Map View */}
        {!loading && !error && properties.length > 0 && viewMode === 'map' && (
          <div className="animate-in fade-in duration-200">
            <StorefrontMap
              properties={properties}
              onCloseMap={() => setViewMode('grid')}
            />
          </div>
        )}
      </div>

      {/* 3. Airbnb Signature Floating Map/List Pill Button */}
      {!loading && properties.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 flex justify-center pointer-events-none z-30">
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'grid' ? 'map' : 'grid'))}
            className="pointer-events-auto bg-charcoal hover:bg-black text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-extrabold hover:scale-105 active:scale-95 transition-all cursor-pointer border border-neutral-700 select-none"
          >
            {viewMode === 'grid' ? (
              <>
                <span>Show map</span>
                <MapIcon className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Show list</span>
                <List className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
