import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Search, 
  Globe, 
  Menu, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Briefcase, 
  Heart, 
  ShieldAlert, 
  PlusCircle, 
  CalendarDays,
  Settings,
  Tag
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import RoleBadge from '../components/common/RoleBadge';

export default function Navbar({ onOpenSearch, activeFilters = {} }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, role, logout } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  const whereText = activeFilters.city || 'Anywhere';
  const guestsText = activeFilters.guests ? `${activeFilters.guests} guest${activeFilters.guests > 1 ? 's' : ''}` : 'Add guests';

  // User initials for avatar
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-surface-border transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* 1. Left Logo */}
          <Link to="/" className="flex items-center gap-2 text-airbnb hover:opacity-90 transition-opacity">
            <HomeIcon className="w-8 h-8 stroke-[2.4] fill-airbnb/10 text-airbnb" />
            <span className="font-extrabold text-xl tracking-tight text-airbnb hidden sm:inline-block">
              StayHub
            </span>
          </Link>

          {/* 2. Center Pill Search Bar */}
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

          {/* 3. Right Navigation & Dynamic Auth State */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Contextual links based on role */}
            {!isAuthenticated ? (
              <Link
                to="/register?role=owner"
                className="text-sm font-semibold text-charcoal hover:bg-surface-card px-3.5 py-2.5 rounded-full transition-colors hidden md:block"
              >
                Become a Host
              </Link>
            ) : (
              <>
                {role === 'owner' && (
                  <Link
                    to="/host/dashboard"
                    className="text-xs sm:text-sm font-bold text-airbnb hover:bg-airbnb-light px-3.5 py-2 rounded-full transition-colors flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Host Dashboard</span>
                  </Link>
                )}

                {role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="text-xs sm:text-sm font-bold text-indigo-700 hover:bg-indigo-50 px-3.5 py-2 rounded-full transition-colors flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin Console</span>
                  </Link>
                )}

                {role === 'customer' && (
                  <Link
                    to="/bookings"
                    className="text-sm font-semibold text-charcoal hover:bg-surface-card px-3.5 py-2.5 rounded-full transition-colors hidden sm:block"
                  >
                    My Trips
                  </Link>
                )}
              </>
            )}

            <button
              className="p-2.5 text-charcoal hover:bg-surface-card rounded-full transition-colors hidden lg:block"
              aria-label="Language and currency"
            >
              <Globe className="w-4 h-4" />
            </button>

            {/* Profile Dropdown Trigger Pill */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 border border-surface-border rounded-full py-1.5 pl-3.5 pr-1.5 hover:shadow-pill transition-all cursor-pointer bg-white focus:outline-none"
                aria-label="User navigation menu"
              >
                <Menu className="w-4 h-4 text-charcoal" />

                {/* Avatar with dynamic online state */}
                {isAuthenticated ? (
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-airbnb text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      {userInitial}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-charcoal text-white flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* Dropdown Menu Modal/Popover */}
              {menuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-surface-border py-2 z-50 text-sm font-medium animate-in fade-in zoom-in-95 duration-150 divide-y divide-surface-border">
                  {/* Authenticated User Header Card */}
                  {isAuthenticated ? (
                    <div className="px-4 py-3 bg-surface-card/40">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-bold text-charcoal truncate">{user?.name}</p>
                        <RoleBadge role={role} />
                      </div>
                      <p className="text-xs text-meta truncate">{user?.email}</p>
                    </div>
                  ) : null}

                  {/* Dynamic Navigation Options */}
                  <div className="py-1">
                    {!isAuthenticated ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        {/* Customer Links */}
                        {role === 'customer' && (
                          <>
                            <Link
                              to="/bookings"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                            >
                              <Briefcase className="w-4 h-4 text-meta" />
                              <span>My Bookings</span>
                            </Link>
                            <Link
                              to="/wishlists"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                            >
                              <Heart className="w-4 h-4 text-meta" />
                              <span>Wishlists</span>
                            </Link>
                          </>
                        )}

                        {/* Owner / Host Links */}
                        {role === 'owner' && (
                          <>
                            <Link
                              to="/host/dashboard"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-charcoal font-semibold transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-airbnb" />
                              <span>Host Dashboard</span>
                            </Link>
                            <Link
                              to="/host/properties"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                            >
                              <HomeIcon className="w-4 h-4 text-meta" />
                              <span>Manage Listings</span>
                            </Link>
                            <Link
                              to="/host/bookings"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                            >
                              <CalendarDays className="w-4 h-4 text-meta" />
                              <span>Reservations</span>
                            </Link>
                            <Link
                              to="/host/properties/new"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                            >
                              <PlusCircle className="w-4 h-4 text-meta" />
                              <span>Create New Listing</span>
                            </Link>
                             <Link
                              to="/host/coupons"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                            >
                              <Tag className="w-4 h-4 text-meta" />
                              <span>Promotions & Coupons</span>
                            </Link>
                          </>
                        )}

                        {/* Admin Links */}
                        {role === 'admin' && (
                          <>
                            <Link
                              to="/admin/dashboard"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-indigo-700 font-bold transition-colors"
                            >
                              <ShieldAlert className="w-4 h-4 text-indigo-600" />
                              <span>Admin Console</span>
                            </Link>
                            <Link
                              to="/admin/users"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                            >
                              <User className="w-4 h-4 text-meta" />
                              <span>User Management</span>
                            </Link>
                            <Link
                              to="/admin/properties"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                            >
                              <HomeIcon className="w-4 h-4 text-meta" />
                              <span>Property Moderation</span>
                            </Link>
                            <Link
                              to="/admin/bookings"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                            >
                              <Briefcase className="w-4 h-4 text-meta" />
                              <span>Global Bookings</span>
                            </Link>
                             <Link
                              to="/admin/coupons"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                            >
                              <Tag className="w-4 h-4 text-meta" />
                              <span>Promotional Coupons</span>
                            </Link>
                          </>
                        )}

                        <Link
                          to="/profile"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                        >
                          <Settings className="w-4 h-4 text-meta" />
                          <span>Account Settings</span>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* General Links & Logout */}
                  <div className="py-1">
                    {!isAuthenticated && (
                      <Link
                        to="/register?role=owner"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 hover:bg-surface-card text-charcoal transition-colors"
                      >
                        Airbnb your home
                      </Link>
                    )}

                    <a
                      href="#help"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 hover:bg-surface-card text-meta transition-colors"
                    >
                      Help Center
                    </a>

                    {isAuthenticated && (
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 hover:bg-rose-50 text-rose-600 font-semibold transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
