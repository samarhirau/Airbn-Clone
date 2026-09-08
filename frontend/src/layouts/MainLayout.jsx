import { useState } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import SearchFilterModal from '../components/search/SearchFilterModal';

export default function MainLayout() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Active filters parsed from URL
  const activeFilters = {
    city: searchParams.get('city') || '',
    guests: searchParams.get('guests') ? Number(searchParams.get('guests')) : undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    propertyType: searchParams.get('propertyType') || '',
  };

  const handleApplyFilters = (newFilters) => {
    const nextParams = new URLSearchParams();
    if (newFilters.city) nextParams.set('city', newFilters.city);
    if (newFilters.guests) nextParams.set('guests', newFilters.guests);
    if (newFilters.minPrice) nextParams.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) nextParams.set('maxPrice', newFilters.maxPrice);
    if (newFilters.propertyType) nextParams.set('propertyType', newFilters.propertyType);
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
        <Outlet context={{ onOpenSearchModal: () => setIsSearchModalOpen(true) }} />
      </main>

      {/* 3. Airbnb Footer */}
      <Footer />
    </div>
  );
}
