import { useState } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import SearchFilterModal from '../components/search/SearchFilterModal';
import OfflineBanner from '../components/common/OfflineBanner';

export default function MainLayout() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Active filters parsed from URL
  const activeFilters = {
    city: searchParams.get('city') || '',
    guests: searchParams.get('guests') ? Number(searchParams.get('guests')) : undefined,
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    propertyType: searchParams.get('propertyType') || '',
    amenities: searchParams.get('amenities') || '',
    sort: searchParams.get('sort') || '',
  };

  const handleApplyFilters = (newFilters) => {
    const nextParams = new URLSearchParams();
     ['city', 'guests', 'bedrooms', 'minPrice', 'maxPrice', 'propertyType', 'amenities', 'sort'].forEach((key) => {
      if (newFilters[key]) {
        nextParams.set(key, newFilters[key]);
      }
    });
    setSearchParams(nextParams);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 1. Sticky Airbnb Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchModalOpen(true)}
        activeFilters={activeFilters}
      />

      {/* Search Filter Modal */}
      <SearchFilterModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={activeFilters}
      />

      {/* 2. Main Page Content (e.g. CategoryBar + Property Feed) */}
      <main className="flex-1">
        <Outlet context={{ onOpenSearchModal: () => setIsSearchModalOpen(true), activeFilters }} />

      </main>

      {/* 3. Airbnb Footer */}
      <Footer />
      
      {/* 4. Real-time Network Resilience Banner */}
      <OfflineBanner />
    </div>
  );
}
