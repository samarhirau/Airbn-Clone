import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  Shield, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import RoleBadge from '../../components/common/RoleBadge';
import AdminSubNav from '../../components/admin/AdminSubNav';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { user, action: 'deactivate' | 'activate' }

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (debouncedSearch) params.q = debouncedSearch;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.isActive = statusFilter;

      const res = await api.get('/admin/users', { params });
      setUsers(res?.data || []);
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
    fetchUsers();
  }, [pagination.page, debouncedSearch, roleFilter, statusFilter]);

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.role === newRole) return;
    const isSelf = targetUser._id === currentUser?._id || targetUser._id === currentUser?.id;
    if (isSelf) {
      toast.error('You cannot change the role of your own account.');
      return;
    }

    setUpdatingId(targetUser._id);
    try {
      const res = await api.patch(`/admin/users/${targetUser._id}`, { role: newRole });
      toast.success(`Role for ${targetUser.name} updated to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    const isSelf = targetUser._id === currentUser?._id || targetUser._id === currentUser?.id;
    if (isSelf) {
      toast.error('You cannot deactivate your own account.');
      return;
    }

    // Prompt confirmation before deactivation
    if (targetUser.isActive) {
      setConfirmModal({
        user: targetUser,
        action: 'deactivate',
      });
      return;
    }

    // Direct activation
    executeStatusChange(targetUser, true);
  };

  const executeStatusChange = async (targetUser, newStatus) => {
    setUpdatingId(targetUser._id);
    setConfirmModal(null);

    try {
      await api.patch(`/admin/users/${targetUser._id}`, { isActive: newStatus });
      toast.success(
        `User ${targetUser.name} has been ${newStatus ? 'activated' : 'deactivated'}.`
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, isActive: newStatus } : u))
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
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
              User Directory & Permissions
            </h1>
            <p className="text-sm text-meta">
              Audit all registered accounts, elevate roles, and moderate platform access.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-surface-border rounded-xl text-xs font-bold text-charcoal shadow-xs hover:bg-neutral-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 bg-white p-4 rounded-2xl border border-surface-border shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-meta absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-surface-border rounded-xl text-xs font-medium text-charcoal outline-none focus:ring-1 focus:ring-charcoal transition-all"
            />
          </div>

          {/* Role and Status Selectors */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 bg-neutral-50 border border-surface-border rounded-xl text-xs font-semibold text-charcoal outline-none cursor-pointer hover:bg-neutral-100 transition-colors"
            >
              <option value="">All Roles</option>
              <option value="customer">Guests (Customers)</option>
              <option value="owner">Hosts (Owners)</option>
              <option value="admin">Administrators</option>
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
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            {(searchQuery || roleFilter || statusFilter) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="mt-6 bg-white rounded-3xl border border-surface-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-surface-border text-meta uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-4 px-6">User / Account</th>
                  <th className="py-4 px-6">System Role</th>
                  <th className="py-4 px-6">Access Status</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-meta">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      <span>Loading user records...</span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-meta">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-bold text-charcoal text-sm">No users found</p>
                      <p className="text-xs text-meta mt-0.5">Try refining your search query or filters.</p>
                    </td>
                  </tr>
                ) : (
                  users.map((targetUser) => {
                    const isSelf =
                      targetUser._id === currentUser?._id || targetUser._id === currentUser?.id;
                    const isUpdating = updatingId === targetUser._id;
                    const initial = targetUser.name ? targetUser.name.charAt(0).toUpperCase() : 'U';

                    return (
                      <tr
                        key={targetUser._id}
                        className={`hover:bg-neutral-50/70 transition-colors ${
                          !targetUser.isActive ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        {/* User Profile */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-charcoal text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs relative">
                              {targetUser.avatar ? (
                                <img
                                  src={targetUser.avatar}
                                  alt={targetUser.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                initial
                              )}
                              {targetUser.isActive ? (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                              ) : (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-charcoal text-sm truncate">
                                  {targetUser.name}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 uppercase">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-meta text-[11px] truncate">
                                <span>{targetUser.email}</span>
                                {targetUser.isGoogleAuth && (
                                  <span className="px-1.5 py-0.2 rounded bg-neutral-100 text-[10px] font-semibold">
                                    Google
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Selector */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <RoleBadge role={targetUser.role} />

                            <select
                              value={targetUser.role}
                              disabled={isSelf || isUpdating}
                              onChange={(e) => handleRoleChange(targetUser, e.target.value)}
                              className="px-2 py-1 bg-white border border-surface-border rounded-lg text-xs font-semibold text-charcoal outline-none disabled:opacity-50 cursor-pointer hover:bg-neutral-50 transition-colors"
                              title={isSelf ? 'Self-guard: You cannot change your own role' : 'Change role'}
                            >
                              <option value="customer">Guest</option>
                              <option value="owner">Host</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          {targetUser.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Suspended</span>
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-6 text-meta font-medium">
                          {targetUser.createdAt
                            ? new Date(targetUser.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>

                        {/* Moderation Actions */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleToggleStatus(targetUser)}
                            disabled={isSelf || isUpdating}
                            title={
                              isSelf
                                ? 'Self-guard: You cannot deactivate yourself'
                                : targetUser.isActive
                                ? 'Deactivate account'
                                : 'Activate account'
                            }
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              targetUser.isActive
                                ? 'bg-white hover:bg-rose-50 text-rose-600 border border-rose-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            }`}
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                            ) : targetUser.isActive ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
                          </button>
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
              Showing {users.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              accounts
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1 || loading}
                className="p-2 rounded-xl bg-white border border-surface-border text-charcoal hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
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
                className="p-2 rounded-xl bg-white border border-surface-border text-charcoal hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal before deactivation */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-charcoal mb-1">
              Deactivate User Account?
            </h3>
            <p className="text-xs text-meta mb-4 leading-relaxed">
              Are you sure you want to deactivate{' '}
              <strong className="text-charcoal">{confirmModal.user.name}</strong> (
              {confirmModal.user.email})? This immediately revokes their active sessions and prevents
              them from signing in or booking until re-enabled.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-bold text-charcoal hover:bg-neutral-100 border border-surface-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => executeStatusChange(confirmModal.user, false)}
                className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all cursor-pointer"
              >
                Deactivate Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
