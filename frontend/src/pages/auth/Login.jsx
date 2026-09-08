import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api, { getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import GoogleAuthButton from '../../components/common/GoogleAuthButton';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, role } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Target redirect destination
  const from = location.state?.from?.pathname || searchParams.get('redirect') || null;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (from) {
        navigate(from, { replace: true });
      } else if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'owner') {
        navigate('/host/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, role, from, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setFormData({
      email: demoEmail,
      password: demoPassword,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      const user = response?.data?.user || response?.user;
      const accessToken = response?.data?.accessToken || response?.accessToken;

      if (!user || !accessToken) {
        throw new Error('Invalid response received from authentication server.');
      }

      login(user, accessToken);

      // Determine redirect path
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'owner') {
        navigate('/host/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg, { className: 'airbnb-toast' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-card/30">
      <div className="w-full max-w-md bg-white rounded-3xl border border-surface-border shadow-xl p-8 sm:p-10 transition-all">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-airbnb/10 text-airbnb flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 stroke-[2.4]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            Welcome to StayHub
          </h1>
          <p className="mt-2 text-sm text-meta">
            Log in to manage your bookings, listings, and trips.
          </p>
        </div>

        {/* Demo Accounts Quick-Fill Pill Bar */}
        <div className="mb-6 p-3.5 bg-surface-card rounded-2xl border border-surface-border">
          <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal mb-2">
            <Sparkles className="w-3.5 h-3.5 text-airbnb" />
            <span>Quick Demo Credentials</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('customer@stayhub.dev', 'Customer@12345')}
              className="px-2 py-1.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-surface-border rounded-xl text-xs font-semibold text-charcoal transition-all text-center shadow-xs"
            >
              Guest
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('owner@stayhub.dev', 'Owner@12345')}
              className="px-2 py-1.5 bg-white hover:bg-rose-50 hover:border-airbnb/40 border border-surface-border rounded-xl text-xs font-semibold text-charcoal transition-all text-center shadow-xs"
            >
              Host
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@stayhub.dev', 'Admin@12345')}
              className="px-2 py-1.5 bg-white hover:bg-indigo-50 hover:border-indigo-300 border border-surface-border rounded-xl text-xs font-semibold text-charcoal transition-all text-center shadow-xs"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 animate-in fade-in">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-meta">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-border focus:border-charcoal focus:ring-1 focus:ring-charcoal outline-none text-sm font-medium text-charcoal transition-all bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-meta">
                Password
              </label>
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  toast('Demo password reset: Use demo pills above or email admin.', {
                    icon: 'ℹ️',
                    className: 'airbnb-toast',
                  });
                }}
                className="text-xs font-semibold text-airbnb hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-meta">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-surface-border focus:border-charcoal focus:ring-1 focus:ring-charcoal outline-none text-sm font-medium text-charcoal transition-all bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-meta hover:text-charcoal transition-colors"
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-airbnb hover:bg-airbnb-dark active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>


        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2.5 text-meta font-semibold">or</span>
          </div>
        </div>

        {/* Google Authentication */}
        <GoogleAuthButton text="Continue with Google" />

        {/* Card Footer */}
        <div className="mt-8 pt-6 border-t border-surface-border text-center">
          <p className="text-sm text-meta font-normal">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-charcoal underline hover:text-airbnb transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
