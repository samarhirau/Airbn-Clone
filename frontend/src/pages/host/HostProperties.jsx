import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Home as HomeIcon,
  MapPin,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Activity,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

export default function HostProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'inactive' | 'occupied'
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/owner/properties');
      const items = response?.data || response?.items || [];
      setProperties(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Toggle active/paused state
  const handleToggleStatus = async (property) => {
    const propId = property.id || property._id;
    const newStatus = !property.isActive;

    try {
      await api.patch(`/properties/${propId}`, { isActive: newStatus });
      setProperties((prev) =>
        prev.map((p) => ((p.id || p._id) === propId ? { ...p, isActive: newStatus } : p))
      );
      toast.success(newStatus ? 'Listing published and visible to guests' : 'Listing paused', {
        className: 'airbnb-toast',
      });
    } catch (err) {
      toast.error(getErrorMessage(err), { className: 'airbnb-toast' });
    }
  };

  // Delete property listing
  const handleDeleteProperty = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/properties/${deletingId}`);
      setProperties((prev) => prev.filter((p) => (p.id || p._id) !== deletingId));
      toast.success('Listing deleted successfully', { className: 'airbnb-toast' });
      setDeletingId(null);
    } catch (err) {
      toast.error(getErrorMessage(err), { className: 'airbnb-toast' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (activeFilter === 'active') return p.isActive;
      if (activeFilter === 'inactive') return !p.isActive;
      if (activeFilter === 'occupied') return Boolean(p.occupancy?.occupied);
      return true;
    });
  }, [properties, activeFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
            Manage Listings
          </h1>
          <p className="mt-1 text-sm text-meta">
            Control availability, edit details, and track live occupancy for your stays.
          </p>
        </div>

        <Link
          to="/host/properties/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-airbnb hover:bg-airbnb-dark text-white rounded-full font-bold text-sm shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Listing</span>
        </Link>
      </div>

      {/* 2. Filter Pills */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-4 mb-8 overflow-x-auto">
        {[
          { id: 'all', label: `All (${properties.length})` },
          { id: 'active', label: `Active (${properties.filter((p) => p.isActive).length})` },
          { id: 'inactive', label: `Paused (${properties.filter((p) => !p.isActive).length})` },
          { id: 'occupied', label: `Occupied Now (${properties.filter((p) => p.occupancy?.occupied).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-charcoal text-white shadow-xs'
                : 'bg-surface-card hover:bg-neutral-200/70 text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Listings Grid / Table */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-neutral-200 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center max-w-lg mx-auto">
          <p className="text-sm font-semibold text-rose-600 mb-4">{error}</p>
          <button
            onClick={fetchProperties}
            className="px-6 py-2.5 bg-charcoal text-white rounded-full text-xs font-semibold hover:bg-neutral-800 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-8 bg-surface-card/30 border border-surface-border rounded-3xl max-w-lg mx-auto">
          <HomeIcon className="w-12 h-12 text-meta mb-3" />
          <h3 className="text-xl font-bold text-charcoal mb-1">No listings found</h3>
          <p className="text-sm text-meta mb-6">
            {activeFilter === 'all'
              ? "You haven't listed any properties yet. Start your hosting journey today!"
              : `No listings match the "${activeFilter}" filter.`}
          </p>
          <Link
            to="/host/properties/new"
            className="px-6 py-3 bg-charcoal text-white rounded-full font-semibold text-sm hover:bg-neutral-800 transition-all"
          >
            Add your first listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
            const propId = property.id || property._id;
            const thumbnail =
              property.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80';
            const isOccupied = Boolean(property.occupancy?.occupied);

            return (
              <div
                key={propId}
                className="bg-white border border-surface-border rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Image & Status Overlays */}
                <div className="relative h-48 w-full bg-surface-card overflow-hidden">
                  <img
                    src={thumbnail}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                        property.isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-neutral-800/80 text-white backdrop-blur-xs'
                      }`}
                    >
                      {property.isActive ? 'Active' : 'Paused'}
                    </span>
                    {isOccupied && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-sm flex items-center gap-1.5">
                        <Activity className="w-3 h-3 animate-pulse" />
                        Occupied Now
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-meta mb-1">
                      <span className="capitalize font-semibold">{property.propertyType || 'Stay'}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-meta" />
                        {property.location?.city || 'Location'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-charcoal line-clamp-1">
                      {property.title}
                    </h3>

                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-charcoal">
                        {formatPrice(property.pricePerNight)}
                      </span>
                      <span className="text-xs text-meta">/ night</span>
                    </div>

                    {isOccupied && property.occupancy?.occupiedUntil && (
                      <p className="mt-2 text-xs font-medium text-indigo-700 bg-indigo-50 p-2 rounded-xl">
                        Guest checking out on{' '}
                        {new Date(property.occupancy.occupiedUntil).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-4 border-t border-surface-border flex items-center justify-between gap-2">
                    {/* Active/Pause Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(property)}
                      className="p-2 rounded-xl border border-surface-border hover:bg-surface-card text-charcoal transition-colors"
                      title={property.isActive ? 'Pause listing (hide from search)' : 'Activate listing'}
                    >
                      {property.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-meta" />}
                    </button>

                    {/* View Live */}
                    <Link
                      to={`/properties/${propId}`}
                      target="_blank"
                      className="p-2 rounded-xl border border-surface-border hover:bg-surface-card text-charcoal transition-colors"
                      title="View live listing"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    {/* Edit */}
                    <Link
                      to={`/host/properties/${propId}/edit`}
                      className="flex-1 py-2 px-3 rounded-xl bg-charcoal hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeletingId(propId)}
                      className="p-2 rounded-xl border border-surface-border hover:bg-rose-50 text-rose-600 transition-colors"
                      title="Delete listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 stroke-[2.4]" />
              <h3 className="text-lg font-bold text-charcoal">Delete Listing</h3>
            </div>
            <p className="text-sm text-meta leading-relaxed">
              Are you sure you want to permanently remove this property listing? Note: Properties with active bookings cannot be deleted (pause them instead).
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-full border border-surface-border text-charcoal font-semibold text-xs hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProperty}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
