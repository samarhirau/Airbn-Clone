import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api, { getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

export default function GoogleAuthButton({ role = 'customer', text = 'Continue with Google' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const buttonContainerRef = useRef(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const from = location.state?.from?.pathname || searchParams.get('redirect') || null;

  // Handle successful Google authentication payload
  const handleGoogleSuccess = async (idToken) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/google', {
        idToken,
        role,
      });

      const user = response?.data?.user || response?.user;
      const accessToken = response?.data?.accessToken || response?.accessToken;

      if (!user || !accessToken) {
        throw new Error('Google authentication succeeded but user session could not be established.');
      }

      login(user, accessToken);
      toast.success(`Signed in with Google as ${user.name}!`, { className: 'airbnb-toast' });

      // Navigate to intended destination
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
      toast.error(msg, { className: 'airbnb-toast' });
    } finally {
      setLoading(false);
    }
  };

  // Mount official Google Identity Services button
  useEffect(() => {
    if (!googleClientId) return;

    const initGsi = () => {
      if (!window.google?.accounts?.id) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (res) => {
            if (res?.credential) {
              handleGoogleSuccess(res.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (buttonContainerRef.current) {
          buttonContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            theme: 'outline',
            size: 'large',
            width: 360,
            text: 'continue_with',
            shape: 'rectangular',
          });
          setGoogleLoaded(true);
        }
        return true;
      } catch (err) {
        console.warn('Google Identity Services initialization warning:', err);
        return false;
      }
    };

    if (!initGsi()) {
      const interval = setInterval(() => {
        if (initGsi()) clearInterval(interval);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [googleClientId, role]);

  const handleFallbackClick = () => {
    if (loading) return;
    handleGoogleSuccess(`mock-google-token:googleuser@stayhub.dev:Google User`);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Official Google Rendered Button (avoids FedCM aborts and popup blocks) */}
      <div
        ref={buttonContainerRef}
        className={`w-full flex justify-center [&>div]:w-full ${googleLoaded ? 'block' : 'hidden'}`}
      />

      {/* Fallback button if Google SDK hasn't loaded or in dev */}
      {!googleLoaded && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-charcoal/20 hover:border-charcoal bg-white hover:bg-neutral-50 active:scale-[0.99] text-charcoal font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-charcoal" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>{text}</span>
        </button>
      )}
    </div>
  );
}
