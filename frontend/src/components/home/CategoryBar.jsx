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
  SlidersHorizontal
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

export default function CategoryBar({ activeCategory, onSelectCategory, onOpenFilterModal }) {
  return (
    <div className="border-b border-surface-border bg-white sticky top-20 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Horizontal Category Scroller */}
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-3.5 scroll-smooth">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat)}
                className={`flex flex-col items-center gap-2 pb-2 min-w-max border-b-2 transition-all duration-200 group ${
                  isSelected
                    ? 'border-charcoal text-charcoal'
                    : 'border-transparent text-meta hover:text-charcoal hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`w-6 h-6 transition-transform duration-200 group-hover:scale-105 ${
                    isSelected ? 'text-charcoal stroke-[2.2]' : 'text-meta group-hover:text-charcoal stroke-[1.8]'
                  }`}
                />
                <span className={`text-xs font-semibold tracking-tight ${isSelected ? 'text-charcoal' : 'text-meta'}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters Quick Button */}
        <div className="hidden sm:flex items-center pl-2">
          <button
            onClick={onOpenFilterModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-border hover:border-charcoal text-xs font-semibold text-charcoal transition-all shadow-sm hover:shadow"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
