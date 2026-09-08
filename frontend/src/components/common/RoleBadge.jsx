import { Shield, Home as HomeIcon, Compass } from 'lucide-react';

export default function RoleBadge({ role, className = '' }) {
  if (!role) return null;

  switch (role) {
    case 'admin':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm ${className}`}
        >
          <Shield className="w-3 h-3 text-indigo-600 stroke-[2.5]" />
          Admin
        </span>
      );

    case 'owner':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-airbnb-light text-airbnb border border-airbnb/20 shadow-sm ${className}`}
        >
          <HomeIcon className="w-3 h-3 text-airbnb stroke-[2.5]" />
          Host
        </span>
      );

    case 'customer':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm ${className}`}
        >
          <Compass className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
          Guest
        </span>
      );
  }
}
