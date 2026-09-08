import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  Loader2,
  Camera,
  LogOut,
  Home as HomeIcon,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import RoleBadge from '../../components/common/RoleBadge';
import toast from 'react-hot-toast';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, role, updateUser, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: '',
    bio: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/me');
      const profile = res?.data?.user || res?.user || user;
      if (profile) {
        setFormData({
          name: profile.name || '',
          phone: profile.phone || '',
          avatar: profile.avatar || '',
          bio: profile.bio || '',
        });
        updateUser(profile);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {};
      if (formData.name?.trim()) payload.name = formData.name.trim();
      if (formData.phone !== undefined) payload.phone = formData.phone.trim();
      if (formData.avatar !== undefined) {
        const cleanAvatar = formData.avatar.trim();
        if (cleanAvatar) payload.avatar = cleanAvatar;
      }
      if (formData.bio !== undefined) payload.bio = formData.bio.trim();

      const res = await api.patch('/auth/me', payload);
      const updatedUser = res?.data?.user || res?.user || { ...user, ...payload };
      updateUser(updatedUser);

      toast.success('Profile updated successfully!', {
        className: 'airbnb-toast',
      });
      setIsEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-surface-border shadow-sm">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-charcoal">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-charcoal mb-2">Account Settings</h2>
          <p className="text-sm text-meta mb-6">
            Please log in to manage your profile, view contact details, and edit your account settings.
          </p>
          <Link
            to="/login"
            className="block w-full py-3.5 px-4 rounded-xl bg-airbnb hover:bg-airbnb-dark text-white font-bold text-sm shadow-md transition-all"
          >
            Log in to StayHub
          </Link>
        </div>
      </div>
    );
  }

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '2026';

  return (
    <div className="min-h-screen bg-surface-card/40 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Page Header */}
        <div className="pb-8 border-b border-surface-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-charcoal tracking-tight">
              Account Profile
            </h1>
            <p className="text-sm text-meta mt-1">
              Manage your personal information, contact methods, and system security
            </p>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-border hover:bg-neutral-50 text-xs font-bold text-charcoal shadow-xs transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-meta" />
            <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column: User Card & Badges */}
          <div className="space-y-6">
            {/* Identity Card */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-surface-border shadow-sm text-center">
              <div className="relative w-28 h-28 mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-charcoal text-white font-black text-3xl flex items-center justify-center shadow-md overflow-hidden border-4 border-white">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <h2 className="text-xl font-black text-charcoal">{user?.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-1.5 mb-4">
                <RoleBadge role={role} />
              </div>

              <div className="pt-4 border-t border-neutral-100 space-y-2.5 text-left text-xs">
                <div className="flex items-center gap-2.5 text-charcoal">
                  <Mail className="w-4 h-4 text-meta shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2.5 text-charcoal">
                    <Phone className="w-4 h-4 text-meta shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-meta">
                  <Calendar className="w-4 h-4 text-meta shrink-0" />
                  <span>Joined {memberSince}</span>
                </div>
              </div>
            </div>

            {/* Verifications Card */}
            <div className="bg-white p-6 rounded-3xl border border-surface-border shadow-sm">
              <h3 className="font-extrabold text-charcoal text-sm mb-3">StayHub Verification</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Identity Confirmed</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Email Address Verified</span>
                </div>
                {user?.isGoogleAuth && (
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Google OAuth Connected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Role transition action */}
            {role === 'customer' && (
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-6 rounded-3xl border border-rose-100 shadow-sm">
                <h3 className="font-black text-charcoal text-base mb-1">Airbnb your home</h3>
                <p className="text-xs text-meta mb-4 leading-relaxed">
                  Earn extra income and unlock new opportunities by hosting your place on StayHub.
                </p>
                <Link
                  to="/register?role=owner"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-airbnb hover:bg-airbnb-dark text-white font-bold text-xs shadow-sm transition-all"
                >
                  <span>Become a Host</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Bio & Editable Information */}
          <div className="lg:col-span-2 space-y-6">
            {isEditing ? (
              /* Profile Edit Form */
              <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-surface-border shadow-sm space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                  <h2 className="text-lg font-black text-charcoal">Edit Personal Details</h2>
                  <span className="text-xs text-meta font-medium">Fields with live persistence</span>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ada Lovelace"
                    className="w-full px-4 py-3 rounded-xl border border-surface-border focus:border-charcoal focus:ring-1 focus:ring-charcoal outline-none text-sm font-medium text-charcoal transition-all bg-neutral-50/50 focus:bg-white"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 012-3456"
                    className="w-full px-4 py-3 rounded-xl border border-surface-border focus:border-charcoal focus:ring-1 focus:ring-charcoal outline-none text-sm font-medium text-charcoal transition-all bg-neutral-50/50 focus:bg-white"
                  />
                </div>

                {/* Avatar Image URL */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-4 py-3 rounded-xl border border-surface-border focus:border-charcoal focus:ring-1 focus:ring-charcoal outline-none text-sm font-medium text-charcoal transition-all bg-neutral-50/50 focus:bg-white"
                  />
                  <p className="text-[11px] text-meta mt-1">
                    Paste any public image URL (Unsplash, Cloudinary, etc.) to set your photo.
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-meta">
                      About You (Bio)
                    </label>
                    <span className="text-[11px] text-meta">
                      {formData.bio.length} / 500 characters
                    </span>
                  </div>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    maxLength={500}
                    rows={4}
                    placeholder="Tell other hosts and guests about your interests, travel style, and background..."
                    className="w-full px-4 py-3 rounded-xl border border-surface-border focus:border-charcoal focus:ring-1 focus:ring-charcoal outline-none text-sm font-medium text-charcoal transition-all bg-neutral-50/50 focus:bg-white resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-1/3 py-3 px-4 rounded-xl border border-surface-border text-xs font-bold text-charcoal hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-2/3 py-3 px-4 rounded-xl bg-charcoal hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Profile Details Display */
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-surface-border shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-charcoal mb-2">About</h2>
                  <p className="text-sm text-charcoal leading-relaxed whitespace-pre-line">
                    {user?.bio ||
                      'No bio added yet. Tell hosts and guests a little about yourself by editing your profile.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-neutral-100">
                  <h3 className="font-black text-charcoal text-base mb-4">Quick Navigation</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {role === 'customer' && (
                      <Link
                        to="/bookings"
                        className="p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-surface-border transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-charcoal text-sm">My Bookings</p>
                          <p className="text-xs text-meta">Upcoming trips & past receipts</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-meta" />
                      </Link>
                    )}

                    {role === 'owner' && (
                      <Link
                        to="/host/dashboard"
                        className="p-4 rounded-2xl bg-rose-50/50 hover:bg-rose-50 border border-rose-100 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-airbnb text-sm">Host Operations</p>
                          <p className="text-xs text-meta">Reservations & listings</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-airbnb" />
                      </Link>
                    )}

                    {role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        className="p-4 rounded-2xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-indigo-700 text-sm">Admin Console</p>
                          <p className="text-xs text-meta">Metrics & moderation</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-indigo-600" />
                      </Link>
                    )}

                    <Link
                      to="/wishlists"
                      className="p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-surface-border transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-charcoal text-sm">Wishlists</p>
                        <p className="text-xs text-meta">Saved properties & favorites</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-meta" />
                    </Link>
                  </div>
                </div>

                {/* Session Logout Action */}
                <div className="pt-6 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-charcoal">Active Session</p>
                    <p className="text-[11px] text-meta">Signed in via StayHub Secure JWT</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
