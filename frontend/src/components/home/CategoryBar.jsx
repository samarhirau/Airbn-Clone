import { useState } from 'react';
import { 
  Compass, 
  Palmtree, 
  Home as HomeIcon, 
  Building2, 
  Mountain, 
  Castle, 
  Waves, 
  Flame, 
  Sailboat, 
  Box, 
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown,
  Check
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Homes', icon: Compass, filterType: null },
  { id: 'beachfront', label: 'Beachfront', icon: Palmtree, filterType: 'villa' },
  { id: 'cabins', label: 'Cabins', icon: HomeIcon, filterType: 'cabin' },
  { id: 'cities', label: 'Iconic cities', icon: Building2, filterType: 'apartment' },
  { id: 'countryside', label: 'Countryside', icon: Mountain, filterType: 'cottage' },
  { id: 'mansions', label: 'Mansions', icon: Castle, filterType: 'villa' },
  { id: 'pools', label: 'Amazing pools', icon: Waves, filterType: 'villa' },
  { id: 'trending', label: 'Trending', icon: Flame, filterType: null },
  { id: 'lakefront', label: 'Lakefront', icon: Sailboat, filterType: 'house' },
  { id: 'tiny', label: 'Tiny homes', icon: Box, filterType: 'studio' },
  { id: 'design', label: 'Design', icon: Sparkles, filterType: 'condo' },
];

const SORT_OPTIONS = [
  { id: '', label: 'Recommended' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Top Rated' },
  { id: 'newest', label: 'Newest Additions' },
];

export default function CategoryBar({
  activeCategory,
  onSelectCategory,
  onOpenFilterModal,
  activeFiltersCount = 0,
  currentSort = '',
  onSelectSort,
}) {
  const [showSortMenu, setShowSortMenu] = useState(false);

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.id === currentSort)?.label || 'Sort';


  return (
    <div className="border-b border-surface-border bg-white sticky top-20 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Horizontal Category Scroller */}
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-3.5 scroll-smooth flex-1">

          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat)}
                className={`flex flex-col items-center gap-2 pb-2 min-w-max border-b-2 transition-all duration-200 group cursor-pointer ${
                
                  isSelected
                    ? 'border-charcoal text-charcoal font-bold'
                    : 'border-transparent text-meta hover:text-charcoal hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`w-6 h-6 transition-transform duration-200 group-hover:scale-105 ${
                    isSelected
                      ? 'text-charcoal stroke-[2.2]'
                      : 'text-meta group-hover:text-charcoal stroke-[1.8]'
                  }`}
                />
                <span
                  className={`text-xs tracking-tight ${
                    isSelected ? 'text-charcoal' : 'text-meta'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

          {/* Right Tools: Sort Selector & Filters Button */}
        <div className="hidden sm:flex items-center gap-2 pl-2 shrink-0">
          {/* Sort Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-border hover:border-charcoal text-xs font-semibold text-charcoal transition-all cursor-pointer bg-white"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-meta" />
              <span className="hidden lg:inline">{currentSortLabel}</span>
            </button>

            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-surface-border py-1.5 z-40 animate-in fade-in zoom-in-95">
                <p className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-meta">
                  Sort Properties
                </p>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onSelectSort(opt.id);
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer hover:bg-neutral-100 ${
                      currentSort === opt.id
                        ? 'font-bold text-charcoal bg-neutral-50'
                        : 'text-charcoal'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {currentSort === opt.id && (
                      <Check className="w-3.5 h-3.5 text-charcoal" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

        {/* Filters Quick Button */}
          <button
            onClick={onOpenFilterModal}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
              activeFiltersCount > 0
                ? 'border-charcoal bg-charcoal text-white hover:bg-neutral-800'
                : 'border-surface-border hover:border-charcoal text-charcoal bg-white'
            }`}
            >
            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-airbnb text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
