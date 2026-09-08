import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Building2,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Home,
  DollarSign
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';
import AdminSubNav from '../../components/admin/AdminSubNav';
import toast from 'react-hot-toast';

const PROPERTY_TYPES = [
  'apartment',
  'house',
  'villa',
  'cabin',
  'condo',
  'cottage',
  'loft',
  'studio',
  'other',
];

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (debouncedSearch) params.q = debouncedSearch;
      if (typeFilter) params.propertyType = typeFilter;
      if (statusFilter !== '') params.isActive = statusFilter;

      const res = await api.get('/admin/properties', { params });
      setProperties(res?.data || []);
      if (res?.pagination) {
        setPagination((prev) => ({
          ...prev,
          page: res.pagination.page,
          limit: res.pagination.limit,
          total: res.pagination.total,
          totalPages: res.pagination.totalPages,
        }));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [pagination.page, debouncedSearch, typeFilter, statusFilter]);

  const handleToggleActive = async (property) => {
    const newStatus = !property.isActive;
    setUpdatingId(property._id);

    try {
      await api.patch(`/admin/properties/${property._id}`, { isActive: newStatus });
      toast.success(
        `Listing "${property.title}" is now ${newStatus ? 'Active & Published' : 'Delisted / Inactive'}.`
      );
      setProperties((prev) =>
        prev.map((p) => (p._id === property._id ? { ...p, isActive: newStatus } : p))
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-surface-card/40 pb-16">
      <AdminSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 gap-4 border-b border-surface-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
              Property Inventory Moderation
            </h1>
            <p className="text-sm text-meta">
              Moderate listings, audit host portfolios, and toggle catalog visibility.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchProperties}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-surface-border rounded-xl text-xs font-bold text-charcoal shadow-xs hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-6 bg-white p-4 rounded-2xl border border-surface-border shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-meta absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, city, or area..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-surface-border rounded-xl text-xs font-medium text-charcoal outline-none focus:ring-1 focus:ring-charcoal transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 bg-neutral-50 border border-surface-border rounded-xl text-xs font-semibold text-charcoal outline-none cursor-pointer hover:bg-neutral-100 transition-colors"
            >
              <option value="">All Property Types</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 bg-neutral-50 border border-surface-border rounded-xl text-xs font-semibold text-charcoal outline-none cursor-pointer hover:bg-neutral-100 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="true">Active & Published</option>
              <option value="false">Delisted / Inactive</option>
            </select>

            {(searchQuery || typeFilter || statusFilter) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Listings Moderation Table */}
        <div className="mt-6 bg-white rounded-3xl border border-surface-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-surface-border text-meta uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-4 px-6">Listing / Property</th>
                  <th className="py-4 px-6">Host / Owner</th>
                  <th className="py-4 px-6">Pricing</th>
                  <th className="py-4 px-6">Live Occupancy</th>
                  <th className="py-4 px-6">Listing Status</th>
                  <th className="py-4 px-6 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {loading && properties.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-meta">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      <span>Loading property inventory...</span>
                    </td>
                  </tr>
                ) : properties.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-meta">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-bold text-charcoal text-sm">No properties found</p>
                      <p className="text-xs text-meta mt-0.5">
                        Try adjusting your filters or search terms.
                      </p>
                    </td>
                  </tr>
                ) : (
                  properties.map((property) => {
                    const isUpdating = updatingId === property._id;
                    const imageUrl =
                      property.images?.[0]?.url ||
                      property.images?.[0] ||
                      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=300&q=80';

                    const isOccupied = property.occupancy?.occupied;

                    return (
                      <tr
                        key={property._id}
                        className={`hover:bg-neutral-50/70 transition-colors ${
                          !property.isActive ? 'bg-neutral-100/30' : ''
                        }`}
                      >
                        {/* Property Thumbnail & Info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-12 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-surface-border shadow-2xs">
                              <img
                                src={imageUrl}
                                alt={property.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <Link
                                to={`/properties/${property._id}`}
                                target="_blank"
                                className="font-extrabold text-charcoal hover:text-indigo-600 text-sm truncate block transition-colors"
                              >
                                {property.title}
                              </Link>
                              <div className="flex items-center gap-1.5 text-meta text-[11px] truncate mt-0.5">
                                <MapPin className="w-3 h-3 text-meta shrink-0" />
                                <span>
                                  {property.location?.city}, {property.location?.country}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-neutral-100 text-[10px] font-semibold uppercase text-meta">
                                  {property.propertyType}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Owner / Host */}
                        <td className="py-4 px-6">
                          <div className="min-w-0">
                            <p className="font-bold text-charcoal truncate">
                              {property.owner?.name || 'Unknown Host'}
                            </p>
                            <p className="text-[11px] text-meta truncate">
                              {property.owner?.email || '—'}
                            </p>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-6">
                          <span className="font-black text-charcoal text-sm">
                            {formatPrice(property.pricePerNight)}
                          </span>
                          <span className="text-meta text-[11px] block">/ night</span>
                        </td>

                        {/* Occupancy Status */}
                        <td className="py-4 px-6">
                          {isOccupied ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Occupied Now
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Available
                            </span>
                          )}
                        </td>

                        {/* Active / Delisted Badge */}
                        <td className="py-4 px-6">
                          {property.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Published</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-meta border border-neutral-200">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Delisted</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/properties/${property._id}`}
                              target="_blank"
                              className="p-2 rounded-xl text-charcoal hover:bg-neutral-100 transition-colors shadow-2xs border border-surface-border"
                              title="Preview Public Listing"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-meta" />
                            </Link>

                            <button
                              onClick={() => handleToggleActive(property)}
                              disabled={isUpdating}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                                property.isActive
                                  ? 'bg-white hover:bg-rose-50 text-rose-600 border border-rose-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                              ) : property.isActive ? (
                                'Delist'
                              ) : (
                                'Publish'
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="py-4 px-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-meta bg-neutral-50/50">
            <span>
              Showing {properties.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              properties
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1 || loading}
                className="p-2 rounded-xl bg-white border border-surface-border text-charcoal hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-charcoal px-2">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>

              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="p-2 rounded-xl bg-white border border-surface-border text-charcoal hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
