import { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import CategoryBar from '../components/home/CategoryBar';
import PropertyCard from '../components/home/PropertyCard';
import api from '../services/api';
import { SearchX, RefreshCw } from 'lucide-react';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const outletContext = useOutletContext();
  const onOpenSearchModal = outletContext?.onOpenSearchModal;

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Category State
  const activePropertyType = searchParams.get('propertyType') || '';
  const [activeCategory, setActiveCategory] = useState(activePropertyType || 'all');

  // Fetch properties from Express backend based on URL filters
  useEffect(() => {
    let isMounted = true;
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);

      const params = {};
      const city = searchParams.get('city');
      const guests = searchParams.get('guests');
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      const propertyType = searchParams.get('propertyType');

      if (city) params.city = city;
      if (guests) params.guests = Number(guests);
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
      if (propertyType) params.propertyType = propertyType;

      try {
        const response = await api.get('/properties', { params });
        if (isMounted) {
          // Backend sends { success: true, data: [...], pagination: {...} }
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

  const handleClearFilters = () => {
    setActiveCategory('all');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* 1. Horizontal Categories Bar */}
      <CategoryBar
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onOpenFilterModal={onOpenSearchModal}
      />

      {/* 2. Property Feed Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3 animate-pulse">
                <div className="aspect-[20/19] w-full rounded-2xl bg-gray-200" />
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-10" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/4 pt-1" />
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
                Try changing or clearing some of your filters or searching a different destination.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleClearFilters}
                className="px-6 py-2.5 rounded-full border border-charcoal text-charcoal font-bold text-xs hover:bg-surface-card transition-colors shadow-sm"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Real Property Cards Grid */}
        {!loading && !error && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id || property._id}
                property={property}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
