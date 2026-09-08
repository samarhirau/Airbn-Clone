import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Briefcase, 
  ShieldCheck, 
  ArrowLeft,
  Activity,
  Tag
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminSubNav() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    {
      label: 'Overview & Metrics',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'User Directory',
      path: '/admin/users',
      icon: Users,
    },
    {
      label: 'Listing Moderation',
      path: '/admin/properties',
      icon: Building2,
    },
    {
      label: 'Global Bookings',
      path: '/admin/bookings',
      icon: Briefcase,
    },
    {
      label: 'Promotions',
      path: '/admin/coupons',
      icon: Tag,
    },
  ];

  return (
    <div className="bg-white border-b border-surface-border sticky top-20 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Left Title & Status */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-meta hover:text-charcoal px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </Link>

            <div className="h-4 w-px bg-surface-border hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-charcoal tracking-tight">Admin Console</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-medium text-meta">System Aggregation Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-charcoal/80 hover:text-charcoal hover:bg-neutral-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-meta'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
