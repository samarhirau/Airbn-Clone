import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Plus,
  Copy,
  Check,
  Calendar,
  DollarSign,
  Percent,
  RefreshCw,
  Loader2,
  X,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Coupons() {
  const { user, role } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // Default dates: today and 3 months from today
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minBookingAmount: 50,
    maxDiscount: 100,
    validFrom: todayStr,
    validUntil: defaultUntil,
    maxUses: 50,
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons');
      setCoupons(res?.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon ${code} copied to clipboard!`, { className: 'airbnb-toast' });
    setTimeout(() => setCopiedCode(''), 2500);
  };

  const handleToggleActive = async (coupon) => {
    setTogglingId(coupon._id);
    try {
      const res = await api.patch(`/coupons/${coupon._id}/toggle`);
      const updated = res?.data || { ...coupon, isActive: !coupon.isActive };
      setCoupons((prev) =>
        prev.map((c) => (c._id === coupon._id ? { ...c, isActive: updated.isActive } : c))
      );
      toast.success(
        `Coupon ${coupon.code} is now ${updated.isActive ? 'Active' : 'Deactivated'}`,
        { className: 'airbnb-toast' }
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minBookingAmount: Number(formData.minBookingAmount) || 0,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        isActive: true,
      };

      if (formData.maxDiscount && formData.discountType === 'percentage') {
        payload.maxDiscount = Number(formData.maxDiscount);
      }
      if (formData.maxUses) {
        payload.maxUses = Number(formData.maxUses);
      }

      const res = await api.post('/coupons', payload);
      const newCoupon = res?.data || res;
      setCoupons((prev) => [newCoupon, ...prev]);
      setShowCreateModal(false);
      toast.success(`Coupon ${newCoupon.code} created successfully!`, {
        className: 'airbnb-toast',
      });
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 15,
        minBookingAmount: 50,
        maxDiscount: 100,
        validFrom: todayStr,
        validUntil: defaultUntil,
        maxUses: 50,
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-card/40 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="pb-8 border-b border-surface-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black text-charcoal tracking-tight">
                Promotions & Coupons
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase">
                {role === 'admin' ? 'Platform Wide' : 'Host Suite'}
              </span>
            </div>
            <p className="text-sm text-meta">
              Generate promotional discount codes, manage validity windows, and track redemption.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCoupons}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-surface-border text-charcoal hover:bg-neutral-50 shadow-xs transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-airbnb hover:bg-airbnb-dark text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="mt-8 bg-white rounded-3xl border border-surface-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-surface-border text-meta uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-4 px-6">Coupon Code</th>
                  <th className="py-4 px-6">Discount Rate</th>
                  <th className="py-4 px-6">Min Booking / Cap</th>
                  <th className="py-4 px-6">Usage Progress</th>
                  <th className="py-4 px-6">Validity Window</th>
                  <th className="py-4 px-6 text-right">Status / Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {loading && coupons.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-meta">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-airbnb" />
                      <span>Loading active coupons...</span>
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-meta">
                      <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-bold text-charcoal text-sm">No coupons found</p>
                      <p className="text-xs text-meta mt-0.5">
                        Create your first promotional discount code to boost bookings.
                      </p>
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => {
                    const isToggling = togglingId === coupon._id;
                    const isCopied = copiedCode === coupon.code;
                    const maxUsesStr = coupon.maxUses ? `${coupon.usedCount} / ${coupon.maxUses}` : `${coupon.usedCount} (unlimited)`;

                    return (
                      <tr
                        key={coupon._id}
                        className={`hover:bg-neutral-50/70 transition-colors ${
                          !coupon.isActive ? 'bg-neutral-50/40 opacity-75' : ''
                        }`}
                      >
                        {/* Code Pill */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-neutral-100 text-charcoal border border-neutral-200 uppercase tracking-wider">
                              {coupon.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(coupon.code)}
                              className="p-1 rounded text-meta hover:text-charcoal transition-colors cursor-pointer"
                              title="Copy code"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Discount Value */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 font-black text-sm text-emerald-600">
                            {coupon.discountType === 'percentage' ? (
                              <>
                                <Percent className="w-3.5 h-3.5" />
                                {coupon.discountValue}% OFF
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-3.5 h-3.5" />
                                {formatPrice(coupon.discountValue)} OFF
                              </>
                            )}
                          </span>
                        </td>

                        {/* Min Booking */}
                        <td className="py-4 px-6 text-meta">
                          <p className="font-medium text-charcoal">
                            Min: {formatPrice(coupon.minBookingAmount || 0)}
                          </p>
                          {coupon.maxDiscount && (
                            <p className="text-[11px] text-meta">
                              Cap: {formatPrice(coupon.maxDiscount)}
                            </p>
                          )}
                        </td>

                        {/* Usage Progress */}
                        <td className="py-4 px-6">
                          <span className="font-bold text-charcoal">{maxUsesStr}</span>
                          <span className="text-[11px] text-meta block">redeemed</span>
                        </td>

                        {/* Validity Dates */}
                        <td className="py-4 px-6 text-meta font-medium">
                          <div className="flex items-center gap-1">
                            <span>{new Date(coupon.validFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span>→</span>
                            <span>{new Date(coupon.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </td>

                        {/* Active Toggle */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            disabled={isToggling}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 ${
                              coupon.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-neutral-100 text-meta border border-neutral-200 hover:bg-neutral-200'
                            }`}
                          >
                            {isToggling ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : coupon.isActive ? (
                              <span>Active</span>
                            ) : (
                              <span>Disabled</span>
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
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-surface-border animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-charcoal">Create Promotional Coupon</h3>
                  <p className="text-xs text-meta">Guests can apply this code during reservation</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-meta transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })
                  }
                  className="w-full px-4 py-2.5 font-mono uppercase font-bold text-sm border border-surface-border rounded-xl focus:border-charcoal outline-none bg-neutral-50"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs font-bold border border-surface-border rounded-xl focus:border-charcoal outline-none bg-white cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1">
                    Value {formData.discountType === 'percentage' ? '(%)' : '($ USD)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'percentage' ? '100' : '10000'}
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm font-bold border border-surface-border rounded-xl focus:border-charcoal outline-none bg-white"
                  />
                </div>
              </div>

              {/* Minimum Booking & Max Discount Cap */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1">
                    Min Booking ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minBookingAmount}
                    onChange={(e) => setFormData({ ...formData, minBookingAmount: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-surface-border rounded-xl focus:border-charcoal outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1">
                    Max Uses (Cap)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-surface-border rounded-xl focus:border-charcoal outline-none bg-white"
                  />
                </div>
              </div>

              {/* Validity Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-medium border border-surface-border rounded-xl focus:border-charcoal outline-none bg-white cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-medium border border-surface-border rounded-xl focus:border-charcoal outline-none bg-white cursor-pointer"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/3 py-3 rounded-xl border border-surface-border text-xs font-bold text-charcoal hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-2/3 py-3 rounded-xl bg-airbnb hover:bg-airbnb-dark text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Publish Coupon</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
