import { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Wallet,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

export default function PaymentModal({ booking, onClose, onSuccess }) {
  if (!booking) return null;

  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'upi' | 'wallet'
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [error, setError] = useState('');

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('Jane Traveler');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  // UPI state
  const [upiId, setUpiId] = useState('traveler@okhdfcbank');

  const bookingId = booking.id || booking._id;
  const property = booking.property || {};
  const amount = booking.totalPrice || 0;

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  // Detect card brand
  const getCardBrand = (num) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'Amex';
    return 'Credit Card';
  };

  // Execute payment flow: Intent -> Verify
  const handlePay = async (e) => {
    e?.preventDefault();
    setProcessing(true);
    setError('');

    try {
      setProcessingStep('Initializing secure transaction...');
      const intentRes = await api.post('/payments/intent', {
        bookingId,
        paymentMethod: activeTab === 'upi' ? 'upi' : activeTab === 'wallet' ? 'wallet' : 'card',
      });

      const intentData = intentRes?.data || intentRes;
      const transactionId = intentData?.transactionId;

      if (!transactionId) {
        throw new Error('Could not establish transaction channel. Please try again.');
      }

      setProcessingStep('Authenticating 3D Secure / OTP gateway...');
      await new Promise((r) => setTimeout(r, 1200));

      setProcessingStep('Verifying funds with merchant bank...');
      const verifyRes = await api.post('/payments/verify', {
        transactionId,
        status: 'completed',
      });

      const verifyData = verifyRes?.data || verifyRes;
      const finalPayment = verifyData?.payment || {
        transactionId,
        amount,
        status: 'completed',
        paymentMethod: activeTab,
      };

      setPaymentSuccess(finalPayment);
      toast.success('Payment authorized! Reservation fully confirmed.', {
        className: 'airbnb-toast',
      });

      if (onSuccess) {
        onSuccess(finalPayment);
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg, { className: 'airbnb-toast' });
    } finally {
      setProcessing(false);
      setProcessingStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-surface-border">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-charcoal tracking-tight">
                Secure StayHub Checkout
              </h3>
              <p className="text-xs text-meta">256-bit encrypted reservation payment</p>
            </div>
          </div>

          {!processing && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-100 text-meta hover:text-charcoal transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6">
          {paymentSuccess ? (
            /* Success View */
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-2xl font-black text-charcoal tracking-tight">
                  Payment Successful!
                </h4>
                <p className="text-xs text-meta mt-1">
                  Your reservation is confirmed. Confirmation details sent to your registered email.
                </p>
              </div>

              <div className="bg-surface-card/60 p-5 rounded-2xl border border-surface-border text-left space-y-2.5 max-w-md mx-auto">
                <div className="flex justify-between text-xs">
                  <span className="text-meta font-medium">Transaction ID:</span>
                  <span className="font-mono font-bold text-charcoal">
                    {paymentSuccess.transactionId}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-meta font-medium">Amount Paid:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    {formatPrice(paymentSuccess.amount || amount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-meta font-medium">Payment Channel:</span>
                  <span className="capitalize font-bold text-charcoal">
                    {paymentSuccess.paymentMethod || activeTab}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-meta font-medium">Reservation Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Confirmed & Paid
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 bg-charcoal hover:bg-neutral-800 text-white font-bold text-sm rounded-full transition-all shadow-md cursor-pointer"
                >
                  View My Trips
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <>
              {/* Stay Summary Mini Card */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-card/50 border border-surface-border">
                <img
                  src={
                    property.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=300&q=80'
                  }
                  alt={property.title}
                  className="w-16 h-16 rounded-xl object-cover border border-surface-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-charcoal truncate">
                    {property.title || 'Vacation Stay'}
                  </h4>
                  <p className="text-[11px] text-meta">
                    {booking.numberOfNights || 1} nights · {booking.guests || 1} guest
                    {booking.guests > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs font-black text-charcoal mt-0.5">
                    Total Due: <span className="text-airbnb">{formatPrice(amount)}</span>
                  </p>
                </div>
              </div>

              {/* Payment Methods Selector Tabs */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('card')}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'card'
                        ? 'border-charcoal bg-charcoal text-white shadow-sm'
                        : 'border-surface-border bg-white text-charcoal hover:border-charcoal/40'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Credit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('upi')}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'upi'
                        ? 'border-charcoal bg-charcoal text-white shadow-sm'
                        : 'border-surface-border bg-white text-charcoal hover:border-charcoal/40'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('wallet')}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'wallet'
                        ? 'border-charcoal bg-charcoal text-white shadow-sm'
                        : 'border-surface-border bg-white text-charcoal hover:border-charcoal/40'
                    }`}
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Digital Wallet</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Credit / Debit Card Form with Interactive Visual Preview */}
              {activeTab === 'card' && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Visual Card Mockup */}
                  <div className="relative w-full h-40 sm:h-44 rounded-2xl bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-700 text-white p-5 flex flex-col justify-between shadow-xl overflow-hidden border border-neutral-700">
                    {/* Chip and Logo */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-7 rounded bg-amber-200/80 border border-amber-300 flex items-center justify-center shadow-xs">
                        <span className="w-4 h-3 rounded-xs border border-amber-400/60" />
                      </div>
                      <span className="font-black italic text-sm tracking-wider uppercase">
                        {getCardBrand(cardNumber)}
                      </span>
                    </div>

                    {/* Card Number */}
                    <p className="font-mono text-base sm:text-lg tracking-widest text-center my-auto font-bold">
                      {cardNumber || '•••• •••• •••• 4242'}
                    </p>

                    {/* Holder & Expiry */}
                    <div className="flex items-end justify-between text-xs">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">
                          Cardholder
                        </p>
                        <p className="font-semibold uppercase tracking-wide truncate max-w-[180px]">
                          {cardHolder || 'Jane Traveler'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">
                          Expires
                        </p>
                        <p className="font-mono font-semibold">{cardExpiry || 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Form Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-meta mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        className="w-full px-4 py-2.5 font-mono text-sm font-semibold border border-surface-border rounded-xl focus:border-charcoal outline-none bg-neutral-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-meta mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Name on card"
                        className="w-full px-4 py-2.5 text-sm font-medium border border-surface-border rounded-xl focus:border-charcoal outline-none bg-neutral-50/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-meta mb-1">
                          Expiry (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-4 py-2.5 text-sm font-mono font-semibold border border-surface-border rounded-xl focus:border-charcoal outline-none bg-neutral-50/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-meta mb-1">
                          CVV / CVC
                        </label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.slice(0, 4))}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full px-4 py-2.5 text-sm font-mono font-semibold border border-surface-border rounded-xl focus:border-charcoal outline-none bg-neutral-50/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: UPI & QR Code */}
              {activeTab === 'upi' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-surface-border flex items-center gap-4">
                    {/* Simulated High-Res QR */}
                    <div className="w-24 h-24 bg-white p-2 rounded-xl border border-surface-border shadow-xs flex items-center justify-center shrink-0">
                      <QrCode className="w-full h-full text-charcoal" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-charcoal">
                        Scan QR with any UPI App
                      </p>
                      <p className="text-[11px] text-meta mt-0.5">
                        Supports Google Pay, PhonePe, Paytm, BHIM, and all bank UPI apps.
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        Zero Processing Fee
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-meta mb-1">
                      Or Enter Virtual Payment Address (UPI ID)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@bank"
                      className="w-full px-4 py-2.5 font-medium text-sm border border-surface-border rounded-xl focus:border-charcoal outline-none bg-neutral-50/50"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['@okhdfcbank', '@oksbi', '@paytm', '@ybl'].map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => setUpiId(`traveler${handle}`)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-charcoal font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Digital Wallets */}
              {activeTab === 'wallet' && (
                <div className="space-y-3 animate-in fade-in">
                  <p className="text-xs text-meta">
                    Authorize payment using your linked browser wallet or fast 1-click providers:
                  </p>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handlePay}
                      disabled={processing}
                      className="w-full py-3 px-4 rounded-xl bg-black hover:bg-neutral-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <span>Pay with Apple Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePay}
                      disabled={processing}
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-50 text-charcoal font-bold text-xs border border-surface-border flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Google Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePay}
                      disabled={processing}
                      className="w-full py-3 px-4 rounded-xl bg-[#003087] hover:bg-[#002466] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <span>PayPal Express Checkout</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={processing}
                  className="w-full py-3.5 px-4 rounded-full bg-airbnb hover:bg-airbnb-dark text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{processingStep || 'Authorizing...'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay {formatPrice(amount)} & Confirm</span>
                    </>
                  )}
                </button>

                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-meta">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Guaranteed by StayHub Host & Guest Protection</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
