import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, Compass, Home as HomeIcon, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api, { getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import GoogleAuthButton from '../../components/common/GoogleAuthButton';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, role: currentRole } = useAuth();

  // Role can be pre-selected via query param e.g. /register?role=owner
  const initialRole = searchParams.get('role') === 'owner' ? 'owner' : 'customer';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: initialRole,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (currentRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (currentRole === 'owner') {
        navigate('/host/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, currentRole, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
      };

      if (formData.phone.trim()) {
        payload.phone = formData.phone.trim();
      }

      const response = await api.post('/auth/register', payload);

      const user = response?.data?.user || response?.user;
      const accessToken = response?.data?.accessToken || response?.accessToken;

      if (!user || !accessToken) {
        throw new Error('Registration succeeded but session could not be established.');
      }

      login(user, accessToken);

      toast.success(
        formData.role === 'owner'
          ? 'Host account registered! Welcome to the Host community.'
          : 'Welcome to StayHub! Start exploring unique places to stay.',
        { className: 'airbnb-toast' }
      );

      // Role-based post-signup onboarding redirect
      if (user.role === 'owner') {
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

  const isPasswordLongEnough = formData.password.length >= 8;

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-card/30">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-surface-border shadow-xl p-8 sm:p-10 transition-all">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-meta">
            Join StayHub to book dreamy stays or list your properties.
          </p>
        </div>

        {/* Interactive Role Selector */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-2.5">
            I want to join as a
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Customer / Guest Card */}
            <div
              onClick={() => handleRoleSelect('customer')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
                formData.role === 'customer'
                  ? 'border-airbnb bg-airbnb-light/40 shadow-xs ring-2 ring-airbnb/20'
                  : 'border-surface-border hover:border-charcoal/30 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    formData.role === 'customer' ? 'bg-airbnb text-white' : 'bg-surface-card text-charcoal'
                  }`}
                >
                  <Compass className="w-4 h-4 stroke-[2.5]" />
                </div>
                {formData.role === 'customer' && (
                  <CheckCircle2 className="w-4 h-4 text-airbnb fill-airbnb/20" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-charcoal">Guest</p>
                <p className="text-xs text-meta mt-0.5 leading-snug">
                  Book unique places & explore the world.
                </p>
              </div>
            </div>

            {/* Owner / Host Card */}
            <div
              onClick={() => handleRoleSelect('owner')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
                formData.role === 'owner'
                  ? 'border-airbnb bg-airbnb-light/40 shadow-xs ring-2 ring-airbnb/20'
                  : 'border-surface-border hover:border-charcoal/30 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    formData.role === 'owner' ? 'bg-airbnb text-white' : 'bg-surface-card text-charcoal'
                  }`}
                >
                  <HomeIcon className="w-4 h-4 stroke-[2.5]" />
                </div>
                {formData.role === 'owner' && (
                  <CheckCircle2 className="w-4 h-4 text-airbnb fill-airbnb/20" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-charcoal">Host</p>
                <p className="text-xs text-meta mt-0.5 leading-snug">
                  List your place & earn hosting income.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 animate-in fade-in">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-meta">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Samar Hirau"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-border focus:border-charcoal focus:ring-1 focus:ring-charcoal outline-none text-sm font-medium text-charcoal transition-all bg-white"
              />
            </div>
          </div>

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
            <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
              Phone Number <span className="text-[11px] font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-meta">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 555-0199"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-border focus:border-charcoal focus:ring-1 focus:ring-charcoal outline-none text-sm font-medium text-charcoal transition-all bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-meta mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-meta">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                required
                minLength={8}
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
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  isPasswordLongEnough ? 'bg-emerald-500' : 'bg-meta/40'
                }`}
              />
              <span className="text-[11px] text-meta">
                {isPasswordLongEnough ? 'Password length meets requirements' : 'Must be at least 8 characters'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-meta pt-2 leading-relaxed">
            By selecting <span className="font-semibold text-charcoal">Agree and continue</span>, you agree to StayHub's{' '}
            <span className="underline cursor-pointer">Terms of Service</span> and{' '}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-airbnb hover:bg-airbnb-dark active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Agree and continue</span>
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

        {/* Google Authentication with Selected Role */}
        <GoogleAuthButton
          role={formData.role}
          text={`Continue with Google as ${formData.role === 'owner' ? 'Host' : 'Guest'}`}
        />
        {/* Card Footer */}
        <div className="mt-8 pt-6 border-t border-surface-border text-center">
          <p className="text-sm text-meta font-normal">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-charcoal underline hover:text-airbnb transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
