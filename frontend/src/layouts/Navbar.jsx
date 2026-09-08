import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Home as HomeIcon, Search, Globe, Menu, User } from 'lucide-react';

export default function Navbar({ onOpenSearch, activeFilters = {} }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute dynamic pill search text if filters applied
  const whereText = activeFilters.city || 'Anywhere';
  const guestsText = activeFilters.guests ? `${activeFilters.guests} guest${activeFilters.guests > 1 ? 's' : ''}` : 'Add guests';

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-surface-border transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* 1. Left: "StayHub" logo with a house icon in Airbnb Coral (#FF385C) */}
          <Link to="/" className="flex items-center gap-2 text-airbnb hover:opacity-90 transition-opacity">
            <HomeIcon className="w-8 h-8 stroke-[2.4] fill-airbnb/10 text-airbnb" />
            <span className="font-extrabold text-xl tracking-tight text-airbnb hidden sm:inline-block">
              StayHub
            </span>
          </Link>

          {/* 2. Center: The iconic Airbnb pill search bar */}
          <div
            onClick={onOpenSearch}
            className="flex items-center divide-x divide-surface-border border border-surface-border rounded-full shadow-pill hover:shadow-pill-hover transition-all py-2 px-3 text-sm font-semibold text-charcoal bg-white cursor-pointer select-none"
          >
            <button type="button" className="px-3 hover:text-airbnb transition-colors truncate max-w-[120px]">
              {whereText}
            </button>
            <button type="button" className="px-3 hover:text-airbnb transition-colors hidden md:block">
              Any week
            </button>
            <div className="pl-3 pr-1 flex items-center gap-3 text-meta font-normal">
              <span className="truncate max-w-[100px]">{guestsText}</span>
              <div className="p-2 rounded-full bg-airbnb text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                <Search className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* 3. Right: "Become a Host", Globe icon, and rounded pill profile menu */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/host"
              className="text-sm font-semibold text-charcoal hover:bg-surface-card px-3.5 py-2.5 rounded-full transition-colors hidden sm:block"
            >
              Become a Host
            </Link>

            <button
              className="p-2.5 text-charcoal hover:bg-surface-card rounded-full transition-colors hidden sm:block"
              aria-label="Language and currency"
            >
              <Globe className="w-4 h-4" />
            </button>

            {/* Rounded Pill Profile Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 border border-surface-border rounded-full py-1.5 pl-3.5 pr-2 hover:shadow-pill transition-all cursor-pointer bg-white"
                aria-label="User menu"
              >
                <Menu className="w-4 h-4 text-charcoal" />
                <div className="w-7 h-7 rounded-full bg-charcoal text-white flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-surface-border py-2 z-50 text-sm font-medium animate-in fade-in zoom-in-95 duration-150">
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 hover:bg-surface-card font-bold text-charcoal transition-colors"
                  >
                    Sign up
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                  >
                    Log in
                  </Link>
                  <div className="my-1.5 border-t border-surface-border" />
                  <Link
                    to="/host"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                  >
                    Airbnb your home
                  </Link>
                  <a
                    href="#help"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                  >
                    Help Center
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
